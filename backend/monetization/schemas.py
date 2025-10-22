# backend/monetization/schemas.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from decimal import Decimal

# Fee calculation schemas
class FeeCalculationRequest(BaseModel):
    payout_sats: int = Field(..., description="Payout amount in sats")
    group_verified: bool = Field(False, description="Whether group is verified")
    user_recurring: bool = Field(False, description="Whether user has recurring subscription")
    fee_percent_override: Optional[Decimal] = Field(None, description="Override fee percentage")

class FeeCalculationResponse(BaseModel):
    sats_fee: int
    platform_share: int
    community_share: int
    partner_reserved: int
    net_payout: int
    fee_percentage: Decimal

# Payout schemas
class PayoutRequest(BaseModel):
    cycle_id: str
    group_verified: bool = False
    user_recurring: bool = False

class PayoutResponse(BaseModel):
    cycle_id: str
    payout_total: int
    sats_fee: int
    net_payout: int
    platform_share: int
    community_share: int
    partner_reserved: int
    lightning_payment_hash: Optional[str] = None
    status: str

# Subscription schemas
class SubscriptionCreate(BaseModel):
    user_id: str
    tier: str = "pro"
    payment_method: str = "lightning"

class SubscriptionResponse(BaseModel):
    id: str
    user_id: str
    tier: str
    recurring_xof: int
    active: bool
    started_at: datetime
    expires_at: Optional[datetime]
    payment_method: str

# Partner settlement schemas
class PartnerSettlementRequest(BaseModel):
    partner: str
    xof_amount: Decimal
    sats_equivalent: int

class PartnerSettlementResponse(BaseModel):
    id: str
    partner: str
    xof_amount: Decimal
    sats_equivalent: int
    status: str
    created_at: datetime
    settled_at: Optional[datetime]

# Revenue reporting schemas
class RevenueReportRequest(BaseModel):
    period_start: datetime
    period_end: datetime

class RevenueReportResponse(BaseModel):
    id: str
    period_start: datetime
    period_end: datetime
    total_platform_revenue_sats: int
    total_community_fund_sats: int
    total_partner_payouts_sats: int
    total_platform_revenue_xof: Decimal
    total_community_fund_xof: Decimal
    total_partner_payouts_xof: Decimal
    cycles_processed: int
    groups_active: int

# Exchange rate schemas
class ExchangeRateRequest(BaseModel):
    btc_xof_rate: Decimal
    source: str = "manual"

class ExchangeRateResponse(BaseModel):
    id: str
    btc_xof_rate: Decimal
    source: str
    timestamp: datetime
    is_active: bool

# Community fund schemas
class CommunityFundResponse(BaseModel):
    id: str
    total_sats: int
    total_xof: Decimal
    last_updated: datetime
    description: Optional[str]

class FundDistributionRequest(BaseModel):
    recipient_type: str
    recipient_id: str
    sats_amount: int
    xof_amount: Decimal
    purpose: str

class FundDistributionResponse(BaseModel):
    id: str
    fund_id: str
    recipient_type: str
    recipient_id: str
    sats_amount: int
    xof_amount: Decimal
    purpose: str
    status: str
    created_at: datetime
    distributed_at: Optional[datetime]

# Error schemas
class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
