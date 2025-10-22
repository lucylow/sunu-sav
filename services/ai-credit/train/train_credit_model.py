# services/ai-credit/train/train_credit_model.py
import pandas as pd
import lightgbm as lgb
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report
import os

def generate_synthetic_data(n_samples=1000):
    """Generate synthetic training data for demonstration"""
    np.random.seed(42)
    
    data = []
    for _ in range(n_samples):
        # Generate realistic features
        tontine_contributions = np.random.exponential(50000)  # sats
        punctuality_rate = np.random.beta(2, 1)  # skewed towards higher punctuality
        contributions_count = np.random.poisson(15)  # number of contributions
        mobile_tx_volume = np.random.exponential(100000)  # XOF
        avg_payment_delay_days = np.random.exponential(2)  # days
        community_endorsements = np.random.poisson(3)  # endorsements
        
        # Create target: reliable user (1) or not (0)
        # Higher punctuality and endorsements = more reliable
        reliability_score = (
            punctuality_rate * 0.4 +
            min(community_endorsements / 10.0, 1.0) * 0.3 +
            min(contributions_count / 20.0, 1.0) * 0.2 +
            max(0, 1.0 - avg_payment_delay_days / 7.0) * 0.1
        )
        
        reliable = 1 if reliability_score > 0.6 else 0
        
        data.append({
            'tontine_contributions': tontine_contributions,
            'punctuality_rate': punctuality_rate,
            'contributions_count': contributions_count,
            'mobile_tx_volume': mobile_tx_volume,
            'avg_payment_delay_days': avg_payment_delay_days,
            'community_endorsements': community_endorsements,
            'reliable': reliable
        })
    
    return pd.DataFrame(data)

def train_model():
    """Train LightGBM model for credit scoring"""
    print("Generating synthetic training data...")
    df = generate_synthetic_data(2000)
    
    # Feature columns
    feature_cols = [
        'tontine_contributions',
        'punctuality_rate', 
        'contributions_count',
        'mobile_tx_volume',
        'avg_payment_delay_days',
        'community_endorsements'
    ]
    
    X = df[feature_cols]
    y = df['reliable']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train)} samples")
    print(f"Test set: {len(X_test)} samples")
    print(f"Positive class ratio: {y.mean():.2%}")
    
    # Train LightGBM model
    train_data = lgb.Dataset(X_train, label=y_train)
    
    params = {
        "objective": "binary",
        "metric": "auc",
        "num_leaves": 31,
        "learning_rate": 0.05,
        "feature_fraction": 0.9,
        "bagging_fraction": 0.8,
        "bagging_freq": 5,
        "verbose": 0,
        "random_state": 42
    }
    
    print("Training LightGBM model...")
    bst = lgb.train(
        params, 
        train_data, 
        num_boost_round=200,
        valid_sets=[train_data],
        callbacks=[lgb.early_stopping(50), lgb.log_evaluation(50)]
    )
    
    # Evaluate model
    y_pred_proba = bst.predict(X_test)
    y_pred = (y_pred_proba > 0.5).astype(int)
    
    auc_score = roc_auc_score(y_test, y_pred_proba)
    print(f"\nModel Performance:")
    print(f"AUC Score: {auc_score:.3f}")
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred))
    
    # Save model
    os.makedirs("../models", exist_ok=True)
    model_path = "../models/credit_score_model.pkl"
    joblib.dump(bst, model_path)
    print(f"\nModel saved to: {model_path}")
    
    # Save feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': bst.feature_importance()
    }).sort_values('importance', ascending=False)
    
    print(f"\nFeature Importance:")
    print(feature_importance)
    
    return bst, model_path

if __name__ == "__main__":
    train_model()
