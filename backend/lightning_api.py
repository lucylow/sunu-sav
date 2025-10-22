# Lightning API Backend for SunuSàv
# Simple FastAPI implementation for Lightning Network payments

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import requests
import re
import logging
from typing import Optional

app = FastAPI(title="SunuSàv Lightning API")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# Lightning payment endpoint
@app.post("/lightning/pay", response_model=PayInvoiceResponse)
async def pay_invoice(request: PayInvoiceRequest):
    """
    Pay a Lightning invoice via server
    """
    try:
        invoice = request.invoice.strip()
        
        # Basic invoice validation
        if len(invoice) < 50 or len(invoice) > 3000:
            raise HTTPException(status_code=400, detail="Invalid invoice length")
        
        # Check if it looks like a BOLT11 invoice
        if not re.match(r'^(lnbc|lntb|lnbcrt)', invoice.lower()):
            raise HTTPException(status_code=400, detail="Invalid invoice format")
        
        # In a real implementation, you would:
        # 1. Connect to LND node via gRPC or REST
        # 2. Send payment using the invoice
        # 3. Return payment result with preimage and fees
        
        # For demo purposes, simulate payment
        import time
        time.sleep(1)  # Simulate network delay
        
        # Simulate success/failure (70% success rate for demo)
        import random
        if random.random() > 0.3:
            return PayInvoiceResponse(
                success=True,
                preimage="deadbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
                fee_sats=random.randint(1, 10)
            )
        else:
            return PayInvoiceResponse(
                success=False,
                error="Payment failed - insufficient funds"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Payment failed: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "lightning-api"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "SunuSàv Lightning API",
        "version": "1.0.0",
        "endpoints": {
            "ln_parse": "/ln/parse",
            "lightning_pay": "/lightning/pay",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
