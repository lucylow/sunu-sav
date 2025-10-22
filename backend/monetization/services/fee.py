# backend/monetization/services/fee.py
from decimal import Decimal, ROUND_DOWN
from typing import Dict, Optional
import logging

logger = logging.getLogger(__name__)

# Configuration constants (tweakable via environment variables)
BASE_FEE_PERCENT = Decimal("0.01")       # default 1% (can be 0.005-0.01)
VERIFIED_GROUP_DISCOUNT = Decimal("0.50") # 50% reduction for verified groups => 0.5 * base
RECURRING_USER_DISCOUNT = Decimal("0.75") # 25% discount (i.e. pay 75% of base)
COMMUNITY_FUND_SHARE = Decimal("0.20")   # 20% of platform fee to community
PARTNER_CASHOUT_SHARE = Decimal("0.30")  # 30% of collected fee reserved for partners on cash-out
MINIMUM_FEE_SATS = 1  # Minimum fee in sats for micropayment economics

def sats_from_decimal(d: Decimal) -> int:
    """Convert decimal to sats with proper rounding"""
    return int(d.quantize(Decimal('1.'), rounding=ROUND_DOWN))

def calculate_fee_for_payout(
    payout_sats: int, 
    *, 
    group_verified: bool = False, 
    user_recurring: bool = False, 
    fee_percent_override: Optional[Decimal] = None
) -> Dict[str, int]:
    """
    Calculate fee and splits for a single payout (in sats).
    
    Args:
        payout_sats: Total payout amount in sats
        group_verified: Whether the group is verified (gets discount)
        user_recurring: Whether user has recurring subscription (gets discount)
        fee_percent_override: Override the base fee percentage
        
    Returns:
        Dict with sats_fee, platform_share, community_share, partner_reserved
    """
    if payout_sats <= 0:
        raise ValueError("Payout amount must be positive")
    
    # Determine fee percentage
    if fee_percent_override is not None:
        fee_pct = fee_percent_override
    else:
        fee_pct = BASE_FEE_PERCENT

    # Apply discounts
    if group_verified:
        fee_pct = fee_pct * VERIFIED_GROUP_DISCOUNT
        logger.info(f"Applied verified group discount: {VERIFIED_GROUP_DISCOUNT}")
    
    if user_recurring:
        fee_pct = fee_pct * RECURRING_USER_DISCOUNT
        logger.info(f"Applied recurring user discount: {RECURRING_USER_DISCOUNT}")

    # Calculate fee amount
    fee_decimal = (Decimal(payout_sats) * fee_pct).quantize(Decimal('1.'), rounding=ROUND_DOWN)
    sats_fee = int(fee_decimal)

    # Apply minimum fee for micropayment economics
    if sats_fee < MINIMUM_FEE_SATS:
        sats_fee = MINIMUM_FEE_SATS
        logger.info(f"Applied minimum fee: {MINIMUM_FEE_SATS} sats")

    # Calculate splits
    platform_share = int(
        (Decimal(sats_fee) * (Decimal('1.0') - COMMUNITY_FUND_SHARE - PARTNER_CASHOUT_SHARE))
        .quantize(Decimal('1.'), rounding=ROUND_DOWN)
    )
    
    community_share = int(
        (Decimal(sats_fee) * COMMUNITY_FUND_SHARE)
        .quantize(Decimal('1.'), rounding=ROUND_DOWN)
    )
    
    partner_reserved = sats_fee - platform_share - community_share

    # Safety: ensure non-negative values
    platform_share = max(platform_share, 0)
    community_share = max(community_share, 0)
    partner_reserved = max(partner_reserved, 0)

    logger.info(f"Fee calculation: {payout_sats} sats -> {sats_fee} sats fee "
               f"(platform: {platform_share}, community: {community_share}, partner: {partner_reserved})")

    return {
        "sats_fee": sats_fee,
        "platform_share": platform_share,
        "community_share": community_share,
        "partner_reserved": partner_reserved,
        "fee_percentage": fee_pct
    }

def calculate_annual_revenue_projection(
    groups_count: int,
    weeks_per_year: int = 52,
    avg_payout_sats: int,
    verified_groups_ratio: float = 0.3,
    recurring_users_ratio: float = 0.2
) -> Dict[str, int]:
    """
    Calculate projected annual revenue based on group activity.
    
    Args:
        groups_count: Number of active groups
        weeks_per_year: Number of weeks in a year
        avg_payout_sats: Average payout per cycle in sats
        verified_groups_ratio: Ratio of verified groups (0.0 to 1.0)
        recurring_users_ratio: Ratio of recurring users (0.0 to 1.0)
        
    Returns:
        Dict with annual projections in sats
    """
    total_cycles = groups_count * weeks_per_year
    
    # Calculate average fee per cycle
    verified_cycles = int(total_cycles * verified_groups_ratio)
    recurring_cycles = int(total_cycles * recurring_users_ratio)
    standard_cycles = total_cycles - verified_cycles - recurring_cycles
    
    # Calculate fees for each category
    verified_fee = calculate_fee_for_payout(avg_payout_sats, group_verified=True)
    recurring_fee = calculate_fee_for_payout(avg_payout_sats, user_recurring=True)
    standard_fee = calculate_fee_for_payout(avg_payout_sats)
    
    # Calculate total annual revenue
    total_platform_revenue = (
        verified_cycles * verified_fee["platform_share"] +
        recurring_cycles * recurring_fee["platform_share"] +
        standard_cycles * standard_fee["platform_share"]
    )
    
    total_community_fund = (
        verified_cycles * verified_fee["community_share"] +
        recurring_cycles * recurring_fee["community_share"] +
        standard_cycles * standard_fee["community_share"]
    )
    
    total_partner_payouts = (
        verified_cycles * verified_fee["partner_reserved"] +
        recurring_cycles * recurring_fee["partner_reserved"] +
        standard_cycles * standard_fee["partner_reserved"]
    )
    
    return {
        "total_platform_revenue": total_platform_revenue,
        "total_community_fund": total_community_fund,
        "total_partner_payouts": total_partner_payouts,
        "total_fees_collected": total_platform_revenue + total_community_fund + total_partner_payouts,
        "cycles_processed": total_cycles,
        "groups_count": groups_count
    }

def get_fee_tiers() -> Dict[str, Dict[str, Decimal]]:
    """
    Get fee tier configuration for different user types.
    
    Returns:
        Dict with fee configurations for different tiers
    """
    return {
        "standard": {
            "base_fee_percent": BASE_FEE_PERCENT,
            "description": "Standard fee for regular users"
        },
        "verified_group": {
            "base_fee_percent": BASE_FEE_PERCENT * VERIFIED_GROUP_DISCOUNT,
            "description": "Reduced fee for verified groups"
        },
        "recurring_user": {
            "base_fee_percent": BASE_FEE_PERCENT * RECURRING_USER_DISCOUNT,
            "description": "Reduced fee for recurring subscribers"
        },
        "verified_recurring": {
            "base_fee_percent": BASE_FEE_PERCENT * VERIFIED_GROUP_DISCOUNT * RECURRING_USER_DISCOUNT,
            "description": "Maximum discount for verified groups with recurring users"
        }
    }
