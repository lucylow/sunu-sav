from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd
from typing import List, Optional, Dict
import logging
from datetime import datetime, timedelta
import os
from pyod.models.iforest import IForest
from pyod.models.ocsvm import OCSVM
from sklearn.preprocessing import StandardScaler

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SunuSàv AI Fraud Detection Service",
    description="AI-powered fraud detection for Lightning payments and tontine transactions",
    version="1.0.0"
)

# Global models and scaler
fraud_models = {}
scaler = None
model_features = [
    'amount',
    'interval_time',
    'num_invoices',
    'payment_frequency',
    'amount_variance',
    'time_pattern_score',
    'location_consistency',
    'device_fingerprint_match'
]

class TransactionData(BaseModel):
    transaction_id: str
    user_id: str
    amount: float
    interval_time: float  # Time since last transaction in seconds
    num_invoices: int
    payment_frequency: float
    amount_variance: float = 0.0
    time_pattern_score: float = 0.0
    location_consistency: float = 1.0
    device_fingerprint_match: float = 1.0
    timestamp: datetime

class FraudDetectionResponse(BaseModel):
    transaction_id: str
    user_id: str
    fraud_probability: float
    risk_score: float
    is_fraudulent: bool
    fraud_type: Optional[str]
    confidence: float
    recommendations: List[str]
    model_version: str
    timestamp: datetime

class BatchDetectionRequest(BaseModel):
    transactions: List[TransactionData]

class BatchDetectionResponse(BaseModel):
    detections: List[FraudDetectionResponse]
    processed_count: int
    errors: List[str]

def load_models():
    """Load the trained fraud detection models"""
    global fraud_models, scaler
    
    try:
        models_dir = os.getenv('MODELS_DIR', 'models')
        os.makedirs(models_dir, exist_ok=True)
        
        # Initialize scaler
        scaler = StandardScaler()
        
        # Try to load existing models
        iforest_path = os.path.join(models_dir, 'fraud_iforest.pkl')
        ocsvm_path = os.path.join(models_dir, 'fraud_ocsvm.pkl')
        
        if os.path.exists(iforest_path) and os.path.exists(ocsvm_path):
            fraud_models['iforest'] = joblib.load(iforest_path)
            fraud_models['ocsvm'] = joblib.load(ocsvm_path)
            logger.info("Existing fraud detection models loaded")
        else:
            # Create dummy models for demo
            logger.warning("Fraud detection models not found, creating dummy models")
            
            # Generate dummy training data
            np.random.seed(42)
            n_samples = 1000
            X_train = np.random.randn(n_samples, len(model_features))
            
            # Add some outliers for fraud cases
            fraud_indices = np.random.choice(n_samples, size=50, replace=False)
            X_train[fraud_indices] += np.random.randn(50, len(model_features)) * 3
            
            # Fit scaler
            scaler.fit(X_train)
            X_scaled = scaler.transform(X_train)
            
            # Train Isolation Forest
            fraud_models['iforest'] = IForest(contamination=0.1, random_state=42)
            fraud_models['iforest'].fit(X_scaled)
            
            # Train One-Class SVM
            fraud_models['ocsvm'] = OCSVM(nu=0.1, kernel='rbf')
            fraud_models['ocsvm'].fit(X_scaled)
            
            # Save models
            joblib.dump(fraud_models['iforest'], iforest_path)
            joblib.dump(fraud_models['ocsvm'], ocsvm_path)
            
            logger.info("Dummy fraud detection models created and saved")
            
    except Exception as e:
        logger.error(f"Error loading fraud detection models: {e}")
        raise HTTPException(status_code=500, detail="Model loading failed")

def detect_fraud_type(features: np.ndarray) -> str:
    """Detect the type of fraud based on feature patterns"""
    amount, interval_time, num_invoices, payment_frequency = features[0][:4]
    
    if interval_time < 10 and num_invoices > 5:
        return "rapid_fire_payments"
    elif amount_variance > 0.8 and payment_frequency > 0.9:
        return "amount_manipulation"
    elif interval_time < 5:
        return "suspicious_timing"
    elif num_invoices > 10:
        return "invoice_spam"
    else:
        return "general_anomaly"

def generate_fraud_recommendations(fraud_type: str, risk_score: float) -> List[str]:
    """Generate recommendations based on fraud type and risk score"""
    recommendations = []
    
    if risk_score > 0.8:
        recommendations.append("HIGH RISK: Transaction blocked pending manual review")
        recommendations.append("Contact user for additional verification")
        recommendations.append("Consider temporary account suspension")
    elif risk_score > 0.6:
        recommendations.append("MEDIUM RISK: Additional verification required")
        recommendations.append("Monitor user activity closely")
        recommendations.append("Request additional identity verification")
    elif risk_score > 0.4:
        recommendations.append("LOW RISK: Transaction approved with monitoring")
        recommendations.append("Continue normal monitoring")
    else:
        recommendations.append("Transaction appears legitimate")
    
    # Add specific recommendations based on fraud type
    if fraud_type == "rapid_fire_payments":
        recommendations.append("Check for automated bot activity")
        recommendations.append("Verify user is not under duress")
    elif fraud_type == "amount_manipulation":
        recommendations.append("Verify payment amounts match group requirements")
        recommendations.append("Check for rounding errors or manipulation")
    elif fraud_type == "suspicious_timing":
        recommendations.append("Verify transaction timing is reasonable")
        recommendations.append("Check for timezone inconsistencies")
    
    return recommendations

