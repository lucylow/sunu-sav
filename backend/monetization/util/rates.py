# backend/monetization/util/rates.py
from decimal import Decimal
import requests
import logging
from typing import Optional
from datetime import datetime, timedelta
import os

logger = logging.getLogger(__name__)

# Constants
SAT_PER_BTC = 100_000_000
CACHE_DURATION_MINUTES = 15  # Cache exchange rates for 15 minutes

# Global cache for exchange rates
_rate_cache = {
    "rate": None,
    "timestamp": None,
    "source": None
}

def fetch_btc_xof_rate_from_coingecko() -> Optional[Decimal]:
    """Fetch BTC/XOF rate from CoinGecko API"""
    try:
        url = "https://api.coingecko.com/api/v3/simple/price"
        params = {
            "ids": "bitcoin",
            "vs_currencies": "xof",
            "include_24hr_change": "false"
        }
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        rate = Decimal(str(data["bitcoin"]["xof"]))
        
        logger.info(f"Fetched BTC/XOF rate from CoinGecko: {rate}")
        return rate
        
    except Exception as e:
        logger.error(f"Failed to fetch rate from CoinGecko: {e}")
        return None

def fetch_btc_xof_rate_from_binance() -> Optional[Decimal]:
    """Fetch BTC/XOF rate from Binance API (if available)"""
    try:
        # Note: Binance doesn't have XOF directly, would need to convert via USD
        # This is a placeholder for future implementation
        url = "https://api.binance.com/api/v3/ticker/price"
        params = {"symbol": "BTCUSDT"}
        
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        btc_usd = Decimal(str(data["price"]))
        
        # Convert USD to XOF (this would need a separate USD/XOF rate)
        # For now, return None to fall back to other sources
        logger.warning("Binance USD/XOF conversion not implemented")
        return None
        
    except Exception as e:
        logger.error(f"Failed to fetch rate from Binance: {e}")
        return None

def get_cached_rate() -> Optional[Decimal]:
    """Get cached exchange rate if still valid"""
    if _rate_cache["rate"] is None or _rate_cache["timestamp"] is None:
        return None
    
    cache_age = datetime.utcnow() - _rate_cache["timestamp"]
    if cache_age > timedelta(minutes=CACHE_DURATION_MINUTES):
        return None
    
    return _rate_cache["rate"]

def set_cached_rate(rate: Decimal, source: str):
    """Set cached exchange rate"""
    _rate_cache["rate"] = rate
    _rate_cache["timestamp"] = datetime.utcnow()
    _rate_cache["source"] = source

def fetch_btc_xof_rate() -> Decimal:
    """
    Fetch BTC/XOF exchange rate with caching and fallback sources.
    
    Returns:
        BTC price in XOF (XOF per 1 BTC)
    """
    # Check cache first
    cached_rate = get_cached_rate()
    if cached_rate is not None:
        logger.info(f"Using cached BTC/XOF rate: {cached_rate}")
        return cached_rate
    
    # Try different sources
    sources = [
        ("coingecko", fetch_btc_xof_rate_from_coingecko),
        ("binance", fetch_btc_xof_rate_from_binance),
    ]
    
    for source_name, fetch_func in sources:
        try:
            rate = fetch_func()
            if rate is not None and rate > 0:
                set_cached_rate(rate, source_name)
                return rate
        except Exception as e:
            logger.warning(f"Failed to fetch rate from {source_name}: {e}")
    
    # Fallback to environment variable or default
    fallback_rate = os.getenv("FALLBACK_BTC_XOF_RATE")
    if fallback_rate:
        rate = Decimal(fallback_rate)
        logger.warning(f"Using fallback BTC/XOF rate from env: {rate}")
        set_cached_rate(rate, "fallback")
        return rate
    
    # Last resort: use a reasonable default (this should be updated regularly)
    default_rate = Decimal("8000000")  # 1 BTC = 8,000,000 XOF
    logger.warning(f"Using default BTC/XOF rate: {default_rate}")
    set_cached_rate(default_rate, "default")
    return default_rate

def sats_to_xof(sats: int) -> Decimal:
    """
    Convert sats to XOF using current exchange rate.
    
    Args:
        sats: Amount in sats
        
    Returns:
        Amount in XOF (rounded to 2 decimal places)
    """
    if sats < 0:
        raise ValueError("Sats amount cannot be negative")
    
    btc = Decimal(sats) / Decimal(SAT_PER_BTC)
    rate = fetch_btc_xof_rate()
    xof_amount = (btc * rate).quantize(Decimal('0.01'))
    
    logger.debug(f"Converted {sats} sats to {xof_amount} XOF (rate: {rate})")
    return xof_amount

def xof_to_sats(xof: Decimal) -> int:
    """
    Convert XOF to sats using current exchange rate.
    
    Args:
        xof: Amount in XOF
        
    Returns:
        Amount in sats (rounded down)
    """
    if xof < 0:
        raise ValueError("XOF amount cannot be negative")
    
    rate = fetch_btc_xof_rate()
    btc_amount = Decimal(xof) / rate
    sats = int((btc_amount * SAT_PER_BTC).quantize(Decimal('1.'), rounding="ROUND_DOWN"))
    
    logger.debug(f"Converted {xof} XOF to {sats} sats (rate: {rate})")
    return sats

def get_rate_info() -> dict:
    """
    Get information about the current exchange rate.
    
    Returns:
        Dict with rate information and metadata
    """
    rate = fetch_btc_xof_rate()
    cached_rate = get_cached_rate()
    
    return {
        "btc_xof_rate": float(rate),
        "is_cached": cached_rate is not None,
        "cache_age_minutes": (
            (datetime.utcnow() - _rate_cache["timestamp"]).total_seconds() / 60
            if _rate_cache["timestamp"] else None
        ),
        "source": _rate_cache["source"],
        "sat_per_btc": SAT_PER_BTC,
        "last_updated": _rate_cache["timestamp"].isoformat() if _rate_cache["timestamp"] else None
    }

def update_rate_manually(rate: Decimal, source: str = "manual") -> None:
    """
    Manually update the exchange rate (for admin use).
    
    Args:
        rate: New BTC/XOF rate
        source: Source of the rate update
    """
    if rate <= 0:
        raise ValueError("Exchange rate must be positive")
    
    set_cached_rate(rate, source)
    logger.info(f"Manually updated BTC/XOF rate to {rate} from {source}")
