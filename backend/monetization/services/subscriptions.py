# backend/monetization/services/subscriptions.py
import logging
import uuid
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from decimal import Decimal

from ..models import Subscription, FeeRecord
from ..util.rates import xof_to_sats, sats_to_xof

logger = logging.getLogger(__name__)

# Subscription tier configurations
SUBSCRIPTION_TIERS = {
    "standard": {
        "name": "Standard",
        "monthly_xof": 0,
        "features": ["Basic tontine management", "Standard support"],
        "fee_discount": 0.0
    },
    "pro": {
        "name": "Pro",
        "monthly_xof": 500,
        "features": [
            "Advanced analytics",
            "Priority support", 
            "Fee discounts",
            "Custom group settings"
        ],
        "fee_discount": 0.25  # 25% discount
    },
    "enterprise": {
        "name": "Enterprise",
        "monthly_xof": 2000,
        "features": [
            "All Pro features",
            "Dedicated support",
            "Custom integrations",
            "Advanced reporting",
            "White-label options"
        ],
        "fee_discount": 0.50  # 50% discount
    }
}

def create_subscription(
    db: Session, 
    user_id: str, 
    tier: str = "pro",
    payment_method: str = "lightning"
) -> Subscription:
    """
    Create a new subscription for a user.
    
    Args:
        db: Database session
        user_id: User ID
        tier: Subscription tier
        payment_method: Payment method
        
    Returns:
        Created subscription
    """
    if tier not in SUBSCRIPTION_TIERS:
        raise ValueError(f"Invalid subscription tier: {tier}")
    
    # Check if user already has an active subscription
    existing = db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.active == True
    ).first()
    
    if existing:
        raise ValueError(f"User {user_id} already has an active subscription")
    
    tier_config = SUBSCRIPTION_TIERS[tier]
    
    subscription = Subscription(
        id=str(uuid.uuid4()),
        user_id=user_id,
        tier=tier,
        recurring_xof=tier_config["monthly_xof"],
        active=True,
        started_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=30),  # 30-day trial
        payment_method=payment_method
    )
    
    db.add(subscription)
    db.commit()
    
    logger.info(f"Created {tier} subscription for user {user_id}")
    return subscription

def cancel_subscription(db: Session, subscription_id: str) -> Subscription:
    """
    Cancel a subscription.
    
    Args:
        db: Database session
        subscription_id: Subscription ID
        
    Returns:
        Cancelled subscription
    """
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()
    
    if not subscription:
        raise ValueError(f"Subscription {subscription_id} not found")
    
    subscription.active = False
    db.commit()
    
    logger.info(f"Cancelled subscription {subscription_id}")
    return subscription

def renew_subscription(db: Session, subscription_id: str) -> Subscription:
    """
    Renew a subscription for another period.
    
    Args:
        db: Database session
        subscription_id: Subscription ID
        
    Returns:
        Renewed subscription
    """
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()
    
    if not subscription:
        raise ValueError(f"Subscription {subscription_id} not found")
    
    # Extend expiration date
    subscription.expires_at = datetime.utcnow() + timedelta(days=30)
    subscription.last_payment_at = datetime.utcnow()
    subscription.active = True
    
    db.commit()
    
    logger.info(f"Renewed subscription {subscription_id}")
    return subscription

def get_user_subscription(db: Session, user_id: str) -> Optional[Subscription]:
    """
    Get active subscription for a user.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Active subscription or None
    """
    return db.query(Subscription).filter(
        Subscription.user_id == user_id,
        Subscription.active == True
    ).first()

def is_user_recurring(db: Session, user_id: str) -> bool:
    """
    Check if user has a recurring subscription.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        True if user has active recurring subscription
    """
    subscription = get_user_subscription(db, user_id)
    return subscription is not None and subscription.tier != "standard"

def get_subscription_fee_discount(db: Session, user_id: str) -> float:
    """
    Get fee discount for user based on subscription.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        Fee discount as decimal (0.0 to 1.0)
    """
    subscription = get_user_subscription(db, user_id)
    if not subscription:
        return 0.0
    
    tier_config = SUBSCRIPTION_TIERS.get(subscription.tier, {})
    return tier_config.get("fee_discount", 0.0)

def get_expiring_subscriptions(db: Session, days_ahead: int = 7) -> List[Subscription]:
    """
    Get subscriptions expiring within specified days.
    
    Args:
        db: Database session
        days_ahead: Number of days ahead to check
        
    Returns:
        List of expiring subscriptions
    """
    expiry_date = datetime.utcnow() + timedelta(days=days_ahead)
    
    return db.query(Subscription).filter(
        Subscription.active == True,
        Subscription.expires_at <= expiry_date,
        Subscription.expires_at > datetime.utcnow()
    ).all()

def get_expired_subscriptions(db: Session) -> List[Subscription]:
    """
    Get expired subscriptions that need to be deactivated.
    
    Args:
        db: Database session
        
    Returns:
        List of expired subscriptions
    """
    return db.query(Subscription).filter(
        Subscription.active == True,
        Subscription.expires_at < datetime.utcnow()
    ).all()

def deactivate_expired_subscriptions(db: Session) -> int:
    """
    Deactivate expired subscriptions.
    
    Args:
        db: Database session
        
    Returns:
        Number of subscriptions deactivated
    """
    expired = get_expired_subscriptions(db)
    
    for subscription in expired:
        subscription.active = False
        logger.info(f"Deactivated expired subscription {subscription.id}")
    
    db.commit()
    
    logger.info(f"Deactivated {len(expired)} expired subscriptions")
    return len(expired)

