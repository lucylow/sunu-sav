# backend/monetization/services/payout.py
import logging
import uuid
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, Dict, Any
from decimal import Decimal

from ..models import TontineCycle, Transaction, FeeRecord, PartnerSettlement, PayoutLog, ExchangeRate
from ..services.fee import calculate_fee_for_payout
from ..util.rates import sats_to_xof, fetch_btc_xof_rate
from ..util.onchain_publish import build_fee_summary_hash

logger = logging.getLogger(__name__)

class LndClient:
    """Lightning Network Daemon client wrapper"""
    
    def __init__(self, lnd_host: str = "localhost:10009", macaroon_path: str = None, tls_cert_path: str = None):
        self.lnd_host = lnd_host
        self.macaroon_path = macaroon_path
        self.tls_cert_path = tls_cert_path
        # In production, initialize gRPC client here
        
    def create_invoice(self, memo: str, amount_sats: int) -> Dict[str, Any]:
        """
        Create a Lightning invoice.
        
        Args:
            memo: Invoice memo/description
            amount_sats: Amount in sats
            
        Returns:
            Dict with payment_request, payment_hash, etc.
        """
        # Placeholder implementation - replace with actual LND gRPC call
        logger.info(f"Creating invoice: {amount_sats} sats, memo: {memo}")
        
        # Mock response for development
        return {
            "payment_request": f"lnbc{amount_sats}u1p...",  # Mock invoice
            "payment_hash": f"mock_hash_{uuid.uuid4().hex[:32]}",
            "add_index": 1,
            "payment_addr": f"mock_addr_{uuid.uuid4().hex[:32]}"
        }
    
    def send_payment(self, payment_request: str) -> Dict[str, Any]:
        """
        Send a Lightning payment.
        
        Args:
            payment_request: Lightning payment request/invoice
            
        Returns:
            Dict with payment_hash, preimage, status, etc.
        """
        # Placeholder implementation - replace with actual LND gRPC call
        logger.info(f"Sending payment for invoice: {payment_request[:50]}...")
        
        # Mock response for development
        return {
            "payment_hash": f"mock_payment_{uuid.uuid4().hex[:32]}",
            "preimage": f"mock_preimage_{uuid.uuid4().hex[:32]}",
            "status": "SUCCEEDED",
            "fee_sat": 1,
            "fee_msat": 1000
        }
    
    def get_node_info(self) -> Dict[str, Any]:
        """Get Lightning node information"""
        return {
            "identity_pubkey": "mock_pubkey",
            "alias": "SunuSàv Node",
            "num_channels": 0,
            "num_peers": 0
        }

class BTCPayClient:
    """BTCPayServer client wrapper"""
    
    def __init__(self, btcpay_url: str, api_key: str):
        self.btcpay_url = btcpay_url
        self.api_key = api_key
    
    def create_invoice(self, amount_sats: int, currency: str = 'BTC') -> Dict[str, Any]:
        """Create BTCPayServer invoice"""
        # Placeholder implementation
        logger.info(f"Creating BTCPay invoice: {amount_sats} sats")
        return {
            "id": f"btcpay_{uuid.uuid4().hex[:16]}",
            "url": f"{self.btcpay_url}/i/{uuid.uuid4().hex[:16]}",
            "btcAddress": f"mock_address_{uuid.uuid4().hex[:32]}",
            "btcPrice": amount_sats,
            "status": "New"
        }

