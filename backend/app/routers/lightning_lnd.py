# backend/app/routers/lightning_lnd.py
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, constr
import re
import os
import logging
from app.utils.lnd_client import LndClient, LndClientError

logger = logging.getLogger("lightning_router")

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
def pay_invoice(payload: PayInvoiceIn, lnd: LndClient = Depends(get_lnd_client)):
    """
    Pay a BOLT11 invoice through LND.
    """
    invoice_raw = payload.invoice.strip()
    # optional: remove lightning: prefix
    if invoice_raw.startswith("lightning:"):
        invoice_raw = invoice_raw.split(":", 1)[1]

    # Basic syntactic check
    if not BOLT11_HINT_RE.match(invoice_raw[:8]):
        # allow through but warn - we perform calling LND that will error if invalid
        logger.debug("Invoice doesn't match quick BOLT11 hint regex - continuing anyway")

    # Optionally enforce server-side fee limit
    fee_limit = payload.fee_limit_sat or int(os.getenv("LND_DEFAULT_FEE_LIMIT_SAT", "10"))
    timeout = payload.timeout_seconds or int(os.getenv("LND_REQUEST_TIMEOUT", "60"))

    # Call LND
    try:
        res = lnd.pay_invoice(payment_request=invoice_raw, timeout_seconds=timeout, fee_limit_sat=fee_limit)
    except LndClientError as e:
        logger.error("LND payment error: %s", str(e))
        raise HTTPException(status_code=502, detail=f"LND error: {str(e)}")

    # Normalize response
    if res.get("success"):
        # include minimal fields for client
        return {
            "success": True,
            "preimage": res.get("preimage"),
            "fee_sat": res.get("fee_sat"),
            "raw": res.get("raw_event")
        }
    else:
        # For failures return sanitized error message and allow client to decide
        err = res.get("error") or "payment_failed"
        logger.info("Payment failed for invoice: %s; reason: %s", invoice_raw[:30], err)
        raise HTTPException(status_code=400, detail=f"Payment failed: {err}")

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
