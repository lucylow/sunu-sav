# services/ai-credit/main.py
from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="SunuSàv AI Credit Scoring Service", version="1.0.0")

# Simple authentication
def verify_token(x_internal_token: str = Header(None)):
    expected_token = os.getenv("AI_INTERNAL_TOKEN", "devtoken")
    if x_internal_token != expected_token:
        raise HTTPException(status_code=401, detail="Invalid token")
    return x_internal_token

# Pydantic models
class CreditFeatures(BaseModel):
    user_id: str
    tontine_contributions: float = 0.0
    punctuality_rate: float = 0.0
    contributions_count: int = 0
    mobile_tx_volume: float = 0.0
    avg_payment_delay_days: float = 0.0
    community_endorsements: int = 0

class CreditPrediction(BaseModel):
    score: float
    confidence: float
    explanation: Dict[str, Any]

class CreditExplanation(BaseModel):
    userId: str
    score: float

# Mock model for demo (in production, load trained model)
class MockCreditModel:
    def __init__(self):
        self.feature_weights = {
            'tontine_contributions': 0.2,
            'punctuality_rate': 0.3,
            'contributions_count': 0.15,
            'mobile_tx_volume': 0.1,
            'avg_payment_delay_days': -0.2,
            'community_endorsements': 0.15
        }
    
    def predict(self, features: CreditFeatures) -> float:
        score = 0.5  # Base score
        
        # Apply feature weights
        score += features.tontine_contributions * self.feature_weights['tontine_contributions'] / 1000000
        score += features.punctuality_rate * self.feature_weights['punctuality_rate']
        score += min(features.contributions_count, 100) * self.feature_weights['contributions_count'] / 100
        score += features.mobile_tx_volume * self.feature_weights['mobile_tx_volume'] / 1000000
        score += max(-features.avg_payment_delay_days, -30) * self.feature_weights['avg_payment_delay_days'] / 30
        score += min(features.community_endorsements, 20) * self.feature_weights['community_endorsements'] / 20
        
        # Ensure score is between 0 and 1
        return max(0.0, min(1.0, score))

# Initialize model
model = MockCreditModel()

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-credit"}

@app.post("/predict", response_model=CreditPrediction)
async def predict_credit_score(
    features: CreditFeatures,
    token: str = Depends(verify_token)
):
    try:
        logger.info(f"Predicting credit score for user {features.user_id}")
        
        # Predict credit score
        score = model.predict(features)
        
        # Calculate confidence based on data completeness
        confidence = min(0.95, 0.5 + (features.contributions_count / 20) * 0.3)
        
        # Generate explanation
        explanation = {
            "factors": [],
            "recommendations": []
        }
        
        if features.punctuality_rate > 0.8:
            explanation["factors"].append("High punctuality rate")
        if features.contributions_count > 10:
            explanation["factors"].append("Consistent contributions")
        if features.community_endorsements > 5:
            explanation["factors"].append("Strong community support")
        
        if features.avg_payment_delay_days > 7:
            explanation["recommendations"].append("Improve payment timeliness")
        if features.contributions_count < 5:
            explanation["recommendations"].append("Increase contribution frequency")
        
        return CreditPrediction(
            score=round(score, 3),
            confidence=round(confidence, 3),
            explanation=explanation
        )
        
    except Exception as e:
        logger.error(f"Error predicting credit score: {str(e)}")
        raise HTTPException(status_code=500, detail="Prediction failed")

@app.post("/explain")
async def explain_credit_score(
    explanation_request: CreditExplanation,
    token: str = Depends(verify_token)
):
    try:
        score = explanation_request.score
        
        if score >= 0.8:
            level = "excellent"
            message = "Excellent credit profile! You have consistent contributions and high punctuality."
            factors = ["Consistent contributions", "High punctuality", "Community endorsements"]
        elif score >= 0.6:
            level = "good"
            message = "Good credit profile. Keep up the consistent contributions!"
            factors = ["Regular contributions", "Good punctuality"]
        elif score >= 0.4:
            level = "fair"
            message = "Fair credit profile. Try to improve punctuality and consistency."
            factors = ["Some delays in payments", "Inconsistent contributions"]
        else:
            level = "poor"
            message = "Credit profile needs improvement. Focus on timely contributions."
            factors = ["Frequent delays", "Inconsistent participation"]
        
        return {
            "level": level,
            "message": message,
            "factors": factors,
            "score": score
        }
        
    except Exception as e:
        logger.error(f"Error explaining credit score: {str(e)}")
        raise HTTPException(status_code=500, detail="Explanation failed")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)