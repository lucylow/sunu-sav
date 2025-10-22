from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
import pandas as pd
from typing import List, Optional, Dict, Tuple
import logging
from datetime import datetime
import os
import json
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SunuSàv AI Lightning Routing Service",
    description="AI-powered Lightning Network routing optimization for Senegalese users",
    version="1.0.0"
)

class ChannelInfo(BaseModel):
    channel_id: str
    node1_pubkey: str
    node2_pubkey: str
    capacity: int
    local_balance: int
    remote_balance: int
    last_update: datetime
    fee_rate: float
    base_fee: int
    is_active: bool

class PaymentRequest(BaseModel):
    payment_id: str
    source_node: str
    destination_node: str
    amount: int
    max_fee: Optional[int] = None
    timeout_seconds: int = 60
    payment_hash: str

class RouteOptimization(BaseModel):
    payment_id: str
    routes: List[List[str]]  # List of node paths
    fees: List[int]
    success_probability: float
    estimated_time: float
    confidence_score: float
    alternative_routes: List[List[str]]
    optimization_method: str

class ChannelLiquidity(BaseModel):
    channel_id: str
    liquidity_score: float
    utilization_rate: float
    predicted_capacity: int
    recommended_action: str
    confidence: float

class RoutingMetrics(BaseModel):
    total_channels: int
    active_channels: int
    average_fee_rate: float
    network_capacity: int
    routing_efficiency: float
    congestion_level: str
    timestamp: datetime

# Global models and data
routing_model = None
channel_scaler = None
channel_data = []
payment_history = []

def load_routing_model():
    """Load the trained routing optimization model"""
    global routing_model, channel_scaler
    
    try:
        models_dir = os.getenv('MODELS_DIR', 'models')
        os.makedirs(models_dir, exist_ok=True)
        
        model_path = os.path.join(models_dir, 'routing_model.pkl')
        scaler_path = os.path.join(models_dir, 'channel_scaler.pkl')
        
        if os.path.exists(model_path) and os.path.exists(scaler_path):
            routing_model = joblib.load(model_path)
            channel_scaler = joblib.load(scaler_path)
            logger.info("Routing model loaded successfully")
        else:
            # Create dummy model for demo
            logger.warning("Routing model not found, creating dummy model")
            
            # Generate dummy training data
            np.random.seed(42)
            n_samples = 1000
            X_train = np.random.randn(n_samples, 8)  # 8 features
            y_train = np.random.randn(n_samples)  # Success probability
            
            routing_model = RandomForestRegressor(n_estimators=100, random_state=42)
            routing_model.fit(X_train, y_train)
            
            channel_scaler = StandardScaler()
            channel_scaler.fit(X_train)
            
            # Save models
            joblib.dump(routing_model, model_path)
            joblib.dump(channel_scaler, scaler_path)
            
            logger.info("Dummy routing model created and saved")
            
    except Exception as e:
        logger.error(f"Error loading routing model: {e}")
        raise HTTPException(status_code=500, detail="Model loading failed")

def calculate_channel_features(channel: ChannelInfo) -> np.ndarray:
    """Calculate features for channel analysis"""
    utilization_rate = channel.local_balance / max(channel.capacity, 1)
    balance_ratio = channel.local_balance / max(channel.remote_balance, 1)
    fee_efficiency = channel.fee_rate / max(channel.base_fee, 1)
    
    # Time-based features
    time_since_update = (datetime.utcnow() - channel.last_update).total_seconds()
    time_score = max(0, 1 - (time_since_update / 86400))  # Decay over 24 hours
    
    return np.array([
        channel.capacity,
        utilization_rate,
        balance_ratio,
        fee_efficiency,
        channel.fee_rate,
        channel.base_fee,
        time_score,
        1 if channel.is_active else 0
    ])

