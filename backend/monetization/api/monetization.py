# backend/monetization/api/monetization.py
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from ..db import get_db
from ..schemas import (
    FeeCalculationRequest, FeeCalculationResponse,
    PayoutRequest, PayoutResponse,
    SubscriptionCreate, SubscriptionResponse,
    PartnerSettlementRequest, PartnerSettlementResponse,
    RevenueReportRequest, RevenueReportResponse,
    ExchangeRateRequest, ExchangeRateResponse,
    CommunityFundResponse, FundDistributionRequest, FundDistributionResponse,
    ErrorResponse
)
from ..services.fee import calculate_fee_for_payout, get_fee_tiers, calculate_annual_revenue_projection
from ..services.payout import process_payout, get_payout_status, LndClient
from ..services.subscriptions import (
    create_subscription, cancel_subscription, get_user_subscription,
    is_user_recurring, get_subscription_stats, get_subscription_fee_discount
)
from ..services.partners import (
    settle_partner_settlements, get_partner_client, get_settlement_summary,
    get_partner_balance
)
from ..services.accounting import (
    generate_revenue_report, get_revenue_summary, update_community_fund,
    create_fund_distribution, approve_fund_distribution, execute_fund_distribution,
    get_community_fund_status, get_fund_distributions, get_revenue_trends
)
from ..util.rates import (
    fetch_btc_xof_rate, sats_to_xof, xof_to_sats, get_rate_info,
    update_rate_manually
)
from ..tasks import (
    run_scheduled_payout, monthly_partner_settlement, check_ready_cycles,
    process_ready_cycles, cleanup_expired_subscriptions, send_subscription_reminders,
    generate_monthly_revenue_report, update_community_fund_balance, health_check
)

router = APIRouter(prefix="/monetization", tags=["monetization"])

