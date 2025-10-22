# backend/monetization/services/accounting.py
import logging
import uuid
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from decimal import Decimal

from ..models import (
    FeeRecord, RevenueReport, CommunityFund, FundDistribution, 
    ExchangeRate, PartnerSettlement, Subscription
)
from ..util.rates import sats_to_xof

logger = logging.getLogger(__name__)

def generate_revenue_report(
    db: Session, 
    period_start: datetime, 
    period_end: datetime
) -> RevenueReport:
    """
    Generate a revenue report for a specific period.
    
    Args:
        db: Database session
        period_start: Start of the reporting period
        period_end: End of the reporting period
        
    Returns:
        Generated revenue report
    """
    logger.info(f"Generating revenue report for {period_start} to {period_end}")
    
    # Get fee records for the period
    fee_records = db.query(FeeRecord).filter(
        and_(
            FeeRecord.created_at >= period_start,
            FeeRecord.created_at < period_end
        )
    ).all()
    
    # Calculate totals
    total_platform_revenue_sats = sum(record.sats_to_platform for record in fee_records)
    total_community_fund_sats = sum(record.sats_to_community for record in fee_records)
    total_partner_payouts_sats = sum(record.sats_to_partner for record in fee_records)
    
    # Convert to XOF using average exchange rate for the period
    avg_rate = db.query(func.avg(ExchangeRate.btc_xof_rate)).filter(
        and_(
            ExchangeRate.timestamp >= period_start,
            ExchangeRate.timestamp < period_end,
            ExchangeRate.is_active == True
        )
    ).scalar()
    
    if avg_rate is None:
        # Fallback to current rate
        from ..util.rates import fetch_btc_xof_rate
        avg_rate = fetch_btc_xof_rate()
    
    total_platform_revenue_xof = sats_to_xof(total_platform_revenue_sats)
    total_community_fund_xof = sats_to_xof(total_community_fund_sats)
    total_partner_payouts_xof = sats_to_xof(total_partner_payouts_sats)
    
    # Count cycles and groups
    cycles_processed = len(fee_records)
    
    # Count active groups (simplified - would need proper group tracking)
    groups_active = db.query(func.count(func.distinct(FeeRecord.cycle_id))).filter(
        and_(
            FeeRecord.created_at >= period_start,
            FeeRecord.created_at < period_end
        )
    ).scalar() or 0
    
    # Create revenue report
    report = RevenueReport(
        id=str(uuid.uuid4()),
        period_start=period_start,
        period_end=period_end,
        total_platform_revenue_sats=total_platform_revenue_sats,
        total_community_fund_sats=total_community_fund_sats,
        total_partner_payouts_sats=total_partner_payouts_sats,
        total_platform_revenue_xof=total_platform_revenue_xof,
        total_community_fund_xof=total_community_fund_xof,
        total_partner_payouts_xof=total_partner_payouts_xof,
        cycles_processed=cycles_processed,
        groups_active=groups_active
    )
    
    db.add(report)
    db.commit()
    
    logger.info(f"Generated revenue report {report.id}")
    return report