def find_optimal_routes(source: str, destination: str, amount: int, channels: List[ChannelInfo]) -> List[RouteOptimization]:
    """Find optimal routes using AI-powered analysis"""
    if not routing_model or not channel_scaler:
        raise HTTPException(status_code=500, detail="Routing model not loaded")
    
    # Build channel graph
    channel_graph = {}
    channel_features = {}
    
    for channel in channels:
        if not channel.is_active:
            continue
            
        node1, node2 = channel.node1_pubkey, channel.node2_pubkey
        
        if node1 not in channel_graph:
            channel_graph[node1] = []
        if node2 not in channel_graph:
            channel_graph[node2] = []
            
        channel_graph[node1].append((node2, channel))
        channel_graph[node2].append((node1, channel))
        
        channel_features[channel.channel_id] = calculate_channel_features(channel)
    
    # Find all possible routes (simplified BFS)
    routes = []
    visited = set()
    
    def dfs(current: str, path: List[str], total_fee: int, hops: int):
        if current == destination:
            routes.append((path[:], total_fee, hops))
            return
            
        if hops >= 6 or current in visited:  # Max 6 hops
            return
            
        visited.add(current)
        
        for neighbor, channel in channel_graph.get(current, []):
            if neighbor not in path and channel.local_balance >= amount:
                # Calculate fee for this hop
                hop_fee = channel.base_fee + int(amount * channel.fee_rate / 1000000)
                new_total_fee = total_fee + hop_fee
                
                path.append(neighbor)
                dfs(neighbor, path, new_total_fee, hops + 1)
                path.pop()
        
        visited.remove(current)
    
    dfs(source, [source], 0, 0)
    
    # Score routes using AI model
    scored_routes = []
    for route, fee, hops in routes:
        # Calculate route features
        route_features = []
        for i in range(len(route) - 1):
            # Find channel between consecutive nodes
            for neighbor, channel in channel_graph.get(route[i], []):
                if neighbor == route[i + 1]:
                    features = channel_features[channel.channel_id]
                    route_features.extend(features)
                    break
        
        # Pad or truncate to fixed size
        while len(route_features) < 8:
            route_features.append(0)
        route_features = route_features[:8]
        
        # Predict success probability
        features_scaled = channel_scaler.transform([route_features])
        success_prob = max(0, min(1, routing_model.predict(features_scaled)[0]))
        
        # Calculate confidence based on route characteristics
        confidence = success_prob * (1 - hops / 10) * (1 - fee / (amount * 0.1))
        
        scored_routes.append({
            'route': route,
            'fee': fee,
            'hops': hops,
            'success_probability': success_prob,
            'confidence': confidence
        })
    
    # Sort by confidence score
    scored_routes.sort(key=lambda x: x['confidence'], reverse=True)
    
    # Return top routes
    result_routes = []
    for i, route_data in enumerate(scored_routes[:3]):  # Top 3 routes
        result_routes.append(RouteOptimization(
            payment_id=f"payment_{datetime.utcnow().timestamp()}",
            routes=[route_data['route']],
            fees=[route_data['fee']],
            success_probability=route_data['success_probability'],
            estimated_time=route_data['hops'] * 0.5,  # 0.5s per hop
            confidence_score=route_data['confidence'],
            alternative_routes=[r['route'] for r in scored_routes[i+1:i+3]],
            optimization_method="ai_enhanced"
        ))
    
    return result_routes

def analyze_channel_liquidity(channels: List[ChannelInfo]) -> List[ChannelLiquidity]:
    """Analyze channel liquidity using AI"""
    liquidity_analysis = []
    
    for channel in channels:
        if not channel.is_active:
            continue
            
        # Calculate liquidity metrics
        utilization_rate = channel.local_balance / max(channel.capacity, 1)
        balance_ratio = channel.local_balance / max(channel.remote_balance, 1)
        
        # AI-based liquidity scoring
        features = calculate_channel_features(channel)
        if routing_model and channel_scaler:
            features_scaled = channel_scaler.transform([features])
            liquidity_score = max(0, min(1, routing_model.predict(features_scaled)[0]))
        else:
            # Fallback calculation
            liquidity_score = 1 - utilization_rate
        
        # Predict capacity changes
        predicted_capacity = int(channel.capacity * (1 + np.random.normal(0, 0.1)))
        
        # Recommend actions
        if utilization_rate > 0.8:
            recommended_action = "rebalance_urgent"
        elif utilization_rate > 0.6:
            recommended_action = "rebalance_soon"
        elif utilization_rate < 0.2:
            recommended_action = "increase_capacity"
        else:
            recommended_action = "monitor"
        
        liquidity_analysis.append(ChannelLiquidity(
            channel_id=channel.channel_id,
            liquidity_score=liquidity_score,
            utilization_rate=utilization_rate,
            predicted_capacity=predicted_capacity,
            recommended_action=recommended_action,
            confidence=0.8  # Placeholder confidence
        ))
    
    return liquidity_analysis