# Fee calculation endpoints
@router.post("/fees/calculate", response_model=FeeCalculationResponse)
async def calculate_fee(
    request: FeeCalculationRequest,
    db: Session = Depends(get_db)
):
    """Calculate fee for a payout with tiering and discounts"""
    try:
        fee_info = calculate_fee_for_payout(
            payout_sats=request.payout_sats,
            group_verified=request.group_verified,
            user_recurring=request.user_recurring,
            fee_percent_override=request.fee_percent_override
        )
        
        return FeeCalculationResponse(
            sats_fee=fee_info["sats_fee"],
            platform_share=fee_info["platform_share"],
            community_share=fee_info["community_share"],
            partner_reserved=fee_info["partner_reserved"],
            net_payout=request.payout_sats - fee_info["sats_fee"],
            fee_percentage=fee_info["fee_percentage"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/fees/tiers")
async def get_fee_tiers_info():
    """Get available fee tiers and their configurations"""
    return get_fee_tiers()

@router.post("/fees/project-annual-revenue")
async def project_annual_revenue(
    groups_count: int,
    weeks_per_year: int = 52,
    avg_payout_sats: int = 100000,
    verified_groups_ratio: float = 0.3,
    recurring_users_ratio: float = 0.2
):
    """Calculate projected annual revenue based on group activity"""
    try:
        projection = calculate_annual_revenue_projection(
            groups_count=groups_count,
            weeks_per_year=weeks_per_year,
            avg_payout_sats=avg_payout_sats,
            verified_groups_ratio=verified_groups_ratio,
            recurring_users_ratio=recurring_users_ratio
        )
        return projection
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Payout endpoints
@router.post("/payouts/process", response_model=PayoutResponse)
async def process_payout_endpoint(
    request: PayoutRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Process a tontine cycle payout"""
    try:
        # Initialize LND client
        lnd_client = LndClient()
        
        result = process_payout(
            db=db,
            cycle_id=request.cycle_id,
            lnd_client=lnd_client,
            group_verified=request.group_verified,
            user_recurring=request.user_recurring
        )
        
        return PayoutResponse(
            cycle_id=result["cycle_id"],
            payout_total=result["payout_total"],
            sats_fee=result["sats_fee"],
            net_payout=result["net_payout"],
            platform_share=result["platform_share"],
            community_share=result["community_share"],
            partner_reserved=result["partner_reserved"],
            lightning_payment_hash=result.get("lightning_payment_hash"),
            status=result["status"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/payouts/schedule")
async def schedule_payout(
    cycle_id: str,
    group_verified: bool = False,
    user_recurring: bool = False,
    background_tasks: BackgroundTasks = None
):
    """Schedule a payout for background processing"""
    try:
        # Queue payout task
        task = run_scheduled_payout.delay(
            cycle_id=cycle_id,
            group_verified=group_verified,
            user_recurring=user_recurring
        )
        
        return {
            "task_id": task.id,
            "cycle_id": cycle_id,
            "status": "queued"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/payouts/status/{cycle_id}")
async def get_payout_status_endpoint(
    cycle_id: str,
    db: Session = Depends(get_db)
):
    """Get payout status for a cycle"""
    try:
        status = get_payout_status(db, cycle_id)
        return status
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Subscription endpoints
@router.post("/subscriptions", response_model=SubscriptionResponse)
async def create_subscription_endpoint(
    request: SubscriptionCreate,
    db: Session = Depends(get_db)
):
    """Create a new subscription"""
    try:
        subscription = create_subscription(
            db=db,
            user_id=request.user_id,
            tier=request.tier,
            payment_method=request.payment_method
        )
        
        return SubscriptionResponse(
            id=subscription.id,
            user_id=subscription.user_id,
            tier=subscription.tier,
            recurring_xof=subscription.recurring_xof,
            active=subscription.active,
            started_at=subscription.started_at,
            expires_at=subscription.expires_at,
            payment_method=subscription.payment_method
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/subscriptions/{subscription_id}")
async def cancel_subscription_endpoint(
    subscription_id: str,
    db: Session = Depends(get_db)
):
    """Cancel a subscription"""
    try:
        subscription = cancel_subscription(db, subscription_id)
        return {"message": "Subscription cancelled successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/subscriptions/user/{user_id}")
async def get_user_subscription_endpoint(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get user's active subscription"""
    subscription = get_user_subscription(db, user_id)
    if not subscription:
        return {"message": "No active subscription found"}
    
    return SubscriptionResponse(
        id=subscription.id,
        user_id=subscription.user_id,
        tier=subscription.tier,
        recurring_xof=subscription.recurring_xof,
        active=subscription.active,
        started_at=subscription.started_at,
        expires_at=subscription.expires_at,
        payment_method=subscription.payment_method
    )

@router.get("/subscriptions/stats")
async def get_subscription_stats_endpoint(db: Session = Depends(get_db)):
    """Get subscription statistics"""
    stats = get_subscription_stats(db)
    return stats

# Partner settlement endpoints
@router.post("/partners/settle")
async def settle_partner_endpoint(
    partner_name: str,
    background_tasks: BackgroundTasks = None
):
    """Process partner settlements"""
    try:
        task = monthly_partner_settlement.delay(partner_name)
        return {
            "task_id": task.id,
            "partner": partner_name,
            "status": "queued"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/partners/settlements/summary")
async def get_settlement_summary_endpoint(
    partner_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get settlement summary"""
    summary = get_settlement_summary(db, partner_name)
    return summary

@router.get("/partners/{partner_name}/balance")
async def get_partner_balance_endpoint(
    partner_name: str,
    api_key: str
):
    """Get partner account balance"""
    try:
        balance = get_partner_balance(None, partner_name, api_key)
        return balance
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Revenue reporting endpoints
@router.post("/reports/revenue", response_model=RevenueReportResponse)
async def generate_revenue_report_endpoint(
    request: RevenueReportRequest,
    db: Session = Depends(get_db)
):
    """Generate revenue report for a period"""
    try:
        report = generate_revenue_report(
            db=db,
            period_start=request.period_start,
            period_end=request.period_end
        )
        
        return RevenueReportResponse(
            id=report.id,
            period_start=report.period_start,
            period_end=report.period_end,
            total_platform_revenue_sats=report.total_platform_revenue_sats,
            total_community_fund_sats=report.total_community_fund_sats,
            total_partner_payouts_sats=report.total_partner_payouts_sats,
            total_platform_revenue_xof=report.total_platform_revenue_xof,
            total_community_fund_xof=report.total_community_fund_xof,
            total_partner_payouts_xof=report.total_partner_payouts_xof,
            cycles_processed=report.cycles_processed,
            groups_active=report.groups_active
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/reports/revenue/summary")
async def get_revenue_summary_endpoint(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get revenue summary for the last N days"""
    summary = get_revenue_summary(db, days)
    return summary

@router.get("/reports/revenue/trends")
async def get_revenue_trends_endpoint(
    days: int = 30,
    db: Session = Depends(get_db)
):
    """Get revenue trends over time"""
    trends = get_revenue_trends(db, days)
    return trends

# Exchange rate endpoints
@router.get("/rates/current")
async def get_current_rate():
    """Get current BTC/XOF exchange rate"""
    rate_info = get_rate_info()
    return rate_info

@router.post("/rates/update")
async def update_exchange_rate(
    rate: Decimal,
    source: str = "manual"
):
    """Manually update exchange rate"""
    try:
        update_rate_manually(rate, source)
        return {"message": "Exchange rate updated successfully", "rate": float(rate)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# Community fund endpoints
@router.get("/community-fund/status", response_model=CommunityFundResponse)
async def get_community_fund_status_endpoint(db: Session = Depends(get_db)):
    """Get community fund status"""
    status = get_community_fund_status(db)
    return CommunityFundResponse(**status)

@router.post("/community-fund/distribute", response_model=FundDistributionResponse)
async def create_fund_distribution_endpoint(
    request: FundDistributionRequest,
    db: Session = Depends(get_db)
):
    """Create a community fund distribution request"""
    try:
        distribution = create_fund_distribution(
            db=db,
            recipient_type=request.recipient_type,
            recipient_id=request.recipient_id,
            sats_amount=request.sats_amount,
            purpose=request.purpose
        )
        
        return FundDistributionResponse(
            id=distribution.id,
            fund_id=distribution.fund_id,
            recipient_type=distribution.recipient_type,
            recipient_id=distribution.recipient_id,
            sats_amount=distribution.sats_amount,
            xof_amount=distribution.xof_amount,
            purpose=distribution.purpose,
            status=distribution.status,
            created_at=distribution.created_at,
            distributed_at=distribution.distributed_at
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/community-fund/distribute/{distribution_id}/approve")
async def approve_fund_distribution_endpoint(
    distribution_id: str,
    approved_by: str,
    db: Session = Depends(get_db)
):
    """Approve a fund distribution"""
    try:
        distribution = approve_fund_distribution(db, distribution_id, approved_by)
        return {"message": "Fund distribution approved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/community-fund/distribute/{distribution_id}/execute")
async def execute_fund_distribution_endpoint(
    distribution_id: str,
    db: Session = Depends(get_db)
):
    """Execute a fund distribution"""
    try:
        distribution = execute_fund_distribution(db, distribution_id)
        return {"message": "Fund distribution executed successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/community-fund/distributions")
async def get_fund_distributions_endpoint(
    status: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get fund distributions"""
    distributions = get_fund_distributions(db, status, limit)
    return distributions

# Utility endpoints
@router.post("/convert/sats-to-xof")
async def convert_sats_to_xof(sats: int):
    """Convert sats to XOF"""
    try:
        xof_amount = sats_to_xof(sats)
        return {"sats": sats, "xof": float(xof_amount)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/convert/xof-to-sats")
async def convert_xof_to_sats(xof: Decimal):
    """Convert XOF to sats"""
    try:
        sats_amount = xof_to_sats(xof)
        return {"xof": float(xof), "sats": sats_amount}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# System endpoints
@router.get("/health")
async def health_check_endpoint():
    """System health check"""
    try:
        health_status = health_check.delay()
        return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.post("/tasks/check-ready-cycles")
async def trigger_check_ready_cycles(background_tasks: BackgroundTasks = None):
    """Trigger check for ready cycles"""
    task = check_ready_cycles.delay()
    return {"task_id": task.id, "status": "queued"}

@router.post("/tasks/process-ready-cycles")
async def trigger_process_ready_cycles(background_tasks: BackgroundTasks = None):
    """Trigger processing of ready cycles"""
    task = process_ready_cycles.delay()
    return {"task_id": task.id, "status": "queued"}

@router.post("/tasks/cleanup-subscriptions")
async def trigger_cleanup_subscriptions(background_tasks: BackgroundTasks = None):
    """Trigger cleanup of expired subscriptions"""
    task = cleanup_expired_subscriptions.delay()
    return {"task_id": task.id, "status": "queued"}

@router.post("/tasks/update-community-fund")
async def trigger_update_community_fund(background_tasks: BackgroundTasks = None):
    """Trigger community fund balance update"""
    task = update_community_fund_balance.delay()
    return {"task_id": task.id, "status": "queued"}
