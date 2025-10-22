# services/ai-fraud/app/main.py
from fastapi import FastAPI, HTTPException, Header, Depends
from pydantic import BaseModel
import os
import joblib
import numpy as np
import logging
from typing import Optional, List
from pyod.models.iforest import IForest

# Security: require an internal auth token
INTERNAL_TOKEN = os.getenv("AI_INTERNAL_TOKEN", "devtoken")
MODEL_PATH = os.getenv("FRAUD_MODEL_PATH", "models/fraud_iforest.pkl")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TransactionFeatures(BaseModel):
    user_id: str
    amount_sats: int
    time_since_last_sec: float
    invoices_last_min: int
    device_changes: int
    location_changes: int
    payment_hash: Optional[str] = None

class FraudCheckResponse(BaseModel):
    alert: bool
    score: float
    confidence: float
    model_version: str
    reason: Optional[str] = None

class BatchTransactionFeatures(BaseModel):
    transactions: List[TransactionFeatures]

app = FastAPI(
    title="SunuSàv AI Fraud Detection Service",
    description="AI-powered fraud detection for Lightning payments",
    version="1.0.0"
)

model = None

@app.on_event("startup")
def load_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            logger.info(f"Loaded fraud detection model from {MODEL_PATH}")
        else:
            model = None
            logger.warning(f"Model not found at {MODEL_PATH}. Using rule-based detection.")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        model = None

def check_auth(x_internal_token: str = Header(None)):
    """Validate internal service authentication"""
    if x_internal_token != INTERNAL_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

def rule_based_fraud_detection(features: TransactionFeatures) -> tuple[bool, float, str]:
    """Rule-based fraud detection as fallback"""
    alert = False
    score = 0.0
    reason = None
    
    # Rule 1: Unusually large amount
    if features.amount_sats > 1000000:  # 1M sats threshold
        alert = True
        score = 0.8
        reason = "large_amount"
    
    # Rule 2: Rapid-fire payments
    elif features.invoices_last_min > 10:
        alert = True
        score = 0.7
        reason = "rapid_fire_payments"
    
    # Rule 3: Suspicious timing
    elif features.time_since_last_sec < 5 and features.amount_sats > 50000:
        alert = True
        score = 0.6
        reason = "suspicious_timing"
    
    # Rule 4: Multiple device/location changes
    elif features.device_changes > 3 or features.location_changes > 2:
        alert = True
        score = 0.5
        reason = "device_location_changes"
    
    return alert, score, reason

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH
    }

@app.post("/check", dependencies=[Depends(check_auth)])
def check_transaction(features: TransactionFeatures):
    """Check a single transaction for fraud"""
    try:
        if model is None:
            # Use rule-based detection
            alert, score, reason = rule_based_fraud_detection(features)
            confidence = 0.6
            model_version = "rule-based-v1"
            logger.warning(f"Using rule-based fraud detection for user {features.user_id}")
        else:
            # Use ML model
            x = np.array([[
                features.amount_sats,
                features.time_since_last_sec,
                features.invoices_last_min,
                features.device_changes,
                features.location_changes
            ]])
            
            # Isolation Forest: predict returns 0 (normal) or 1 (anomaly)
            pred = model.predict(x)[0]
            score = float(model.decision_function(x)[0])
            
            # Convert to probability-like score (0-1)
            normalized_score = max(0, min(1, (score + 0.1) / 0.2))
            
            alert = bool(pred == 1)
            confidence = 0.9
            model_version = "isolation-forest-v1"
            reason = "ml_anomaly" if alert else None
        
        logger.info(f"Fraud check for user {features.user_id}: alert={alert}, score={score:.3f}")
        
        return FraudCheckResponse(
            alert=alert,
            score=round(normalized_score, 3),
            confidence=confidence,
            model_version=model_version,
            reason=reason
        )
        
    except Exception as e:
        logger.error(f"Error checking fraud for user {features.user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Fraud check failed: {str(e)}")

@app.post("/batch-check", dependencies=[Depends(check_auth)])
def batch_check_transactions(batch_features: BatchTransactionFeatures):
    """Check multiple transactions for fraud"""
    results = []
    
    for tx_features in batch_features.transactions:
        try:
            result = check_transaction(tx_features)
            results.append({
                "user_id": tx_features.user_id,
                "payment_hash": tx_features.payment_hash,
                "alert": result.alert,
                "score": result.score,
                "confidence": result.confidence,
                "model_version": result.model_version,
                "reason": result.reason
            })
        except Exception as e:
            logger.error(f"Failed fraud check for user {tx_features.user_id}: {e}")
            results.append({
                "user_id": tx_features.user_id,
                "payment_hash": tx_features.payment_hash,
                "error": str(e)
            })
    
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
