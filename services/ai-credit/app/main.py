# services/ai-credit/app/main.py
from fastapi import FastAPI, Header, HTTPException, Request, Depends
from pydantic import BaseModel
import os
import joblib
import numpy as np
import logging
from typing import Optional

# Security: require an internal auth token (set AI_INTERNAL_TOKEN in env)
INTERNAL_TOKEN = os.getenv("AI_INTERNAL_TOKEN", "devtoken")

MODEL_PATH = os.getenv("CREDIT_MODEL_PATH", "models/credit_score_model.pkl")
model = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UserFeatures(BaseModel):
    user_id: str
    tontine_contributions: float  # total sats contributed in window
    punctuality_rate: float       # 0..1
    contributions_count: int
    mobile_tx_volume: float       # local mobile money volume
    avg_payment_delay_days: float
    community_endorsements: int

class CreditScoreResponse(BaseModel):
    credit_score: float
    confidence: float
    model_version: str

app = FastAPI(
    title="SunuSàv AI Credit Service",
    description="AI-powered credit scoring for unbanked tontine members",
    version="1.0.0"
)

@app.on_event("startup")
def load_model():
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = joblib.load(MODEL_PATH)
            logger.info(f"Loaded credit scoring model from {MODEL_PATH}")
        else:
            model = None
            logger.warning(f"Model not found at {MODEL_PATH}. Using fallback scoring.")
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        model = None

def check_auth(x_internal_token: str = Header(None)):
    """Validate internal service authentication"""
    if x_internal_token != INTERNAL_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")

def fallback_credit_score(features: UserFeatures) -> float:
    """Fallback scoring when ML model is not available"""
    # Simple heuristic-based scoring
    score = 0.0
    
    # Punctuality is most important (40% weight)
    score += features.punctuality_rate * 0.4
    
    # Community endorsements (30% weight)
    endorsement_score = min(features.community_endorsements / 10.0, 1.0)
    score += endorsement_score * 0.3
    
    # Contribution consistency (20% weight)
    if features.contributions_count > 0:
        consistency_score = min(features.contributions_count / 20.0, 1.0)
        score += consistency_score * 0.2
    
    # Payment delay penalty (10% weight)
    delay_penalty = max(0, 1.0 - (features.avg_payment_delay_days / 7.0))
    score += delay_penalty * 0.1
    
    return min(max(score, 0.0), 1.0)

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_path": MODEL_PATH
    }

@app.post("/predict", dependencies=[Depends(check_auth)])
def predict(features: UserFeatures, request: Request):
    """Predict credit score for a user based on tontine behavior"""
    try:
        if model is None:
            # Use fallback scoring
            score = fallback_credit_score(features)
            confidence = 0.6  # Lower confidence for fallback
            model_version = "fallback-v1"
            logger.warning(f"Using fallback scoring for user {features.user_id}")
        else:
            # Use ML model
            # Feature vector ordering must match training
            x = np.array([[
                features.tontine_contributions,
                features.punctuality_rate,
                features.contributions_count,
                features.mobile_tx_volume,
                features.avg_payment_delay_days,
                features.community_endorsements
            ]], dtype=float)
            
            # model.predict_proba -> [prob_of_negative, prob_of_positive]
            prob = float(model.predict_proba(x)[0, 1])
            score = prob
            confidence = 0.9  # High confidence for ML model
            model_version = "lightgbm-v1"
        
        logger.info(f"Credit score for user {features.user_id}: {score:.3f}")
        
        return CreditScoreResponse(
            credit_score=round(score, 3),
            confidence=confidence,
            model_version=model_version
        )
        
    except Exception as e:
        logger.error(f"Error predicting credit score for user {features.user_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/batch-predict", dependencies=[Depends(check_auth)])
def batch_predict(features_list: list[UserFeatures], request: Request):
    """Predict credit scores for multiple users"""
    results = []
    
    for features in features_list:
        try:
            result = predict(features, request)
            results.append({
                "user_id": features.user_id,
                "credit_score": result.credit_score,
                "confidence": result.confidence,
                "model_version": result.model_version
            })
        except Exception as e:
            logger.error(f"Failed to predict for user {features.user_id}: {e}")
            results.append({
                "user_id": features.user_id,
                "error": str(e)
            })
    
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