def process_payout(
    db: Session, 
    cycle_id: str, 
    lnd_client: LndClient, 
    *, 
    group_verified: bool = False, 
    user_recurring: bool = False
) -> Dict[str, Any]:
    """
    Process a tontine cycle payout with fee calculation and Lightning payment.
    
    Args:
        db: Database session
        cycle_id: ID of the tontine cycle to process
        lnd_client: Lightning client instance
        group_verified: Whether the group is verified
        user_recurring: Whether the user has recurring subscription
        
    Returns:
        Dict with payout details and fee breakdown
    """
    logger.info(f"Processing payout for cycle {cycle_id}")
    
    # Get cycle from database
    cycle = db.query(TontineCycle).filter(TontineCycle.id == cycle_id).first()
    if not cycle:
        raise ValueError(f"Cycle {cycle_id} not found")
    
    if cycle.status != "ready":
        raise ValueError(f"Cycle {cycle_id} is not ready for payout (status: {cycle.status})")
    
    # Verify all contributions are collected
    transactions = db.query(Transaction).filter(Transaction.cycle_id == cycle_id).all()
    if not transactions:
        raise ValueError(f"No transactions found for cycle {cycle_id}")
    
    # Calculate fees
    payout_total = int(cycle.payout_total_sats)
    fee_info = calculate_fee_for_payout(
        payout_total, 
        group_verified=group_verified, 
        user_recurring=user_recurring
    )
    
    sats_fee = fee_info["sats_fee"]
    platform_share = fee_info["platform_share"]
    community_share = fee_info["community_share"]
    partner_reserved = fee_info["partner_reserved"]
    
    net_payout = payout_total - sats_fee
    if net_payout <= 0:
        raise ValueError(f"Net payout is non-positive: {net_payout} sats")
    
    # Get current exchange rate for record keeping
    current_rate = fetch_btc_xof_rate()
    
    # Create payout log entry
    payout_log = PayoutLog(
        id=str(uuid.uuid4()),
        cycle_id=cycle_id,
        payout_method="lightning",
        status="initiated"
    )
    db.add(payout_log)
    
    try:
        # Process Lightning payout
        if not cycle.withdraw_invoice:
            raise ValueError("Winner has not provided withdraw invoice")
        
        logger.info(f"Sending Lightning payment: {net_payout} sats")
        payment_result = lnd_client.send_payment(cycle.withdraw_invoice)
        
        # Update payout log with Lightning details
        payout_log.lightning_payment_hash = payment_result.get("payment_hash")
        payout_log.lightning_preimage = payment_result.get("preimage")
        payout_log.status = "completed"
        payout_log.completed_at = datetime.utcnow()
        
        # Record fee in database
        fee_record = FeeRecord(
            id=str(uuid.uuid4()),
            cycle_id=cycle.id,
            sats_fee=sats_fee,
            sats_to_partner=partner_reserved,
            sats_to_community=community_share,
            sats_to_platform=platform_share,
            reason="payout_cycle_fee",
            btc_xof_rate_at_record=current_rate
        )
        
        # Generate on-chain proof hash
        fee_summary = {
            "cycle_id": cycle_id,
            "sats_fee": sats_fee,
            "platform_share": platform_share,
            "community_share": community_share,
            "partner_reserved": partner_reserved,
            "timestamp": datetime.utcnow().isoformat(),
            "rate": float(current_rate)
        }
        fee_record.opreturn_hash = build_fee_summary_hash(fee_summary)
        
        db.add(fee_record)
        
        # Update cycle status
        cycle.status = "paid"
        
        # Create partner settlement if needed
        if partner_reserved > 0:
            xof_amount = sats_to_xof(partner_reserved)
            partner_settlement = PartnerSettlement(
                id=str(uuid.uuid4()),
                partner="wave",  # Default partner
                xof_amount=xof_amount,
                sats_equivalent=partner_reserved,
                status="pending"
            )
            db.add(partner_settlement)
            logger.info(f"Created partner settlement: {xof_amount} XOF")
        
        # Record exchange rate used
        exchange_rate = ExchangeRate(
            id=str(uuid.uuid4()),
            btc_xof_rate=current_rate,
            source="payout_processing",
            is_active=True
        )
        db.add(exchange_rate)
        
        db.commit()
        
        logger.info(f"Successfully processed payout for cycle {cycle_id}")
        
        return {
            "cycle_id": cycle.id,
            "payout_total": payout_total,
            "sats_fee": sats_fee,
            "net_payout": net_payout,
            "platform_share": platform_share,
            "community_share": community_share,
            "partner_reserved": partner_reserved,
            "lightning_payment_hash": payment_result.get("payment_hash"),
            "lightning_preimage": payment_result.get("preimage"),
            "status": "completed",
            "exchange_rate": float(current_rate)
        }
        
    except Exception as e:
        logger.error(f"Payout failed for cycle {cycle_id}: {e}")
        
        # Update payout log with error
        payout_log.status = "failed"
        payout_log.error_message = str(e)
        
        # Update cycle status
        cycle.status = "failed"
        
        db.commit()
        raise

def verify_cycle_contributions(db: Session, cycle_id: str) -> bool:
    """
    Verify that all required contributions for a cycle have been collected.
    
    Args:
        db: Database session
        cycle_id: ID of the tontine cycle
        
    Returns:
        True if all contributions are collected, False otherwise
    """
    cycle = db.query(TontineCycle).filter(TontineCycle.id == cycle_id).first()
    if not cycle:
        return False
    
    # Get group to check member count
    group = cycle.group
    if not group:
        return False
    
    # Count collected contributions
    transactions = db.query(Transaction).filter(
        Transaction.cycle_id == cycle_id,
        Transaction.paid_at.isnot(None)
    ).all()
    
    # Check if we have contributions from all group members
    # This is a simplified check - in production you'd want more sophisticated logic
    expected_contributions = group.current_members if hasattr(group, 'current_members') else 1
    collected_contributions = len(transactions)
    
    logger.info(f"Cycle {cycle_id}: {collected_contributions}/{expected_contributions} contributions collected")
    
    return collected_contributions >= expected_contributions

def mark_cycle_ready(db: Session, cycle_id: str) -> bool:
    """
    Mark a cycle as ready for payout if all contributions are collected.
    
    Args:
        db: Database session
        cycle_id: ID of the tontine cycle
        
    Returns:
        True if cycle was marked ready, False otherwise
    """
    if not verify_cycle_contributions(db, cycle_id):
        return False
    
    cycle = db.query(TontineCycle).filter(TontineCycle.id == cycle_id).first()
    if not cycle:
        return False
    
    cycle.status = "ready"
    db.commit()
    
    logger.info(f"Marked cycle {cycle_id} as ready for payout")
    return True

def get_payout_status(db: Session, cycle_id: str) -> Dict[str, Any]:
    """
    Get the current status of a payout.
    
    Args:
        db: Database session
        cycle_id: ID of the tontine cycle
        
    Returns:
        Dict with payout status information
    """
    cycle = db.query(TontineCycle).filter(TontineCycle.id == cycle_id).first()
    if not cycle:
        return {"error": "Cycle not found"}
    
    payout_log = db.query(PayoutLog).filter(PayoutLog.cycle_id == cycle_id).first()
    
    return {
        "cycle_id": cycle_id,
        "cycle_status": cycle.status,
        "payout_status": payout_log.status if payout_log else "not_initiated",
        "payout_method": payout_log.payout_method if payout_log else None,
        "lightning_payment_hash": payout_log.lightning_payment_hash if payout_log else None,
        "error_message": payout_log.error_message if payout_log else None,
        "created_at": payout_log.created_at.isoformat() if payout_log else None,
        "completed_at": payout_log.completed_at.isoformat() if payout_log else None
    }