@app.on_event("startup")
async def startup_event():
    """Initialize the model on startup"""
    load_routing_model()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-routing",
        "model_loaded": routing_model is not None,
        "timestamp": datetime.utcnow()
    }

@app.post("/optimize-routes", response_model=List[RouteOptimization])
async def optimize_routes(
    payment_request: PaymentRequest,
    channels: List[ChannelInfo]
):
    """Optimize Lightning payment routes using AI"""
    try:
        routes = find_optimal_routes(
            payment_request.source_node,
            payment_request.destination_node,
            payment_request.amount,
            channels
        )
        
        # Store payment history for learning
        payment_history.append({
            'payment_id': payment_request.payment_id,
            'amount': payment_request.amount,
            'timestamp': datetime.utcnow(),
            'routes_found': len(routes)
        })
        
        return routes
        
    except Exception as e:
        logger.error(f"Route optimization error: {e}")
        raise HTTPException(status_code=500, detail=f"Route optimization failed: {str(e)}")

@app.post("/analyze-liquidity", response_model=List[ChannelLiquidity])
async def analyze_liquidity(channels: List[ChannelInfo]):
    """Analyze channel liquidity using AI"""
    try:
        liquidity_analysis = analyze_channel_liquidity(channels)
        return liquidity_analysis
        
    except Exception as e:
        logger.error(f"Liquidity analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Liquidity analysis failed: {str(e)}")

@app.get("/routing-metrics", response_model=RoutingMetrics)
async def get_routing_metrics():
    """Get overall routing network metrics"""
    try:
        active_channels = len([c for c in channel_data if c.get('is_active', False)])
        total_channels = len(channel_data)
        
        if total_channels > 0:
            avg_fee_rate = sum(c.get('fee_rate', 0) for c in channel_data) / total_channels
            network_capacity = sum(c.get('capacity', 0) for c in channel_data)
            routing_efficiency = active_channels / total_channels
        else:
            avg_fee_rate = 0
            network_capacity = 0
            routing_efficiency = 0
        
        # Determine congestion level
        if routing_efficiency > 0.8:
            congestion_level = "low"
        elif routing_efficiency > 0.6:
            congestion_level = "medium"
        else:
            congestion_level = "high"
        
        return RoutingMetrics(
            total_channels=total_channels,
            active_channels=active_channels,
            average_fee_rate=avg_fee_rate,
            network_capacity=network_capacity,
            routing_efficiency=routing_efficiency,
            congestion_level=congestion_level,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Routing metrics error: {e}")
        raise HTTPException(status_code=500, detail=f"Routing metrics failed: {str(e)}")

@app.post("/update-channels")
async def update_channels(channels: List[ChannelInfo]):
    """Update channel information for routing optimization"""
    global channel_data
    try:
        channel_data = [channel.dict() for channel in channels]
        return {"message": f"Updated {len(channels)} channels", "timestamp": datetime.utcnow()}
        
    except Exception as e:
        logger.error(f"Channel update error: {e}")
        raise HTTPException(status_code=500, detail=f"Channel update failed: {str(e)}")

@app.get("/model/info")
async def get_model_info():
    """Get information about the loaded routing model"""
    if routing_model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    return {
        "model_type": type(routing_model).__name__,
        "feature_count": 8,
        "model_version": "1.0.0",
        "loaded_at": datetime.utcnow(),
        "payment_history_count": len(payment_history)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8004)
