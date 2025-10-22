# services/ai-fraud/train/train_fraud_model.py
import pandas as pd
import numpy as np
import joblib
from pyod.models.iforest import IForest
from sklearn.preprocessing import StandardScaler
import os

def generate_synthetic_data(n_samples=2000):
    """Generate synthetic transaction data for fraud detection training"""
    np.random.seed(42)
    
    data = []
    
    # Generate normal transactions (95% of data)
    n_normal = int(n_samples * 0.95)
    for _ in range(n_normal):
        data.append({
            'amount_sats': np.random.lognormal(10, 1),  # Most transactions are small
            'time_since_last_sec': np.random.exponential(300),  # 5 min average
            'invoices_last_min': np.random.poisson(1),  # Usually 0-2 invoices
            'device_changes': np.random.poisson(0.1),  # Rare device changes
            'location_changes': np.random.poisson(0.05),  # Very rare location changes
            'is_fraud': 0
        })
    
    # Generate fraudulent transactions (5% of data)
    n_fraud = n_samples - n_normal
    for _ in range(n_fraud):
        fraud_type = np.random.choice(['large_amount', 'rapid_fire', 'suspicious_timing', 'device_hopping'])
        
        if fraud_type == 'large_amount':
            data.append({
                'amount_sats': np.random.lognormal(15, 1),  # Very large amounts
                'time_since_last_sec': np.random.exponential(300),
                'invoices_last_min': np.random.poisson(1),
                'device_changes': np.random.poisson(0.1),
                'location_changes': np.random.poisson(0.05),
                'is_fraud': 1
            })
        elif fraud_type == 'rapid_fire':
            data.append({
                'amount_sats': np.random.lognormal(10, 1),
                'time_since_last_sec': np.random.exponential(10),  # Very quick
                'invoices_last_min': np.random.poisson(10),  # Many invoices
                'device_changes': np.random.poisson(0.1),
                'location_changes': np.random.poisson(0.05),
                'is_fraud': 1
            })
        elif fraud_type == 'suspicious_timing':
            data.append({
                'amount_sats': np.random.lognormal(12, 1),
                'time_since_last_sec': np.random.exponential(5),  # Very quick
                'invoices_last_min': np.random.poisson(2),
                'device_changes': np.random.poisson(0.1),
                'location_changes': np.random.poisson(0.05),
                'is_fraud': 1
            })
        else:  # device_hopping
            data.append({
                'amount_sats': np.random.lognormal(10, 1),
                'time_since_last_sec': np.random.exponential(300),
                'invoices_last_min': np.random.poisson(1),
                'device_changes': np.random.poisson(5),  # Many device changes
                'location_changes': np.random.poisson(3),  # Many location changes
                'is_fraud': 1
            })
    
    return pd.DataFrame(data)

def train_model():
    """Train Isolation Forest model for fraud detection"""
    print("Generating synthetic transaction data...")
    df = generate_synthetic_data(3000)
    
    # Feature columns
    feature_cols = [
        'amount_sats',
        'time_since_last_sec',
        'invoices_last_min',
        'device_changes',
        'location_changes'
    ]
    
    X = df[feature_cols]
    y = df['is_fraud']
    
    print(f"Training set: {len(X)} samples")
    print(f"Fraud ratio: {y.mean():.2%}")
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Isolation Forest
    print("Training Isolation Forest model...")
    model = IForest(
        contamination=0.05,  # Expect 5% fraud
        random_state=42,
        n_estimators=100
    )
    
    model.fit(X_scaled)
    
    # Evaluate model
    predictions = model.predict(X_scaled)
    scores = model.decision_function(X_scaled)
    
    # Convert to anomaly scores (higher = more anomalous)
    anomaly_scores = -scores
    
    print(f"\nModel Performance:")
    print(f"Detected anomalies: {predictions.sum()}")
    print(f"Expected anomalies: {y.sum()}")
    print(f"Detection rate: {predictions[y == 1].sum() / y.sum():.2%}")
    
    # Save model and scaler
    os.makedirs("../models", exist_ok=True)
    model_path = "../models/fraud_iforest.pkl"
    
    # Save both model and scaler
    model_data = {
        'model': model,
        'scaler': scaler,
        'feature_cols': feature_cols
    }
    
    joblib.dump(model_data, model_path)
    print(f"\nModel saved to: {model_path}")
    
    # Show some examples
    print(f"\nExample anomaly scores:")
    fraud_indices = df[df['is_fraud'] == 1].index[:5]
    for idx in fraud_indices:
        print(f"Fraud transaction {idx}: score = {anomaly_scores[idx]:.3f}")
    
    normal_indices = df[df['is_fraud'] == 0].index[:5]
    for idx in normal_indices:
        print(f"Normal transaction {idx}: score = {anomaly_scores[idx]:.3f}")
    
    return model, scaler, model_path

if __name__ == "__main__":
    train_model()
