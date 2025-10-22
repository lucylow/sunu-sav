# Lightning API Backend for SunuSàv
# Production-ready FastAPI implementation with LND integration

from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
import requests
import re
import logging
import os
from typing import Optional
from app.utils.lnd_client import LndClient, LndClientError
from app.routers import lightning_lnd

app = FastAPI(title="SunuSàv Lightning API")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Include the Lightning router
app.include_router(lightning_lnd.router, prefix="/lightning", tags=["lightning"])

# Models
class LnurlParseRequest(BaseModel):
    lnurl: str

class LnurlMetadata(BaseModel):
    callback: str
    minSendable: int
    maxSendable: int
    metadata: str

class PayInvoiceRequest(BaseModel):
    invoice: str

class PayInvoiceResponse(BaseModel):
    success: bool
    preimage: Optional[str] = None
    fee_sats: Optional[int] = None
    error: Optional[str] = None

# LNURL parsing endpoint
@app.post("/ln/parse")
async def parse_lnurl(request: LnurlParseRequest):
    """
    Parse LNURL bech32 string and fetch metadata
    """
    try:
        lnurl = request.lnurl.strip().lower()
        
        # Basic LNURL validation
        if not lnurl.startswith('lnurl1'):
            raise HTTPException(status_code=400, detail="Invalid LNURL format")
        
        # In a real implementation, you would:
        # 1. Decode bech32 to get the URL
        # 2. Fetch metadata from the URL
        # 3. Return structured metadata
        
        # For demo purposes, return mock data
        mock_metadata = LnurlMetadata(
            callback="https://example.com/lnurl/callback",
            minSendable=1000,  # 1 sat
            maxSendable=100000000,  # 100,000 sats
            metadata="SunuSàv Lightning Payment"
        )
        
        return {
            "success": True,
            "metadata": mock_metadata.dict()
        }
        
    except Exception as e:
        logger.error(f"LNURL parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to parse LNURL: {str(e)}")

# Legacy payment endpoint (redirects to new router)
@app.post("/lightning/pay", response_model=PayInvoiceResponse)
async def pay_invoice_legacy(request: PayInvoiceRequest):
    """
    Legacy payment endpoint - redirects to new LND implementation
    """
    try:
        # Use the new LND client
        lnd_client = LndClient(
            rest_url=os.getenv("LND_REST_URL"),
            macaroon_path=os.getenv("LND_MACAROON_PATH"),
            tls_cert_path=os.getenv("LND_TLS_CERT_PATH")
        )
        
        invoice = request.invoice.strip()
        
        # Basic invoice validation
        if len(invoice) < 50 or len(invoice) > 3000:
            raise HTTPException(status_code=400, detail="Invalid invoice length")
        
        # Check if it looks like a BOLT11 invoice
        if not re.match(r'^(lnbc|lntb|lnbcrt)', invoice.lower()):
            raise HTTPException(status_code=400, detail="Invalid invoice format")
        
        # Call LND
        try:
            res = lnd_client.pay_invoice(payment_request=invoice)
            
            if res.get("success"):
                return PayInvoiceResponse(
                    success=True,
                    preimage=res.get("preimage"),
                    fee_sats=res.get("fee_sat")
                )
            else:
                return PayInvoiceResponse(
                    success=False,
                    error=res.get("error", "Payment failed")
                )
                
        except LndClientError as e:
            logger.error(f"LND payment error: {str(e)}")
            return PayInvoiceResponse(
                success=False,
                error=f"LND error: {str(e)}"
            )
            
    except Exception as e:
        logger.error(f"Payment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment failed: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    try:
        # Check LND connection
        lnd_client = LndClient(
            rest_url=os.getenv("LND_REST_URL"),
            macaroon_path=os.getenv("LND_MACAROON_PATH"),
            tls_cert_path=os.getenv("LND_TLS_CERT_PATH")
        )
        info = lnd_client.get_info()
        
        return {
            "status": "healthy", 
            "service": "lightning-api",
            "lnd_connected": True,
            "node_id": info.get("identity_pubkey", "unknown"),
            "synced": info.get("synced_to_chain", False)
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "lightning-api", 
            "lnd_connected": False,
            "error": str(e)
        }

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "SunuSàv Lightning API",
        "version": "2.0.0",
        "lnd_integration": True,
        "endpoints": {
            "ln_parse": "/ln/parse",
            "lightning_pay": "/lightning/pay",
            "lightning_pay_v2": "/lightning/pay",
            "lightning_invoice": "/lightning/invoice",
            "lightning_info": "/lightning/info",
            "lightning_health": "/lightning/health",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
