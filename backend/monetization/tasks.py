# backend/monetization/tasks.py
from celery import Celery
from celery.schedules import crontab
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List
import os

from .db import SessionLocal
from .services.payout import process_payout, mark_cycle_ready, LndClient
from .services.partners import settle_partner_settlements, get_partner_client
from .services.subscriptions import deactivate_expired_subscriptions, get_expiring_subscriptions
from .services.accounting import generate_revenue_report, update_community_fund
from .models import TontineCycle, PartnerSettlement, RevenueReport

logger = logging.getLogger(__name__)

# Celery configuration
celery = Celery(
    "sunusav_monetization",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
)

# Celery configuration
celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=1,
    task_acks_late=True,
)

@celery.task(bind=True, max_retries=3)
def run_scheduled_payout(self, cycle_id: str, group_verified: bool = False, user_recurring: bool = False):
    """
    Process a scheduled tontine cycle payout.
    
    Args:
        cycle_id: ID of the tontine cycle
        group_verified: Whether the group is verified
        user_recurring: Whether the user has recurring subscription
        
    Returns:
        Dict with payout results
    """
    db = SessionLocal()
    try:
        logger.info(f"Processing scheduled payout for cycle {cycle_id}")
        
        # Initialize LND client
        lnd_client = LndClient(
            lnd_host=os.getenv("LND_HOST", "localhost:10009"),
            macaroon_path=os.getenv("LND_MACAROON_PATH"),
            tls_cert_path=os.getenv("LND_TLS_CERT_PATH")
        )
        
        # Process payout
        result = process_payout(
            db=db,
            cycle_id=cycle_id,
            lnd_client=lnd_client,
            group_verified=group_verified,
            user_recurring=user_recurring
        )
        
        logger.info(f"Successfully processed payout for cycle {cycle_id}")
        return result
        
    except Exception as e:
        logger.error(f"Payout failed for cycle {cycle_id}: {e}")
        
        # Retry logic
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying payout for cycle {cycle_id} (attempt {self.request.retries + 1})")
            raise self.retry(countdown=60 * (2 ** self.request.retries))  # Exponential backoff
        
        # Final failure
        logger.error(f"Payout failed permanently for cycle {cycle_id}")
        return {
            "error": str(e),
            "cycle_id": cycle_id,
            "status": "failed"
        }
        
    finally:
        db.close()

@celery.task(bind=True, max_retries=3)
def monthly_partner_settlement(self, partner_name: str = "wave"):
    """
    Process monthly partner settlements.
    
    Args:
        partner_name: Name of the partner to settle
        
    Returns:
        Dict with settlement results
    """
    db = SessionLocal()
    try:
        logger.info(f"Processing monthly settlements for partner: {partner_name}")
        
        # Get partner client
        api_key = os.getenv(f"{partner_name.upper()}_API_KEY")
        if not api_key:
            raise ValueError(f"No API key found for partner {partner_name}")
        
        partner_client = get_partner_client(partner_name, api_key)
        
        # Process settlements
        result = settle_partner_settlements(db, partner_client)
        
        logger.info(f"Successfully processed settlements for {partner_name}: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Settlement failed for partner {partner_name}: {e}")
        
        # Retry logic
        if self.request.retries < self.max_retries:
            logger.info(f"Retrying settlement for {partner_name} (attempt {self.request.retries + 1})")
            raise self.retry(countdown=60 * (2 ** self.request.retries))
        
        # Final failure
        logger.error(f"Settlement failed permanently for partner {partner_name}")
        return {
            "error": str(e),
            "partner": partner_name,
            "status": "failed"
        }
        
    finally:
        db.close()

