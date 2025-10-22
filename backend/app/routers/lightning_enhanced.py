# backend/app/routers/lightning_enhanced.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, constr
import re
import os
import logging
import uuid
from sqlalchemy.orm import Session
from app.utils.lnd_client import LndClient, LndClientError
from app.models.payment_attempt import PaymentAttempt
from app.database import get_db

logger = logging.getLogger("lightning_enhanced_router")

# Basic BOLT11 prefix check (not full validation)
BOLT11_HINT_RE = re.compile(r'^(lightning:)?(ln(bc|tb|bcrt)[0-9a-zA-Z]+)$', re.IGNORECASE)

class PayInvoiceIn(BaseModel):
    invoice: constr(min_length=40, max_length=4096)
    idempotency_key: constr(min_length=8) | None = None  # optional client id to dedupe
    fee_limit_sat: int | None = None
    timeout_seconds: int | None = None

class CreateInvoiceIn(BaseModel):
    amount_sats: int
    memo: str = ""
    expiry_seconds: int = 3600

router = APIRouter()

# initialize LND client instance once (module-level)
_lnd_client = None
def get_lnd_client():
    global _lnd_client
    if not _lnd_client:
        try:
            _lnd_client = LndClient(
                rest_url=os.getenv("LND_REST_URL"),
                macaroon_path=os.getenv("LND_MACAROON_PATH"),
                tls_cert_path=os.getenv("LND_TLS_CERT_PATH")
            )
        except Exception as e:
            logger.error("Failed to initialize LND client: %s", str(e))
            raise HTTPException(status_code=503, detail="Lightning service unavailable")
    return _lnd_client

@router.post("/pay")
def pay_invoice(payload: PayInvoiceIn, lnd: LndClient = Depends(get_lnd_client), db: Session = Depends(get_db)):
    """
    Pay a BOLT11 invoice through LND with idempotency support.
    """
    invoice_raw = payload.invoice.strip()
    # optional: remove lightning: prefix
    if invoice_raw.startswith("lightning:"):
        invoice_raw = invoice_raw.split(":", 1)[1]

    # Generate idempotency key if not provided
    idempotency_key = payload.idempotency_key or str(uuid.uuid4())

    # Check for existing payment attempt
    existing_attempt = db.query(PaymentAttempt).filter(PaymentAttempt.id == idempotency_key).first()
    
    if existing_attempt:
        if existing_attempt.status == "success":
            return {
                "success": True,
                "preimage": existing_attempt.preimage,
                "fee_sat": existing_attempt.fee_sat,
                "idempotency_key": idempotency_key,
                "cached": True
            }
        elif existing_attempt.status == "pending":
            raise HTTPException(status_code=409, detail="Payment already in progress")
        elif existing_attempt.status == "failed":
            # Allow retry for failed payments
            logger.info("Retrying failed payment with idempotency key: %s", idempotency_key)
    
    # Basic syntactic check
    if not BOLT11_HINT_RE.match(invoice_raw[:8]):
        logger.debug("Invoice doesn't match quick BOLT11 hint regex - continuing anyway")

    # Optionally enforce server-side fee limit
    fee_limit = payload.fee_limit_sat or int(os.getenv("LND_DEFAULT_FEE_LIMIT_SAT", "10"))
    timeout = payload.timeout_seconds or int(os.getenv("LND_REQUEST_TIMEOUT", "60"))

    # Create or update payment attempt record
    if existing_attempt:
        existing_attempt.status = "pending"
        existing_attempt.invoice = invoice_raw
        payment_attempt = existing_attempt
    else:
        payment_attempt = PaymentAttempt(
            id=idempotency_key,
            invoice=invoice_raw,
            status="pending"
        )
        db.add(payment_attempt)
    
    db.commit()

    # Call LND
    try:
        res = lnd.pay_invoice(payment_request=invoice_raw, timeout_seconds=timeout, fee_limit_sat=fee_limit)
        
        # Update payment attempt with result
        if res.get("success"):
            payment_attempt.status = "success"
            payment_attempt.preimage = res.get("preimage")
            payment_attempt.fee_sat = res.get("fee_sat")
            payment_attempt.error_message = None
        else:
            payment_attempt.status = "failed"
            payment_attempt.error_message = res.get("error")
        
        db.commit()

        # Return response
        if res.get("success"):
            return {
                "success": True,
                "preimage": res.get("preimage"),
                "fee_sat": res.get("fee_sat"),
                "idempotency_key": idempotency_key,
                "raw": res.get("raw_event")
            }
        else:
            err = res.get("error") or "payment_failed"
            logger.info("Payment failed for invoice: %s; reason: %s", invoice_raw[:30], err)
            raise HTTPException(status_code=400, detail=f"Payment failed: {err}")
            
    except LndClientError as e:
        # Update payment attempt with error
        payment_attempt.status = "failed"
        payment_attempt.error_message = str(e)
        db.commit()
        
        logger.error("LND payment error: %s", str(e))
        raise HTTPException(status_code=502, detail=f"LND error: {str(e)}")
    except Exception as e:
        # Update payment attempt with error
        payment_attempt.status = "failed"
        payment_attempt.error_message = str(e)
        db.commit()
        
        logger.error("Unexpected payment error: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/invoice")
def create_invoice(payload: CreateInvoiceIn, lnd: LndClient = Depends(get_lnd_client)):
    """
    Create a BOLT11 invoice via LND.
    """
    try:
        res = lnd.create_invoice(
            amount_sats=payload.amount_sats,
            memo=payload.memo,
            expiry_seconds=payload.expiry_seconds
        )
        return {
            "payment_request": res.get("payment_request"),
            "payment_hash": res.get("r_hash"),
            "amount_sats": payload.amount_sats,
            "memo": payload.memo,
            "expiry": payload.expiry_seconds
        }
    except LndClientError as e:
        logger.error("LND invoice creation error: %s", str(e))
        raise HTTPException(status_code=502, detail=f"LND error: {str(e)}")

@router.get("/info")
def get_lnd_info(lnd: LndClient = Depends(get_lnd_client)):
    """
    Get LND node information for health checks.
    """
    try:
        info = lnd.get_info()
        return {
            "node_id": info.get("identity_pubkey"),
            "alias": info.get("alias"),
            "version": info.get("version"),
            "network": info.get("chains", [{}])[0].get("network", "unknown"),
            "block_height": info.get("block_height"),
            "synced_to_chain": info.get("synced_to_chain"),
            "synced_to_graph": info.get("synced_to_graph")
        }
    except LndClientError as e:
        logger.error("LND info error: %s", str(e))
        raise HTTPException(status_code=502, detail=f"LND error: {str(e)}")

@router.get("/health")
def lightning_health(lnd: LndClient = Depends(get_lnd_client)):
    """
    Lightning service health check.
    """
    try:
        info = lnd.get_info()
        return {
            "status": "healthy",
            "lnd_connected": True,
            "node_id": info.get("identity_pubkey", "unknown"),
            "synced": info.get("synced_to_chain", False)
        }
    except Exception as e:
        logger.error("Lightning health check failed: %s", str(e))
        return {
            "status": "unhealthy",
            "lnd_connected": False,
            "error": str(e)
        }

@router.get("/payment/{idempotency_key}")
def get_payment_status(idempotency_key: str, db: Session = Depends(get_db)):
    """
    Get payment status by idempotency key.
    """
    payment_attempt = db.query(PaymentAttempt).filter(PaymentAttempt.id == idempotency_key).first()
    
    if not payment_attempt:
        raise HTTPException(status_code=404, detail="Payment attempt not found")
    
    return payment_attempt.to_dict()
