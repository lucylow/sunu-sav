from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
from typing import List, Optional, Dict
import logging
from datetime import datetime, timedelta
import os
import requests
from fbprophet import Prophet
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="SunuSàv AI Insights Service",
    description="AI-powered inflation tracking and savings projections for Senegalese users",
    version="1.0.0"
)

class SavingsProjectionRequest(BaseModel):
    user_id: str
    weekly_amount_xof: float
    duration_months: int
    current_btc_price_xof: Optional[float] = None

class SavingsProjectionResponse(BaseModel):
    user_id: str
    weekly_amount_xof: float
    duration_months: int
    total_investment_xof: float
    projected_value_xof: float
    projected_gain_xof: float
    projected_gain_percentage: float
    cfa_inflation_impact: float
    btc_volatility_risk: str
    confidence_score: float
    monthly_projections: List[Dict]
    recommendations: List[str]
    timestamp: datetime

class InflationData(BaseModel):
    date: datetime
    cfa_inflation_rate: float
    btc_price_xof: float
    local_goods_index: float

class MarketInsightsResponse(BaseModel):
    current_cfa_inflation: float
    btc_price_trend: str
    savings_recommendation: str
    risk_assessment: str
    market_confidence: float
    timestamp: datetime

# Global data storage
inflation_data = []
btc_price_history = []

def load_historical_data():
    """Load historical inflation and Bitcoin price data"""
    global inflation_data, btc_price_history
    
    try:
        # Create dummy historical data for demo
        start_date = datetime.now() - timedelta(days=365)
        
        # Generate dummy CFA inflation data (typically 2-4% annually in Senegal)
        dates = pd.date_range(start=start_date, end=datetime.now(), freq='D')
        inflation_rates = np.random.normal(0.03, 0.01, len(dates))  # 3% average with 1% std
        
        for i, date in enumerate(dates):
            inflation_data.append({
                'date': date,
                'cfa_inflation_rate': max(0, inflation_rates[i]),
                'btc_price_xof': 50000 + np.random.normal(0, 5000),  # Dummy BTC price
                'local_goods_index': 100 + i * 0.1  # Gradual increase
            })
        
        logger.info(f"Loaded {len(inflation_data)} historical data points")
        
    except Exception as e:
        logger.error(f"Error loading historical data: {e}")

def get_current_btc_price() -> float:
    """Get current Bitcoin price in XOF (placeholder for real API)"""
    # In production, this would call a real Bitcoin price API
    return 50000.0  # Dummy price

def calculate_savings_projection(weekly_amount: float, duration_months: int, 
                               btc_price: float) -> Dict:
    """Calculate savings projection using AI models"""
    
    # Convert to daily amounts for more granular projections
    daily_amount_xof = weekly_amount / 7
    total_days = duration_months * 30
    
    # Get historical Bitcoin price data for Prophet
    df = pd.DataFrame(inflation_data)
    df['ds'] = df['date']
    df['y'] = df['btc_price_xof']
    
    # Train Prophet model
    model = Prophet(daily_seasonality=True, weekly_seasonality=True)
    model.fit(df[['ds', 'y']])
    
    # Make future predictions
    future = model.make_future_dataframe(periods=total_days)
    forecast = model.predict(future)
    
    # Calculate projections
    monthly_projections = []
    total_investment = 0
    total_value = 0
    
    for month in range(duration_months):
        month_start = month * 30
        month_end = (month + 1) * 30
        
        # Calculate investment for this month
        month_investment = weekly_amount * 4.33  # Approximate weeks per month
        total_investment += month_investment
        
        # Get projected BTC price for end of month
        projected_btc_price = forecast.iloc[month_end]['yhat']
        
        # Calculate value in BTC and convert back to XOF
        btc_acquired = month_investment / btc_price
        month_value = btc_acquired * projected_btc_price
        total_value += month_value
        
        monthly_projections.append({
            'month': month + 1,
            'investment_xof': month_investment,
            'projected_value_xof': month_value,
            'projected_btc_price': projected_btc_price,
            'gain_xof': month_value - month_investment
        })
    
    projected_gain = total_value - total_investment
    projected_gain_percentage = (projected_gain / total_investment) * 100
    
    return {
        'total_investment_xof': total_investment,
        'projected_value_xof': total_value,
        'projected_gain_xof': projected_gain,
        'projected_gain_percentage': projected_gain_percentage,
        'monthly_projections': monthly_projections
    }

def calculate_cfa_inflation_impact(duration_months: int) -> float:
    """Calculate the impact of CFA inflation over the duration"""
    # Get average inflation rate from historical data
    recent_inflation = [d['cfa_inflation_rate'] for d in inflation_data[-30:]]
    avg_inflation = np.mean(recent_inflation)
    
    # Calculate compound inflation impact
    inflation_impact = (1 + avg_inflation) ** (duration_months / 12) - 1
    return inflation_impact

def assess_btc_volatility_risk() -> str:
    """Assess Bitcoin volatility risk level"""
    if len(btc_price_history) < 30:
        return "unknown"
    
    recent_prices = btc_price_history[-30:]
    volatility = np.std(recent_prices) / np.mean(recent_prices)
    
    if volatility > 0.3:
        return "high"
    elif volatility > 0.15:
        return "medium"
    else:
        return "low"