def get_revenue_summary(db: Session, days: int = 30) -> Dict[str, Any]:
    """
    Get revenue summary for the last N days.
    
    Args:
        db: Database session
        days: Number of days to look back
        
    Returns:
        Dict with revenue summary
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get fee records for the period
    fee_records = db.query(FeeRecord).filter(
        and_(
            FeeRecord.created_at >= start_date,
            FeeRecord.created_at < end_date
        )
    ).all()
    
    if not fee_records:
        return {
            "period_days": days,
            "total_fees_sats": 0,
            "total_fees_xof": 0,
            "platform_revenue_sats": 0,
            "platform_revenue_xof": 0,
            "community_fund_sats": 0,
            "community_fund_xof": 0,
            "partner_payouts_sats": 0,
            "partner_payouts_xof": 0,
            "cycles_processed": 0,
            "average_fee_per_cycle": 0
        }
    
    # Calculate totals
    total_fees_sats = sum(record.sats_fee for record in fee_records)
    platform_revenue_sats = sum(record.sats_to_platform for record in fee_records)
    community_fund_sats = sum(record.sats_to_community for record in fee_records)
    partner_payouts_sats = sum(record.sats_to_partner for record in fee_records)
    
    # Convert to XOF
    total_fees_xof = sats_to_xof(total_fees_sats)
    platform_revenue_xof = sats_to_xof(platform_revenue_sats)
    community_fund_xof = sats_to_xof(community_fund_sats)
    partner_payouts_xof = sats_to_xof(partner_payouts_sats)
    
    cycles_processed = len(fee_records)
    average_fee_per_cycle = total_fees_sats / cycles_processed if cycles_processed > 0 else 0
    
    return {
        "period_days": days,
        "total_fees_sats": total_fees_sats,
        "total_fees_xof": float(total_fees_xof),
        "platform_revenue_sats": platform_revenue_sats,
        "platform_revenue_xof": float(platform_revenue_xof),
        "community_fund_sats": community_fund_sats,
        "community_fund_xof": float(community_fund_xof),
        "partner_payouts_sats": partner_payouts_sats,
        "partner_payouts_xof": float(partner_payouts_xof),
        "cycles_processed": cycles_processed,
        "average_fee_per_cycle": average_fee_per_cycle
    }

def update_community_fund(db: Session) -> int:
    """
    Update community fund balance from recent fees.
    
    Args:
        db: Database session
        
    Returns:
        Updated community fund balance in sats
    """
    logger.info("Updating community fund balance")
    
    # Get or create community fund
    community_fund = db.query(CommunityFund).first()
    if not community_fund:
        community_fund = CommunityFund(
            id=str(uuid.uuid4()),
            total_sats=0,
            total_xof=Decimal('0'),
            description="SunuSàv Community Fund"
        )
        db.add(community_fund)
    
    # Calculate total community fund from fee records
    total_community_sats = db.query(func.sum(FeeRecord.sats_to_community)).scalar() or 0
    
    # Subtract any distributions
    total_distributed_sats = db.query(func.sum(FundDistribution.sats_amount)).filter(
        FundDistribution.status == "distributed"
    ).scalar() or 0
    
    # Update balance
    community_fund.total_sats = total_community_sats - total_distributed_sats
    community_fund.total_xof = sats_to_xof(community_fund.total_sats)
    community_fund.last_updated = datetime.utcnow()
    
    db.commit()
    
    logger.info(f"Updated community fund balance: {community_fund.total_sats} sats")
    return community_fund.total_sats

def create_fund_distribution(
    db: Session,
    recipient_type: str,
    recipient_id: str,
    sats_amount: int,
    purpose: str,
    approved_by: str = None
) -> FundDistribution:
    """
    Create a community fund distribution request.
    
    Args:
        db: Database session
        recipient_type: Type of recipient ("group", "user", "charity", "development")
        recipient_id: ID of the recipient
        sats_amount: Amount in sats
        purpose: Purpose of the distribution
        approved_by: User ID who approved the distribution
        
    Returns:
        Created fund distribution
    """
    logger.info(f"Creating fund distribution: {sats_amount} sats to {recipient_type}:{recipient_id}")
    
    # Get community fund
    community_fund = db.query(CommunityFund).first()
    if not community_fund:
        raise ValueError("Community fund not found")
    
    # Check if sufficient balance
    if sats_amount > community_fund.total_sats:
        raise ValueError(f"Insufficient community fund balance: {community_fund.total_sats} sats")
    
    # Create distribution
    distribution = FundDistribution(
        id=str(uuid.uuid4()),
        fund_id=community_fund.id,
        recipient_type=recipient_type,
        recipient_id=recipient_id,
        sats_amount=sats_amount,
        xof_amount=sats_to_xof(sats_amount),
        purpose=purpose,
        status="pending",
        approved_by=approved_by
    )
    
    db.add(distribution)
    db.commit()
    
    logger.info(f"Created fund distribution {distribution.id}")
    return distribution

def approve_fund_distribution(
    db: Session,
    distribution_id: str,
    approved_by: str
) -> FundDistribution:
    """
    Approve a fund distribution.
    
    Args:
        db: Database session
        distribution_id: Distribution ID
        approved_by: User ID who approved
        
    Returns:
        Approved fund distribution
    """
    distribution = db.query(FundDistribution).filter(
        FundDistribution.id == distribution_id
    ).first()
    
    if not distribution:
        raise ValueError(f"Fund distribution {distribution_id} not found")
    
    if distribution.status != "pending":
        raise ValueError(f"Distribution {distribution_id} is not pending")
    
    distribution.status = "approved"
    distribution.approved_by = approved_by
    
    db.commit()
    
    logger.info(f"Approved fund distribution {distribution_id}")
    return distribution

def execute_fund_distribution(
    db: Session,
    distribution_id: str
) -> FundDistribution:
    """
    Execute a fund distribution.
    
    Args:
        db: Database session
        distribution_id: Distribution ID
        
    Returns:
        Executed fund distribution
    """
    distribution = db.query(FundDistribution).filter(
        FundDistribution.id == distribution_id
    ).first()
    
    if not distribution:
        raise ValueError(f"Fund distribution {distribution_id} not found")
    
    if distribution.status != "approved":
        raise ValueError(f"Distribution {distribution_id} is not approved")
    
    # Update community fund balance
    community_fund = distribution.fund
    community_fund.total_sats -= distribution.sats_amount
    community_fund.total_xof = sats_to_xof(community_fund.total_sats)
    community_fund.last_updated = datetime.utcnow()
    
    # Mark distribution as executed
    distribution.status = "distributed"
    distribution.distributed_at = datetime.utcnow()
    
    db.commit()
    
    logger.info(f"Executed fund distribution {distribution_id}")
    return distribution

def get_community_fund_status(db: Session) -> Dict[str, Any]:
    """
    Get community fund status and recent activity.
    
    Args:
        db: Database session
        
    Returns:
        Dict with fund status
    """
    community_fund = db.query(CommunityFund).first()
    if not community_fund:
        return {
            "total_sats": 0,
            "total_xof": 0,
            "last_updated": None,
            "pending_distributions": 0,
            "total_distributed": 0
        }
    
    # Count pending distributions
    pending_distributions = db.query(func.count(FundDistribution.id)).filter(
        FundDistribution.status == "pending"
    ).scalar() or 0
    
    # Calculate total distributed
    total_distributed = db.query(func.sum(FundDistribution.sats_amount)).filter(
        FundDistribution.status == "distributed"
    ).scalar() or 0
    
    return {
        "total_sats": community_fund.total_sats,
        "total_xof": float(community_fund.total_xof),
        "last_updated": community_fund.last_updated.isoformat() if community_fund.last_updated else None,
        "pending_distributions": pending_distributions,
        "total_distributed": total_distributed,
        "description": community_fund.description
    }

def get_fund_distributions(
    db: Session,
    status: str = None,
    limit: int = 100
) -> List[FundDistribution]:
    """
    Get fund distributions with optional filtering.
    
    Args:
        db: Database session
        status: Optional status filter
        limit: Maximum number of results
        
    Returns:
        List of fund distributions
    """
    query = db.query(FundDistribution)
    
    if status:
        query = query.filter(FundDistribution.status == status)
    
    return query.order_by(FundDistribution.created_at.desc()).limit(limit).all()

def get_revenue_trends(db: Session, days: int = 30) -> Dict[str, Any]:
    """
    Get revenue trends over time.
    
    Args:
        db: Database session
        days: Number of days to analyze
        
    Returns:
        Dict with trend data
    """
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    
    # Get daily revenue data
    daily_revenue = db.query(
        func.date(FeeRecord.created_at).label('date'),
        func.sum(FeeRecord.sats_fee).label('total_fees'),
        func.sum(FeeRecord.sats_to_platform).label('platform_revenue'),
        func.sum(FeeRecord.sats_to_community).label('community_fund'),
        func.sum(FeeRecord.sats_to_partner).label('partner_payouts'),
        func.count(FeeRecord.id).label('cycles_count')
    ).filter(
        and_(
            FeeRecord.created_at >= start_date,
            FeeRecord.created_at < end_date
        )
    ).group_by(func.date(FeeRecord.created_at)).all()
    
    # Format trend data
    trends = {
        "period_days": days,
        "daily_data": [],
        "total_fees": 0,
        "total_platform_revenue": 0,
        "total_community_fund": 0,
        "total_partner_payouts": 0,
        "total_cycles": 0
    }
    
    for day_data in daily_revenue:
        day_info = {
            "date": day_data.date.isoformat(),
            "total_fees": day_data.total_fees or 0,
            "platform_revenue": day_data.platform_revenue or 0,
            "community_fund": day_data.community_fund or 0,
            "partner_payouts": day_data.partner_payouts or 0,
            "cycles_count": day_data.cycles_count or 0
        }
        trends["daily_data"].append(day_info)
        
        # Add to totals
        trends["total_fees"] += day_info["total_fees"]
        trends["total_platform_revenue"] += day_info["platform_revenue"]
        trends["total_community_fund"] += day_info["community_fund"]
        trends["total_partner_payouts"] += day_info["partner_payouts"]
        trends["total_cycles"] += day_info["cycles_count"]
    
    return trends