@app.on_event("startup")
async def startup_event():
    """Initialize the models on startup"""
    load_models()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-fraud-detection",
        "models_loaded": len(fraud_models) > 0,
        "timestamp": datetime.utcnow()
    }

@app.post("/detect", response_model=FraudDetectionResponse)
async def detect_fraud(transaction: TransactionData):
    """Detect fraud for a single transaction"""
    if not fraud_models or scaler is None:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    try:
        # Prepare features
        features = np.array([[
            transaction.amount,
            transaction.interval_time,
            transaction.num_invoices,
            transaction.payment_frequency,
            transaction.amount_variance,
            transaction.time_pattern_score,
            transaction.location_consistency,
            transaction.device_fingerprint_match
        ]])
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Get predictions from both models
        iforest_score = fraud_models['iforest'].decision_function(features_scaled)[0]
        ocsvm_score = fraud_models['ocsvm'].decision_function(features_scaled)[0]
        
        # Combine scores (lower scores indicate higher fraud probability)
        combined_score = (iforest_score + ocsvm_score) / 2
        
        # Convert to probability (0-1 scale, higher = more fraud)
        fraud_probability = max(0, min(1, (1 - combined_score)))
        risk_score = round(fraud_probability, 3)
        
        # Determine if fraudulent
        is_fraudulent = fraud_probability > 0.5
        
        # Detect fraud type
        fraud_type = detect_fraud_type(features) if is_fraudulent else None
        
        # Generate recommendations
        recommendations = generate_fraud_recommendations(fraud_type, risk_score)
        
        # Calculate confidence
        confidence = abs(combined_score) / 2  # Normalize confidence
        
        return FraudDetectionResponse(
            transaction_id=transaction.transaction_id,
            user_id=transaction.user_id,
            fraud_probability=fraud_probability,
            risk_score=risk_score,
            is_fraudulent=is_fraudulent,
            fraud_type=fraud_type,
            confidence=round(confidence, 3),
            recommendations=recommendations,
            model_version="1.0.0",
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Fraud detection error: {e}")
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@app.post("/detect/batch", response_model=BatchDetectionResponse)
async def detect_batch_fraud(request: BatchDetectionRequest):
    """Detect fraud for multiple transactions"""
    if not fraud_models or scaler is None:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    detections = []
    errors = []
    
    for transaction in request.transactions:
        try:
            # Prepare features
            features = np.array([[
                transaction.amount,
                transaction.interval_time,
                transaction.num_invoices,
                transaction.payment_frequency,
                transaction.amount_variance,
                transaction.time_pattern_score,
                transaction.location_consistency,
                transaction.device_fingerprint_match
            ]])
            
            # Scale features
            features_scaled = scaler.transform(features)
            
            # Get predictions
            iforest_score = fraud_models['iforest'].decision_function(features_scaled)[0]
            ocsvm_score = fraud_models['ocsvm'].decision_function(features_scaled)[0]
            
            combined_score = (iforest_score + ocsvm_score) / 2
            fraud_probability = max(0, min(1, (1 - combined_score)))
            risk_score = round(fraud_probability, 3)
            
            is_fraudulent = fraud_probability > 0.5
            fraud_type = detect_fraud_type(features) if is_fraudulent else None
            recommendations = generate_fraud_recommendations(fraud_type, risk_score)
            confidence = abs(combined_score) / 2
            
            detections.append(FraudDetectionResponse(
                transaction_id=transaction.transaction_id,
                user_id=transaction.user_id,
                fraud_probability=fraud_probability,
                risk_score=risk_score,
                is_fraudulent=is_fraudulent,
                fraud_type=fraud_type,
                confidence=round(confidence, 3),
                recommendations=recommendations,
                model_version="1.0.0",
                timestamp=datetime.utcnow()
            ))
            
        except Exception as e:
            errors.append(f"Error processing transaction {transaction.transaction_id}: {str(e)}")
            logger.error(f"Batch fraud detection error for transaction {transaction.transaction_id}: {e}")
    
    return BatchDetectionResponse(
        detections=detections,
        processed_count=len(detections),
        errors=errors
    )

@app.get("/model/info")
async def get_model_info():
    """Get information about the loaded models"""
    if not fraud_models:
        raise HTTPException(status_code=500, detail="Models not loaded")
    
    return {
        "models": list(fraud_models.keys()),
        "features": model_features,
        "feature_count": len(model_features),
        "model_version": "1.0.0",
        "loaded_at": datetime.utcnow()
    }

@app.post("/model/retrain")
async def retrain_models():
    """Retrain the fraud detection models (placeholder for future implementation)"""
    return {
        "message": "Model retraining endpoint - implementation pending",
        "status": "not_implemented"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
