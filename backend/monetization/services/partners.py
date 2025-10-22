# backend/monetization/services/partners.py
import logging
import requests
import uuid
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, Optional, List
from decimal import Decimal

from ..models import PartnerSettlement, ExchangeRate
from ..util.rates import sats_to_xof, xof_to_sats

logger = logging.getLogger(__name__)

class MobileMoneyPartner:
    """Base class for mobile money partners"""
    
    def __init__(self, name: str, api_key: str, api_url: str):
        self.name = name
        self.api_key = api_key
        self.api_url = api_url
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        })
    
    def cashout_xof(self, to_phone: str, amount_xof: Decimal, reference: str = None) -> Dict[str, Any]:
        """
        Send XOF to user's phone via partner API.
        
        Args:
            to_phone: Recipient phone number
            amount_xof: Amount in XOF
            reference: Optional reference for the transaction
            
        Returns:
            Dict with settlement metadata
        """
        raise NotImplementedError("Subclasses must implement cashout_xof")
    
    def get_balance(self) -> Dict[str, Any]:
        """Get partner account balance"""
        raise NotImplementedError("Subclasses must implement get_balance")
    
    def get_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """Get transaction status"""
        raise NotImplementedError("Subclasses must implement get_transaction_status")

class WaveClient(MobileMoneyPartner):
    """Wave mobile money integration"""
    
    def __init__(self, api_key: str, api_url: str = "https://api.wave.com"):
        super().__init__("wave", api_key, api_url)
    
    def cashout_xof(self, to_phone: str, amount_xof: Decimal, reference: str = None) -> Dict[str, Any]:
        """
        Send XOF via Wave API.
        
        Args:
            to_phone: Recipient phone number (format: +221XXXXXXXX)
            amount_xof: Amount in XOF
            reference: Optional reference
            
        Returns:
            Dict with transaction details
        """
        if not reference:
            reference = f"sunusav_{uuid.uuid4().hex[:16]}"
        
        payload = {
            "recipient_phone": to_phone,
            "amount": float(amount_xof),
            "currency": "XOF",
            "reference": reference,
            "description": "SunuSàv Tontine Payout"
        }
        
        try:
            logger.info(f"Sending Wave cashout: {amount_xof} XOF to {to_phone}")
            
            # Placeholder implementation - replace with actual Wave API
            response = self.session.post(
                f"{self.api_url}/v1/transfers",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Wave cashout successful: {result.get('transaction_id')}")
                
                return {
                    "success": True,
                    "transaction_id": result.get("transaction_id", reference),
                    "reference": reference,
                    "amount_xof": float(amount_xof),
                    "recipient_phone": to_phone,
                    "status": "completed",
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                logger.error(f"Wave API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}",
                    "reference": reference
                }
                
        except Exception as e:
            logger.error(f"Wave cashout failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "reference": reference
            }
    
    def get_balance(self) -> Dict[str, Any]:
        """Get Wave account balance"""
        try:
            response = self.session.get(f"{self.api_url}/v1/balance", timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Wave balance API error: {response.status_code}")
                return {"error": f"API error: {response.status_code}"}
        except Exception as e:
            logger.error(f"Failed to get Wave balance: {e}")
            return {"error": str(e)}
    
    def get_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """Get Wave transaction status"""
        try:
            response = self.session.get(
                f"{self.api_url}/v1/transactions/{transaction_id}",
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Wave transaction status API error: {response.status_code}")
                return {"error": f"API error: {response.status_code}"}
        except Exception as e:
            logger.error(f"Failed to get Wave transaction status: {e}")
            return {"error": str(e)}

class OrangeClient(MobileMoneyPartner):
    """Orange Money integration"""
    
    def __init__(self, api_key: str, api_url: str = "https://api.orange.com"):
        super().__init__("orange", api_key, api_url)
    
    def cashout_xof(self, to_phone: str, amount_xof: Decimal, reference: str = None) -> Dict[str, Any]:
        """Send XOF via Orange Money API"""
        if not reference:
            reference = f"sunusav_{uuid.uuid4().hex[:16]}"
        
        payload = {
            "msisdn": to_phone,
            "amount": float(amount_xof),
            "currency": "XOF",
            "external_id": reference,
            "description": "SunuSàv Tontine Payout"
        }
        
        try:
            logger.info(f"Sending Orange cashout: {amount_xof} XOF to {to_phone}")
            
            # Placeholder implementation - replace with actual Orange API
            response = self.session.post(
                f"{self.api_url}/orange-money-webpay/v1/webpayment",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Orange cashout successful: {result.get('transaction_id')}")
                
                return {
                    "success": True,
                    "transaction_id": result.get("transaction_id", reference),
                    "reference": reference,
                    "amount_xof": float(amount_xof),
                    "recipient_phone": to_phone,
                    "status": "completed",
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                logger.error(f"Orange API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}",
                    "reference": reference
                }
                
        except Exception as e:
            logger.error(f"Orange cashout failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "reference": reference
            }
    
    def get_balance(self) -> Dict[str, Any]:
        """Get Orange Money account balance"""
        try:
            response = self.session.get(f"{self.api_url}/orange-money-webpay/v1/balance", timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Orange balance API error: {response.status_code}")
                return {"error": f"API error: {response.status_code}"}
        except Exception as e:
            logger.error(f"Failed to get Orange balance: {e}")
            return {"error": str(e)}
    
    def get_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """Get Orange transaction status"""
        try:
            response = self.session.get(
                f"{self.api_url}/orange-money-webpay/v1/transactions/{transaction_id}",
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Orange transaction status API error: {response.status_code}")
                return {"error": f"API error: {response.status_code}"}
        except Exception as e:
            logger.error(f"Failed to get Orange transaction status: {e}")
            return {"error": str(e)}

class MTNClient(MobileMoneyPartner):
    """MTN Mobile Money integration"""
    
    def __init__(self, api_key: str, api_url: str = "https://api.mtn.com"):
        super().__init__("mtn", api_key, api_url)
    
    def cashout_xof(self, to_phone: str, amount_xof: Decimal, reference: str = None) -> Dict[str, Any]:
        """Send XOF via MTN Mobile Money API"""
        if not reference:
            reference = f"sunusav_{uuid.uuid4().hex[:16]}"
        
        payload = {
            "msisdn": to_phone,
            "amount": float(amount_xof),
            "currency": "XOF",
            "external_id": reference,
            "description": "SunuSàv Tontine Payout"
        }
        
        try:
            logger.info(f"Sending MTN cashout: {amount_xof} XOF to {to_phone}")
            
            # Placeholder implementation - replace with actual MTN API
            response = self.session.post(
                f"{self.api_url}/v1/transfer",
                json=payload,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"MTN cashout successful: {result.get('transaction_id')}")
                
                return {
                    "success": True,
                    "transaction_id": result.get("transaction_id", reference),
                    "reference": reference,
                    "amount_xof": float(amount_xof),
                    "recipient_phone": to_phone,
                    "status": "completed",
                    "timestamp": datetime.utcnow().isoformat()
                }
            else:
                logger.error(f"MTN API error: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API error: {response.status_code}",
                    "reference": reference
                }
                
        except Exception as e:
            logger.error(f"MTN cashout failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "reference": reference
            }
    
    def get_balance(self) -> Dict[str, Any]:
        """Get MTN Mobile Money account balance"""
        try:
            response = self.session.get(f"{self.api_url}/v1/balance", timeout=10)
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"MTN balance API error: {response.status_code}")
                return {"error": f"API error: {response.status_code}"}
        except Exception as e:
            logger.error(f"Failed to get MTN balance: {e}")
            return {"error": str(e)}
    
    def get_transaction_status(self, transaction_id: str) -> Dict[str, Any]:
        """Get MTN transaction status"""
        try:
            response = self.session.get(
                f"{self.api_url}/v1/transactions/{transaction_id}",
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"MTN transaction status API error: {response.status_code}")
                return {"error": f"API error: {response.status_code}"}
        except Exception as e:
            logger.error(f"Failed to get MTN transaction status: {e}")
            return {"error": str(e)}

def get_partner_client(partner_name: str, api_key: str) -> MobileMoneyPartner:
    """
    Get a partner client instance.
    
    Args:
        partner_name: Name of the partner ("wave", "orange", "mtn")
        api_key: API key for the partner
        
    Returns:
        Partner client instance
    """
    partner_name = partner_name.lower()
    
    if partner_name == "wave":
        return WaveClient(api_key)
    elif partner_name == "orange":
        return OrangeClient(api_key)
    elif partner_name == "mtn":
        return MTNClient(api_key)
    else:
        raise ValueError(f"Unknown partner: {partner_name}")

def settle_partner_settlements(db: Session, partner_client: MobileMoneyPartner) -> Dict[str, Any]:
    """
    Process unsettled partner settlements.
    
    Args:
        db: Database session
        partner_client: Partner client instance
        
    Returns:
        Dict with settlement results
    """
    logger.info(f"Processing settlements for partner: {partner_client.name}")
    
    # Find unsettled settlements for this partner
    unsettled = db.query(PartnerSettlement).filter(
        PartnerSettlement.partner == partner_client.name,
        PartnerSettlement.status == "pending"
    ).all()
    
    if not unsettled:
        logger.info(f"No unsettled settlements found for {partner_client.name}")
        return {
            "partner": partner_client.name,
            "processed": 0,
            "successful": 0,
            "failed": 0
        }
    
    results = {
        "partner": partner_client.name,
        "processed": len(unsettled),
        "successful": 0,
        "failed": 0,
        "settlements": []
    }
    
    for settlement in unsettled:
        try:
            logger.info(f"Processing settlement {settlement.id}: {settlement.xof_amount} XOF")
            
            # Update status to processing
            settlement.status = "processing"
            db.commit()
            
            # Execute cashout
            # Note: In production, you'd need the recipient phone number
            # This would come from user preferences or the payout request
            recipient_phone = "+221701234567"  # Placeholder
            
            cashout_result = partner_client.cashout_xof(
                to_phone=recipient_phone,
                amount_xof=settlement.xof_amount,
                reference=settlement.id
            )
            
            if cashout_result.get("success"):
                # Update settlement as completed
                settlement.status = "completed"
                settlement.settled_at = datetime.utcnow()
                settlement.settlement_reference = cashout_result.get("transaction_id")
                
                results["successful"] += 1
                logger.info(f"Settlement {settlement.id} completed successfully")
                
            else:
                # Mark as failed
                settlement.status = "failed"
                results["failed"] += 1
                logger.error(f"Settlement {settlement.id} failed: {cashout_result.get('error')}")
            
            db.commit()
            
            results["settlements"].append({
                "settlement_id": settlement.id,
                "amount_xof": float(settlement.xof_amount),
                "status": settlement.status,
                "transaction_id": cashout_result.get("transaction_id"),
                "error": cashout_result.get("error")
            })
            
        except Exception as e:
            logger.error(f"Failed to process settlement {settlement.id}: {e}")
            settlement.status = "failed"
            results["failed"] += 1
            db.rollback()
    
    logger.info(f"Settlement processing complete: {results}")
    return results

def get_partner_balance(db: Session, partner_name: str, api_key: str) -> Dict[str, Any]:
    """
    Get partner account balance.
    
    Args:
        db: Database session
        partner_name: Name of the partner
        api_key: API key for the partner
        
    Returns:
        Dict with balance information
    """
    try:
        partner_client = get_partner_client(partner_name, api_key)
        balance_info = partner_client.get_balance()
        
        return {
            "partner": partner_name,
            "balance": balance_info,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error(f"Failed to get balance for {partner_name}: {e}")
        return {
            "partner": partner_name,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

def get_settlement_summary(db: Session, partner_name: str = None) -> Dict[str, Any]:
    """
    Get settlement summary for a partner or all partners.
    
    Args:
        db: Database session
        partner_name: Optional partner name to filter by
        
    Returns:
        Dict with settlement summary
    """
    query = db.query(PartnerSettlement)
    
    if partner_name:
        query = query.filter(PartnerSettlement.partner == partner_name)
    
    settlements = query.all()
    
    summary = {
        "total_settlements": len(settlements),
        "total_amount_xof": sum(float(s.xof_amount) for s in settlements),
        "total_amount_sats": sum(s.sats_equivalent for s in settlements),
        "by_status": {},
        "by_partner": {}
    }
    
    # Group by status
    for settlement in settlements:
        status = settlement.status
        if status not in summary["by_status"]:
            summary["by_status"][status] = {
                "count": 0,
                "amount_xof": 0,
                "amount_sats": 0
            }
        
        summary["by_status"][status]["count"] += 1
        summary["by_status"][status]["amount_xof"] += float(settlement.xof_amount)
        summary["by_status"][status]["amount_sats"] += settlement.sats_equivalent
    
    # Group by partner
    for settlement in settlements:
        partner = settlement.partner
        if partner not in summary["by_partner"]:
            summary["by_partner"][partner] = {
                "count": 0,
                "amount_xof": 0,
                "amount_sats": 0
            }
        
        summary["by_partner"][partner]["count"] += 1
        summary["by_partner"][partner]["amount_xof"] += float(settlement.xof_amount)
        summary["by_partner"][partner]["amount_sats"] += settlement.sats_equivalent
    
    return summary
