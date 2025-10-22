from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from typing import List, Optional
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SunuSàv AI Credit Scoring Service",
    description="AI-powered credit scoring for unbanked users in Senegal",
    version="1.0.0"
)

# Global model variable
credit_model = None
model_features = [
    'tontine_contributions',
    'punctuality_rate', 
    'community_reputation',
    'mobile_transactions',
    'payment_frequency',
    'group_participation',
    'social_connections',
    'location_stability'
]

class UserData(BaseModel):
    user_id: str
    tontine_contributions: float
    punctuality_rate: float
    community_reputation: float
    mobile_transactions: float
    payment_frequency: float = 0.0
    group_participation: float = 0.0
    social_connections: float = 0.0
    location_stability: float = 0.0

class CreditScoreResponse(BaseModel):
    user_id: str
    credit_score: float
    reliability_probability: float
    risk_level: str
    recommendations: List[str]
    model_version: str
    timestamp: datetime

class BatchScoreRequest(BaseModel):
    users: List[UserData]

class BatchScoreResponse(BaseModel):
    scores: List[CreditScoreResponse]
    processed_count: int
    errors: List[str]

def load_model():
    """Load the trained credit scoring model"""
    global credit_model
    try:
        model_path = os.getenv('MODEL_PATH', 'models/credit_score_model.pkl')
        if os.path.exists(model_path):
            credit_model = joblib.load(model_path)
            logger.info(f"Model loaded successfully from {model_path}")
        else:
            # Create a dummy model for demo purposes
            logger.warning(f"Model file not found at {model_path}, creating dummy model")
            from sklearn.ensemble import RandomForestClassifier
            from sklearn.datasets import make_classification
            
            # Generate dummy training data
            X, y = make_classification(n_samples=1000, n_features=len(model_features), 
                                    n_classes=2, random_state=42)
            
            credit_model = RandomForestClassifier(n_estimators=100, random_state=42)
            credit_model.fit(X, y)
            
            # Save the dummy model
            os.makedirs('models', exist_ok=True)
            joblib.dump(credit_model, model_path)
            logger.info("Dummy model created and saved")
            
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        raise HTTPException(status_code=500, detail="Model loading failed")

def calculate_risk_level(score: float) -> str:
    """Calculate risk level based on credit score"""
    if score >= 0.8:
        return "low"
    elif score >= 0.6:
        return "medium"
    elif score >= 0.4:
        return "high"
    else:
        return "very_high"

def generate_recommendations(score: float, risk_level: str, user_data: UserData) -> List[str]:
    """Generate personalized recommendations based on credit score"""
    recommendations = []
    
    if score >= 0.9:
        recommendations.extend([
            "Excellent credit profile! You qualify for premium tontine groups.",
            "Consider applying for microloans up to 100,000 XOF.",
            "You're eligible for instant Lightning payments."
        ])
    elif score >= 0.7:
        recommendations.extend([
            "Good credit standing. Continue making timely contributions.",
            "You qualify for standard tontine groups and small microloans.",
            "Consider joining more groups to build your reputation."
        ])
    elif score >= 0.5:
        recommendations.extend([
            "Improve punctuality to boost your credit score.",
            "Join community activities to build social connections.",
            "Consider smaller contribution amounts initially."
        ])
    else:
        recommendations.extend([
            "Focus on making consistent, timely contributions.",
            "Build trust by participating in community activities.",
            "Start with smaller tontine groups to establish reliability."
        ])
    
    # Add specific recommendations based on user data
    if user_data.punctuality_rate < 0.7:
        recommendations.append("Improve payment punctuality to increase trust score.")
    
    if user_data.community_reputation < 0.5:
        recommendations.append("Participate more in community activities to build reputation.")
    
    return recommendations

@app.on_event("startup")
async def startup_event():
    """Initialize the model on startup"""
    load_model()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-credit-scoring",
        "model_loaded": credit_model is not None,
        "timestamp": datetime.utcnow()
    }

@app.post("/predict", response_model=CreditScoreResponse)
async def predict_credit_score(user_data: UserData):
    """Predict credit score for a single user"""
    if credit_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        # Prepare features in the correct order
        features = np.array([[
            user_data.tontine_contributions,
            user_data.punctuality_rate,
            user_data.community_reputation,
            user_data.mobile_transactions,
            user_data.payment_frequency,
            user_data.group_participation,
            user_data.social_connections,
            user_data.location_stability
        ]])
        
        # Get probability of being reliable (class 1)
        reliability_prob = credit_model.predict_proba(features)[0, 1]
        credit_score = round(reliability_prob, 3)
        
        risk_level = calculate_risk_level(credit_score)
        recommendations = generate_recommendations(credit_score, risk_level, user_data)
        
        return CreditScoreResponse(
            user_id=user_data.user_id,
            credit_score=credit_score,
            reliability_probability=reliability_prob,
            risk_level=risk_level,
            recommendations=recommendations,
            model_version="1.0.0",
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@app.post("/predict/batch", response_model=BatchScoreResponse)
async def predict_batch_scores(request: BatchScoreRequest):
    """Predict credit scores for multiple users"""
    if credit_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    scores = []
    errors = []
    
    for user_data in request.users:
        try:
            # Prepare features
            features = np.array([[
                user_data.tontine_contributions,
                user_data.punctuality_rate,
                user_data.community_reputation,
                user_data.mobile_transactions,
                user_data.payment_frequency,
                user_data.group_participation,
                user_data.social_connections,
                user_data.location_stability
            ]])
            
            reliability_prob = credit_model.predict_proba(features)[0, 1]
            credit_score = round(reliability_prob, 3)
            
            risk_level = calculate_risk_level(credit_score)
            recommendations = generate_recommendations(credit_score, risk_level, user_data)
            
            scores.append(CreditScoreResponse(
                user_id=user_data.user_id,
                credit_score=credit_score,
                reliability_probability=reliability_prob,
                risk_level=risk_level,
                recommendations=recommendations,
                model_version="1.0.0",
                timestamp=datetime.utcnow()
            ))
            
        except Exception as e:
            errors.append(f"Error processing user {user_data.user_id}: {str(e)}")
            logger.error(f"Batch prediction error for user {user_data.user_id}: {e}")
    
    return BatchScoreResponse(
        scores=scores,
        processed_count=len(scores),
        errors=errors
    )

@app.get("/model/info")
async def get_model_info():
    """Get information about the loaded model"""
    if credit_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    return {
        "model_type": type(credit_model).__name__,
        "features": model_features,
        "feature_count": len(model_features),
        "model_version": "1.0.0",
        "loaded_at": datetime.utcnow()
    }

@app.post("/model/retrain")
async def retrain_model():
    """Retrain the model with new data (placeholder for future implementation)"""
    # This would typically involve:
    # 1. Fetching new training data from the database
    # 2. Retraining the model
    # 3. Validating the new model
    # 4. Replacing the old model
    
    return {
        "message": "Model retraining endpoint - implementation pending",
        "status": "not_implemented"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