@celery.task
def check_ready_cycles():
    """
    Check for cycles that are ready for payout and mark them as ready.
    
    Returns:
        Dict with check results
    """
    db = SessionLocal()
    try:
        logger.info("Checking for cycles ready for payout")
        
        # Find cycles in collecting status
        collecting_cycles = db.query(TontineCycle).filter(
            TontineCycle.status == "collecting"
        ).all()
        
        ready_count = 0
        for cycle in collecting_cycles:
            if mark_cycle_ready(db, cycle.id):
                ready_count += 1
                logger.info(f"Marked cycle {cycle.id} as ready")
        
        logger.info(f"Found {ready_count} cycles ready for payout")
        return {
            "checked_cycles": len(collecting_cycles),
            "ready_cycles": ready_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to check ready cycles: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    finally:
        db.close()

@celery.task
def process_ready_cycles():
    """
    Process all cycles that are ready for payout.
    
    Returns:
        Dict with processing results
    """
    db = SessionLocal()
    try:
        logger.info("Processing ready cycles")
        
        # Find ready cycles
        ready_cycles = db.query(TontineCycle).filter(
            TontineCycle.status == "ready"
        ).all()
        
        processed_count = 0
        failed_count = 0
        
        for cycle in ready_cycles:
            try:
                # Queue payout task
                run_scheduled_payout.delay(
                    cycle_id=cycle.id,
                    group_verified=cycle.group.is_verified if cycle.group else False,
                    user_recurring=False  # This would need to be determined from user data
                )
                processed_count += 1
                logger.info(f"Queued payout for cycle {cycle.id}")
                
            except Exception as e:
                failed_count += 1
                logger.error(f"Failed to queue payout for cycle {cycle.id}: {e}")
        
        logger.info(f"Queued {processed_count} payouts, {failed_count} failed")
        return {
            "ready_cycles": len(ready_cycles),
            "queued_payouts": processed_count,
            "failed_queues": failed_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to process ready cycles: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    finally:
        db.close()

@celery.task
def cleanup_expired_subscriptions():
    """
    Clean up expired subscriptions.
    
    Returns:
        Dict with cleanup results
    """
    db = SessionLocal()
    try:
        logger.info("Cleaning up expired subscriptions")
        
        deactivated_count = deactivate_expired_subscriptions(db)
        
        logger.info(f"Deactivated {deactivated_count} expired subscriptions")
        return {
            "deactivated_subscriptions": deactivated_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to cleanup expired subscriptions: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    finally:
        db.close()

@celery.task
def send_subscription_reminders():
    """
    Send reminders for expiring subscriptions.
    
    Returns:
        Dict with reminder results
    """
    db = SessionLocal()
    try:
        logger.info("Sending subscription reminders")
        
        # Get subscriptions expiring in 7 days
        expiring = get_expiring_subscriptions(db, 7)
        
        reminder_count = 0
        for subscription in expiring:
            try:
                # Send reminder (this would integrate with notification service)
                logger.info(f"Sending reminder for subscription {subscription.id}")
                reminder_count += 1
                
            except Exception as e:
                logger.error(f"Failed to send reminder for subscription {subscription.id}: {e}")
        
        logger.info(f"Sent {reminder_count} subscription reminders")
        return {
            "expiring_subscriptions": len(expiring),
            "reminders_sent": reminder_count,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to send subscription reminders: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    finally:
        db.close()

@celery.task
def generate_monthly_revenue_report():
    """
    Generate monthly revenue report.
    
    Returns:
        Dict with report results
    """
    db = SessionLocal()
    try:
        logger.info("Generating monthly revenue report")
        
        # Calculate period (previous month)
        now = datetime.utcnow()
        period_start = (now.replace(day=1) - timedelta(days=1)).replace(day=1)
        period_end = now.replace(day=1)
        
        # Generate report
        report = generate_revenue_report(db, period_start, period_end)
        
        logger.info(f"Generated revenue report for {period_start.date()} to {period_end.date()}")
        return {
            "report_id": report.id,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to generate revenue report: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    finally:
        db.close()

@celery.task
def update_community_fund_balance():
    """
    Update community fund balance from recent fees.
    
    Returns:
        Dict with update results
    """
    db = SessionLocal()
    try:
        logger.info("Updating community fund balance")
        
        # Update community fund
        updated_amount = update_community_fund(db)
        
        logger.info(f"Updated community fund balance")
        return {
            "community_fund_sats": updated_amount,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to update community fund: {e}")
        return {
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    finally:
        db.close()

@celery.task
def health_check():
    """
    Perform system health check.
    
    Returns:
        Dict with health status
    """
    db = SessionLocal()
    try:
        logger.info("Performing health check")
        
        # Check database connection
        db.execute("SELECT 1")
        
        # Check pending settlements
        pending_settlements = db.query(PartnerSettlement).filter(
            PartnerSettlement.status == "pending"
        ).count()
        
        # Check failed payouts
        failed_payouts = db.query(TontineCycle).filter(
            TontineCycle.status == "failed"
        ).count()
        
        health_status = {
            "database": "healthy",
            "pending_settlements": pending_settlements,
            "failed_payouts": failed_payouts,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        logger.info(f"Health check completed: {health_status}")
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "database": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
        
    finally:
        db.close()

# Celery Beat schedule configuration
celery.conf.beat_schedule = {
    # Check for ready cycles every 5 minutes
    'check-ready-cycles': {
        'task': 'sunusav_monetization.tasks.check_ready_cycles',
        'schedule': crontab(minute='*/5'),
    },
    
    # Process ready cycles every 10 minutes
    'process-ready-cycles': {
        'task': 'sunusav_monetization.tasks.process_ready_cycles',
        'schedule': crontab(minute='*/10'),
    },
    
    # Clean up expired subscriptions daily at 2 AM
    'cleanup-expired-subscriptions': {
        'task': 'sunusav_monetization.tasks.cleanup_expired_subscriptions',
        'schedule': crontab(hour=2, minute=0),
    },
    
    # Send subscription reminders daily at 9 AM
    'send-subscription-reminders': {
        'task': 'sunusav_monetization.tasks.send_subscription_reminders',
        'schedule': crontab(hour=9, minute=0),
    },
    
    # Monthly partner settlements on the 1st at 3 AM
    'monthly-partner-settlement-wave': {
        'task': 'sunusav_monetization.tasks.monthly_partner_settlement',
        'schedule': crontab(day_of_month=1, hour=3, minute=0),
        'args': ('wave',)
    },
    
    'monthly-partner-settlement-orange': {
        'task': 'sunusav_monetization.tasks.monthly_partner_settlement',
        'schedule': crontab(day_of_month=1, hour=3, minute=30),
        'args': ('orange',)
    },
    
    # Generate monthly revenue report on the 1st at 4 AM
    'generate-monthly-revenue-report': {
        'task': 'sunusav_monetization.tasks.generate_monthly_revenue_report',
        'schedule': crontab(day_of_month=1, hour=4, minute=0),
    },
    
    # Update community fund balance daily at 1 AM
    'update-community-fund-balance': {
        'task': 'sunusav_monetization.tasks.update_community_fund_balance',
        'schedule': crontab(hour=1, minute=0),
    },
    
    # Health check every hour
    'health-check': {
        'task': 'sunusav_monetization.tasks.health_check',
        'schedule': crontab(minute=0),
    },
}

# Optional: Add task routing
celery.conf.task_routes = {
    'sunusav_monetization.tasks.run_scheduled_payout': {'queue': 'payouts'},
    'sunusav_monetization.tasks.monthly_partner_settlement': {'queue': 'settlements'},
    'sunusav_monetization.tasks.generate_monthly_revenue_report': {'queue': 'reports'},
}
