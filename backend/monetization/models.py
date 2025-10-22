# backend/monetization/models.py
from datetime import datetime
from sqlalchemy import (
    Column, Integer, BigInteger, String, Boolean, DateTime, Float, ForeignKey, Numeric, Enum, Text
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.mysql import VARCHAR, TEXT, BIGINT, DECIMAL

Base = declarative_base()

class Group(Base):
    __tablename__ = "groups"
    id = Column(VARCHAR(64), primary_key=True)
    name = Column(VARCHAR(255), nullable=False)
    description = Column(TEXT)
    country = Column(VARCHAR(8), default="SN")
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # relationship to tontine cycles
    cycles = relationship("TontineCycle", back_populates="group")

class TontineCycle(Base):
    __tablename__ = "tontine_cycles"
    id = Column(VARCHAR(64), primary_key=True)
    group_id = Column(VARCHAR(64), ForeignKey("groups.id"), nullable=False)
    contribution_sats = Column(BIGINT, nullable=False)  # contribution per member in sats
    payout_total_sats = Column(BIGINT, nullable=False)  # total to pay winner
    cycle_index = Column(Integer, default=0)
    status = Column(Enum('collecting', 'ready', 'paid', 'failed', name='cycle_status'), default="collecting")
    created_at = Column(DateTime, default=datetime.utcnow)
    scheduled_payout_at = Column(DateTime)
    withdraw_invoice = Column(TEXT)  # Lightning invoice for payout
    winner_user_id = Column(VARCHAR(64))  # User who won this cycle

    group = relationship("Group", back_populates="cycles")
    transactions = relationship("Transaction", back_populates="cycle")
    fee_records = relationship("FeeRecord", back_populates="cycle")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(VARCHAR(64), primary_key=True)
    cycle_id = Column(VARCHAR(64), ForeignKey("tontine_cycles.id"), nullable=False)
    member_pubkey = Column(VARCHAR(255), nullable=False)
    sats_amount = Column(BIGINT, nullable=False)
    lnd_invoice = Column(TEXT)   # invoice/memo for record
    preimage = Column(VARCHAR(255), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    cycle = relationship("TontineCycle", back_populates="transactions")

class FeeRecord(Base):
    __tablename__ = "fee_records"
    id = Column(VARCHAR(64), primary_key=True)
    cycle_id = Column(VARCHAR(64), ForeignKey("tontine_cycles.id"), nullable=True)
    sats_fee = Column(BIGINT, nullable=False)
    sats_to_partner = Column(BIGINT, default=0)  # for cash-out fees
    sats_to_community = Column(BIGINT, default=0)
    sats_to_platform = Column(BIGINT, default=0)
    reason = Column(VARCHAR(255), nullable=True)
    btc_xof_rate_at_record = Column(DECIMAL(18, 2))  # Exchange rate used for this fee
    opreturn_hash = Column(VARCHAR(255), nullable=True)  # Optional on-chain proof hash
    created_at = Column(DateTime, default=datetime.utcnow)

    cycle = relationship("TontineCycle", back_populates="fee_records")

class Subscription(Base):
    __tablename__ = "subscriptions"
    id = Column(VARCHAR(64), primary_key=True)
    user_id = Column(VARCHAR(64), nullable=False)
    tier = Column(Enum('standard', 'pro', 'enterprise', name='subscription_tier'), default="standard")
    recurring_xof = Column(Integer, default=0)
    active = Column(Boolean, default=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)
    payment_method = Column(VARCHAR(50), default='lightning')  # 'lightning', 'mobile_money', 'bank'
    last_payment_at = Column(DateTime, nullable=True)

class PartnerSettlement(Base):
    __tablename__ = "partner_settlements"
    id = Column(VARCHAR(64), primary_key=True)
    partner = Column(VARCHAR(50), nullable=False)  # 'wave', 'orange', 'mtn'
    xof_amount = Column(DECIMAL(18, 2), nullable=False)
    sats_equivalent = Column(BIGINT)
    settled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    settlement_reference = Column(VARCHAR(255), nullable=True)  # Partner's transaction reference
    status = Column(Enum('pending', 'processing', 'completed', 'failed', name='settlement_status'), default='pending')

class RevenueReport(Base):
    __tablename__ = "revenue_reports"
    id = Column(VARCHAR(64), primary_key=True)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    total_platform_revenue_sats = Column(BIGINT, default=0)
    total_community_fund_sats = Column(BIGINT, default=0)
    total_partner_payouts_sats = Column(BIGINT, default=0)
    total_platform_revenue_xof = Column(DECIMAL(18, 2), default=0)
    total_community_fund_xof = Column(DECIMAL(18, 2), default=0)
    total_partner_payouts_xof = Column(DECIMAL(18, 2), default=0)
    cycles_processed = Column(Integer, default=0)
    groups_active = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class CommunityFund(Base):
    __tablename__ = "community_fund"
    id = Column(VARCHAR(64), primary_key=True)
    total_sats = Column(BIGINT, default=0)
    total_xof = Column(DECIMAL(18, 2), default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    description = Column(TEXT)

class FundDistribution(Base):
    __tablename__ = "fund_distributions"
    id = Column(VARCHAR(64), primary_key=True)
    fund_id = Column(VARCHAR(64), ForeignKey("community_fund.id"), nullable=False)
    recipient_type = Column(Enum('group', 'user', 'charity', 'development', name='recipient_type'), nullable=False)
    recipient_id = Column(VARCHAR(64), nullable=False)
    sats_amount = Column(BIGINT, nullable=False)
    xof_amount = Column(DECIMAL(18, 2), nullable=False)
    purpose = Column(TEXT)
    status = Column(Enum('pending', 'approved', 'distributed', 'rejected', name='distribution_status'), default='pending')
    approved_by = Column(VARCHAR(64), nullable=True)
    distributed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    fund = relationship("CommunityFund")

class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    id = Column(VARCHAR(64), primary_key=True)
    btc_xof_rate = Column(DECIMAL(18, 2), nullable=False)
    source = Column(VARCHAR(50), default='manual')  # 'coingecko', 'binance', 'manual'
    timestamp = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

class PayoutLog(Base):
    __tablename__ = "payout_logs"
    id = Column(VARCHAR(64), primary_key=True)
    cycle_id = Column(VARCHAR(64), ForeignKey("tontine_cycles.id"), nullable=False)
    lightning_payment_hash = Column(VARCHAR(255), nullable=True)
    lightning_preimage = Column(VARCHAR(255), nullable=True)
    payout_method = Column(Enum('lightning', 'mobile_money', 'bank', name='payout_method'), default='lightning')
    status = Column(Enum('initiated', 'processing', 'completed', 'failed', name='payout_status'), default='initiated')
    error_message = Column(TEXT, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    cycle = relationship("TontineCycle")