def create_subscription_invoice(
    db: Session, 
    subscription_id: str, 
    amount_xof: int
) -> Dict[str, Any]:
    """
    Create a payment invoice for subscription renewal.
    
    Args:
        db: Database session
        subscription_id: Subscription ID
        amount_xof: Amount in XOF
        
    Returns:
        Dict with invoice details
    """
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()
    
    if not subscription:
        raise ValueError(f"Subscription {subscription_id} not found")
    
    # Convert XOF to sats for Lightning invoice
    amount_sats = xof_to_sats(Decimal(amount_xof))
    
    # Create invoice details
    invoice = {
        "subscription_id": subscription_id,
        "user_id": subscription.user_id,
        "tier": subscription.tier,
        "amount_xof": amount_xof,
        "amount_sats": amount_sats,
        "description": f"SunuSàv {subscription.tier.title()} Subscription",
        "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        "created_at": datetime.utcnow().isoformat()
    }
    
    logger.info(f"Created subscription invoice: {amount_xof} XOF ({amount_sats} sats)")
    return invoice

def process_subscription_payment(
    db: Session, 
    subscription_id: str, 
    payment_hash: str,
    amount_sats: int
) -> bool:
    """
    Process a subscription payment.
    
    Args:
        db: Database session
        subscription_id: Subscription ID
        payment_hash: Lightning payment hash
        amount_sats: Amount paid in sats
        
    Returns:
        True if payment processed successfully
    """
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()
    
    if not subscription:
        logger.error(f"Subscription {subscription_id} not found")
        return False
    
    # Verify payment amount
    expected_sats = xof_to_sats(Decimal(subscription.recurring_xof))
    if abs(amount_sats - expected_sats) > 100:  # Allow 100 sats tolerance
        logger.error(f"Payment amount mismatch: expected {expected_sats}, got {amount_sats}")
        return False
    
    # Update subscription
    subscription.last_payment_at = datetime.utcnow()
    subscription.expires_at = datetime.utcnow() + timedelta(days=30)
    subscription.active = True
    
    db.commit()
    
    logger.info(f"Processed subscription payment for {subscription_id}")
    return True

def get_subscription_stats(db: Session) -> Dict[str, Any]:
    """
    Get subscription statistics.
    
    Args:
        db: Database session
        
    Returns:
        Dict with subscription statistics
    """
    total_subscriptions = db.query(Subscription).count()
    active_subscriptions = db.query(Subscription).filter(
        Subscription.active == True
    ).count()
    
    # Group by tier
    tier_stats = {}
    for tier in SUBSCRIPTION_TIERS.keys():
        count = db.query(Subscription).filter(
            Subscription.tier == tier,
            Subscription.active == True
        ).count()
        tier_stats[tier] = count
    
    # Calculate monthly revenue
    monthly_revenue_xof = sum(
        subscription.recurring_xof 
        for subscription in db.query(Subscription).filter(
            Subscription.active == True
        ).all()
    )
    
    # Convert to sats for reporting
    monthly_revenue_sats = xof_to_sats(Decimal(monthly_revenue_xof))
    
    return {
        "total_subscriptions": total_subscriptions,
        "active_subscriptions": active_subscriptions,
        "tier_distribution": tier_stats,
        "monthly_revenue_xof": monthly_revenue_xof,
        "monthly_revenue_sats": monthly_revenue_sats,
        "expiring_soon": len(get_expiring_subscriptions(db, 7)),
        "expired": len(get_expired_subscriptions(db))
    }

def get_user_subscription_history(db: Session, user_id: str) -> List[Subscription]:
    """
    Get subscription history for a user.
    
    Args:
        db: Database session
        user_id: User ID
        
    Returns:
        List of user's subscriptions
    """
    return db.query(Subscription).filter(
        Subscription.user_id == user_id
    ).order_by(Subscription.started_at.desc()).all()

def upgrade_subscription(db: Session, subscription_id: str, new_tier: str) -> Subscription:
    """
    Upgrade a subscription to a higher tier.
    
    Args:
        db: Database session
        subscription_id: Subscription ID
        new_tier: New tier to upgrade to
        
    Returns:
        Updated subscription
    """
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()
    
    if not subscription:
        raise ValueError(f"Subscription {subscription_id} not found")
    
    if new_tier not in SUBSCRIPTION_TIERS:
        raise ValueError(f"Invalid subscription tier: {new_tier}")
    
    old_tier = subscription.tier
    subscription.tier = new_tier
    
    # Update recurring amount
    tier_config = SUBSCRIPTION_TIERS[new_tier]
    subscription.recurring_xof = tier_config["monthly_xof"]
    
    db.commit()
    
    logger.info(f"Upgraded subscription {subscription_id} from {old_tier} to {new_tier}")
    return subscription

def downgrade_subscription(db: Session, subscription_id: str, new_tier: str) -> Subscription:
    """
    Downgrade a subscription to a lower tier.
    
    Args:
        db: Database session
        subscription_id: Subscription ID
        new_tier: New tier to downgrade to
        
    Returns:
        Updated subscription
    """
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id
    ).first()
    
    if not subscription:
        raise ValueError(f"Subscription {subscription_id} not found")
    
    if new_tier not in SUBSCRIPTION_TIERS:
        raise ValueError(f"Invalid subscription tier: {new_tier}")
    
    old_tier = subscription.tier
    subscription.tier = new_tier
    
    # Update recurring amount
    tier_config = SUBSCRIPTION_TIERS[new_tier]
    subscription.recurring_xof = tier_config["monthly_xof"]
    
    db.commit()
    
    logger.info(f"Downgraded subscription {subscription_id} from {old_tier} to {new_tier}")
    return subscription