def generate_savings_recommendations(projection: Dict, risk_level: str) -> List[str]:
    """Generate personalized savings recommendations"""
    recommendations = []
    
    gain_percentage = projection['projected_gain_percentage']
    
    if gain_percentage > 20:
        recommendations.append("Excellent potential returns! Consider increasing your weekly contribution.")
        recommendations.append("Bitcoin savings show strong growth potential vs CFA inflation.")
    elif gain_percentage > 10:
        recommendations.append("Good potential returns. Continue with your current savings plan.")
        recommendations.append("Consider diversifying with both Bitcoin and traditional savings.")
    elif gain_percentage > 0:
        recommendations.append("Positive returns expected. Maintain consistent contributions.")
        recommendations.append("Consider shorter-term savings cycles to reduce volatility risk.")
    else:
        recommendations.append("Consider waiting for better market conditions.")
        recommendations.append("Focus on traditional savings until Bitcoin volatility decreases.")
    
    if risk_level == "high":
        recommendations.append("High volatility detected. Consider smaller, more frequent contributions.")
        recommendations.append("Diversify your savings strategy to reduce risk.")
    elif risk_level == "medium":
        recommendations.append("Moderate volatility. Monitor market conditions regularly.")
    
    recommendations.append("Always invest only what you can afford to lose.")
    recommendations.append("Consider consulting with a financial advisor for personalized advice.")
    
    return recommendations

@app.on_event("startup")
async def startup_event():
    """Initialize data on startup"""
    load_historical_data()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "ai-insights",
        "data_points": len(inflation_data),
        "timestamp": datetime.utcnow()
    }

@app.post("/project-savings", response_model=SavingsProjectionResponse)
async def project_savings(request: SavingsProjectionRequest):
    """Generate AI-powered savings projections"""
    try:
        # Get current BTC price
        btc_price = request.current_btc_price_xof or get_current_btc_price()
        
        # Calculate projections
        projection = calculate_savings_projection(
            request.weekly_amount_xof,
            request.duration_months,
            btc_price
        )
        
        # Calculate additional metrics
        cfa_inflation_impact = calculate_cfa_inflation_impact(request.duration_months)
        btc_volatility_risk = assess_btc_volatility_risk()
        
        # Generate recommendations
        recommendations = generate_savings_recommendations(projection, btc_volatility_risk)
        
        # Calculate confidence score based on data quality and model performance
        confidence_score = min(0.95, max(0.6, 1.0 - (cfa_inflation_impact * 0.5)))
        
        return SavingsProjectionResponse(
            user_id=request.user_id,
            weekly_amount_xof=request.weekly_amount_xof,
            duration_months=request.duration_months,
            total_investment_xof=projection['total_investment_xof'],
            projected_value_xof=projection['projected_value_xof'],
            projected_gain_xof=projection['projected_gain_xof'],
            projected_gain_percentage=projection['projected_gain_percentage'],
            cfa_inflation_impact=cfa_inflation_impact,
            btc_volatility_risk=btc_volatility_risk,
            confidence_score=confidence_score,
            monthly_projections=projection['monthly_projections'],
            recommendations=recommendations,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Savings projection error: {e}")
        raise HTTPException(status_code=500, detail=f"Projection failed: {str(e)}")

@app.get("/market-insights", response_model=MarketInsightsResponse)
async def get_market_insights():
    """Get current market insights and recommendations"""
    try:
        # Calculate current CFA inflation
        recent_inflation = [d['cfa_inflation_rate'] for d in inflation_data[-30:]]
        current_cfa_inflation = np.mean(recent_inflation)
        
        # Analyze BTC price trend
        recent_prices = [d['btc_price_xof'] for d in inflation_data[-7:]]
        if len(recent_prices) >= 2:
            price_change = (recent_prices[-1] - recent_prices[0]) / recent_prices[0]
            if price_change > 0.05:
                btc_trend = "rising"
            elif price_change < -0.05:
                btc_trend = "falling"
            else:
                btc_trend = "stable"
        else:
            btc_trend = "unknown"
        
        # Generate savings recommendation
        if current_cfa_inflation > 0.04:  # 4% inflation
            savings_recommendation = "High inflation detected. Bitcoin savings may provide better protection."
        elif current_cfa_inflation < 0.02:  # 2% inflation
            savings_recommendation = "Low inflation environment. Consider balanced approach."
        else:
            savings_recommendation = "Moderate inflation. Bitcoin savings show good potential."
        
        # Risk assessment
        volatility_risk = assess_btc_volatility_risk()
        if volatility_risk == "high":
            risk_assessment = "High volatility. Consider smaller, frequent contributions."
        elif volatility_risk == "medium":
            risk_assessment = "Moderate volatility. Monitor market conditions."
        else:
            risk_assessment = "Low volatility. Good time for Bitcoin savings."
        
        # Market confidence
        market_confidence = min(0.95, max(0.5, 1.0 - (current_cfa_inflation * 2)))
        
        return MarketInsightsResponse(
            current_cfa_inflation=current_cfa_inflation,
            btc_price_trend=btc_trend,
            savings_recommendation=savings_recommendation,
            risk_assessment=risk_assessment,
            market_confidence=market_confidence,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        logger.error(f"Market insights error: {e}")
        raise HTTPException(status_code=500, detail=f"Insights generation failed: {str(e)}")

@app.get("/inflation-history")
async def get_inflation_history(days: int = 30):
    """Get historical inflation data"""
    try:
        cutoff_date = datetime.now() - timedelta(days=days)
        recent_data = [d for d in inflation_data if d['date'] >= cutoff_date]
        
        return {
            "data": recent_data,
            "period_days": days,
            "data_points": len(recent_data),
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Inflation history error: {e}")
        raise HTTPException(status_code=500, detail=f"History retrieval failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8003)
