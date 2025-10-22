# services/ai-fraud/main.py
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import numpy as np
from sklearn.ensemble import IsolationForest
import redis
import os
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SunuSàv AI Fraud Detection Service", version="1.0.0")

# Redis connection
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

# Simple authentication
def verify_token(x_internal_token: str = Header(None)):
    expected_token = os.getenv("AI_INTERNAL_TOKEN", "devtoken")
    if x_internal_token != expected_token:
        raise HTTPException(status_code=401, detail="Invalid token")
    return x_internal_token

# Pydantic models
class TransactionFeatures(BaseModel):
    user_id: str
    amount_sats: int
    time_since_last_sec: int
    invoices_last_min: int
    device_changes: int
    location_changes: int
    payment_hash: Optional[str] = None

class FraudResult(BaseModel):
    alert: bool
    score: float
    confidence: float
    reasons: list

class UserRiskProfile(BaseModel):
    risk_level: str
    score: float
    factors: list

# Mock fraud detection model
class MockFraudModel:
    def __init__(self):
        self.threshold = 0.6
        
    def predict(self, features: TransactionFeatures) -> Dict[str, Any]:
        score = 0.1  # Start with low risk
        
        reasons = []
        
        # Flag large amounts
        if features.amount_sats > 100000:
            score += 0.3
            reasons.append("Large transaction amount")
        
        # Flag rapid successive transactions
        if features.time_since_last_sec < 30:
            score += 0.4
            reasons.append("Rapid successive transactions")
        
        # Flag multiple invoices in short time
        if features.invoices_last_min > 5:
            score += 0.3
            reasons.append("High invoice frequency")
        
        # Flag device/location changes
        if features.device_changes > 2:
            score += 0.2
            reasons.append("Multiple device changes")
        if features.location_changes > 1:
            score += 0.2
            reasons.append("Location changes detected")
        
        alert = score > self.threshold
        confidence = min(0.95, score + 0.1)
        
        return {
            "alert": alert,
            "score": round(score, 3),
            "confidence": round(confidence, 3),
            "reasons": reasons
        }

# Initialize model
model = MockFraudModel()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-fraud"}

@app.post("/check", response_model=FraudResult)
async def check_transaction(
    features: TransactionFeatures,
    token: str = Depends(verify_token)
):
    try:
        logger.info(f"Checking transaction for fraud: user {features.user_id}, amount {features.amount_sats}")
        
        # Get fraud prediction
        result = model.predict(features)
        
        # Store transaction in Redis for pattern analysis
        transaction_key = f"tx:{features.user_id}:{features.payment_hash or 'unknown'}"
        redis_client.setex(
            transaction_key,
            3600,  # 1 hour TTL
            json.dumps({
                "features": features.dict(),
                "fraud_result": result
            })
        )
        
        return FraudResult(
            alert=result["alert"],
            score=result["score"],
            confidence=result["confidence"],
            reasons=result["reasons"]
        )
        
    except Exception as e:
        logger.error(f"Error checking transaction for fraud: {str(e)}")
        raise HTTPException(status_code=500, detail="Fraud check failed")

@app.get("/user/{user_id}/risk")
async def get_user_risk_profile(
    user_id: str,
    token: str = Depends(verify_token)
):
    try:
        # Get recent transactions for this user
        pattern = f"tx:{user_id}:*"
        transaction_keys = redis_client.keys(pattern)
        
        if not transaction_keys:
            return UserRiskProfile(
                risk_level="unknown",
                score=0.5,
                factors=["No transaction history"]
            )
        
        # Analyze recent transactions
        total_score = 0
        total_transactions = 0
        risk_factors = []
        
        for key in transaction_keys[-10:]:  # Last 10 transactions
            tx_data = redis_client.get(key)
            if tx_data:
                data = json.loads(tx_data)
                fraud_result = data.get("fraud_result", {})
                total_score += fraud_result.get("score", 0.5)
                total_transactions += 1
                
                if fraud_result.get("alert", False):
                    risk_factors.extend(fraud_result.get("reasons", []))
        
        if total_transactions == 0:
            return UserRiskProfile(
                risk_level="unknown",
                score=0.5,
                factors=["No transaction history"]
            )
        
        avg_score = total_score / total_transactions
        
        if avg_score >= 0.7:
            risk_level = "high"
        elif avg_score >= 0.4:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        return UserRiskProfile(
            risk_level=risk_level,
            score=round(avg_score, 3),
            factors=list(set(risk_factors))  # Remove duplicates
        )
        
    except Exception as e:
        logger.error(f"Error getting user risk profile: {str(e)}")
        raise HTTPException(status_code=500, detail="Risk profile failed")

@app.get("/stats")
async def get_fraud_stats(token: str = Depends(verify_token)):
    try:
        # Get basic statistics
        all_keys = redis_client.keys("tx:*")
        
        total_transactions = len(all_keys)
        flagged_transactions = 0
        
        for key in all_keys:
            tx_data = redis_client.get(key)
            if tx_data:
                data = json.loads(tx_data)
                if data.get("fraud_result", {}).get("alert", False):
                    flagged_transactions += 1
        
        fraud_rate = flagged_transactions / total_transactions if total_transactions > 0 else 0
        
        return {
            "total_transactions": total_transactions,
            "flagged_transactions": flagged_transactions,
            "fraud_rate": round(fraud_rate, 3),
            "model_threshold": model.threshold
        }
        
    except Exception as e:
        logger.error(f"Error getting fraud stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Stats failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
