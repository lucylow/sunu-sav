# server/_core/security/receipt.py
"""
HMAC receipt system with versioning for SunuSàv
Provides cryptographic proof of transactions and operations
"""

import hmac
import hashlib
import json
import time
from typing import Dict, Any, Optional
from .secrets import get_secret

def _hmac_sign(secret: str, payload: bytes) -> str:
    """Create HMAC signature using SHA-256"""
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()

def _canonicalize_payload(payload: Dict[str, Any]) -> bytes:
    """Convert payload to canonical JSON format for consistent hashing"""
    return json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")

def make_receipt(payload: Dict[str, Any], version: str = "v1") -> str:
    """
    Create a signed receipt for a transaction or operation
    
    Args:
        payload: The data to be signed (must be JSON-serializable)
        version: Receipt version for key rotation support
        
    Returns:
        Receipt string in format "version:signature"
        
    Example:
        receipt = make_receipt({
            "id": "contrib_123",
            "group_id": "group_456", 
            "user_id": "user_789",
            "amount_sats": 1000,
            "created_at_ms": 1640995200000
        })
    """
    try:
        # Get the secret for this version
        secret = get_secret(f"RECEIPT_HMAC_{version.upper()}")
        
        # Canonicalize the payload
        canonical = _canonicalize_payload(payload)
        
        # Create HMAC signature
        signature = _hmac_sign(secret, canonical)
        
        # Return versioned receipt
        return f"{version}:{signature}"
        
    except Exception as e:
        raise RuntimeError(f"Failed to create receipt: {e}")

def verify_receipt(payload: Dict[str, Any], receipt: str) -> bool:
    """
    Verify a receipt against the provided payload
    
    Args:
        payload: The original data that was signed
        receipt: The receipt string to verify
        
    Returns:
        True if receipt is valid, False otherwise
        
    Example:
        is_valid = verify_receipt(contribution_data, receipt_hash)
    """
    try:
        # Parse receipt format
        if ":" not in receipt:
            return False
            
        version, signature = receipt.split(":", 1)
        
        # Canonicalize the payload
        canonical = _canonicalize_payload(payload)
        
        # Try current version first
        try:
            secret = get_secret(f"RECEIPT_HMAC_{version.upper()}")
            if hmac.compare_digest(_hmac_sign(secret, canonical), signature):
                return True
        except Exception:
            pass
            
        # Try previous version for rotation tolerance
        try:
            prev_secret = get_secret("RECEIPT_HMAC_PREV")
            if prev_secret:
                if hmac.compare_digest(_hmac_sign(prev_secret, canonical), signature):
                    return True
        except Exception:
            pass
            
        return False
        
    except Exception:
        return False

def create_contribution_receipt(
    contribution_id: str,
    group_id: str,
    user_id: str,
    amount_sats: int,
    created_at_ms: int,
    payment_hash: Optional[str] = None,
    bitcoin_tx_hash: Optional[str] = None
) -> str:
    """
    Create a receipt for a contribution payment
    
    Args:
        contribution_id: Unique contribution identifier
        group_id: Group identifier
        user_id: User identifier
        amount_sats: Amount in satoshis
        created_at_ms: Creation timestamp in milliseconds
        payment_hash: Lightning payment hash (optional)
        bitcoin_tx_hash: Bitcoin transaction hash (optional)
        
    Returns:
        Signed receipt string
    """
    payload = {
        "type": "contribution",
        "id": contribution_id,
        "group_id": group_id,
        "user_id": user_id,
        "amount_sats": amount_sats,
        "created_at_ms": created_at_ms,
        "timestamp": int(time.time() * 1000)
    }
    
    # Add payment details if available
    if payment_hash:
        payload["payment_hash"] = payment_hash
    if bitcoin_tx_hash:
        payload["bitcoin_tx_hash"] = bitcoin_tx_hash
        
    return make_receipt(payload)

def create_payout_receipt(
    payout_id: str,
    group_id: str,
    recipient_user_id: str,
    amount_sats: int,
    cycle_number: int,
    payment_method: str,
    payment_address: str,
    payment_tx_hash: Optional[str] = None
) -> str:
    """
    Create a receipt for a payout transaction
    
    Args:
        payout_id: Unique payout identifier
        group_id: Group identifier
        recipient_user_id: Recipient user identifier
        amount_sats: Amount in satoshis
        cycle_number: Cycle number
        payment_method: Payment method ('lightning' or 'bitcoin')
        payment_address: Payment address
        payment_tx_hash: Payment transaction hash (optional)
        
    Returns:
        Signed receipt string
    """
    payload = {
        "type": "payout",
        "id": payout_id,
        "group_id": group_id,
        "recipient_user_id": recipient_user_id,
        "amount_sats": amount_sats,
        "cycle_number": cycle_number,
        "payment_method": payment_method,
        "payment_address": payment_address,
        "timestamp": int(time.time() * 1000)
    }
    
    # Add transaction hash if available
    if payment_tx_hash:
        payload["payment_tx_hash"] = payment_tx_hash
        
    return make_receipt(payload)

def create_group_receipt(
    group_id: str,
    action: str,
    admin_user_id: str,
    details: Dict[str, Any]
) -> str:
    """
    Create a receipt for group management actions
    
    Args:
        group_id: Group identifier
        action: Action performed ('create', 'update', 'close', 'add_member', 'remove_member')
        admin_user_id: Admin user who performed the action
        details: Additional action details
        
    Returns:
        Signed receipt string
    """
    payload = {
        "type": "group_action",
        "group_id": group_id,
        "action": action,
        "admin_user_id": admin_user_id,
        "details": details,
        "timestamp": int(time.time() * 1000)
    }
    
    return make_receipt(payload)

def create_audit_receipt(
    user_id: str,
    action: str,
    resource_type: str,
    resource_id: str,
    details: Dict[str, Any]
) -> str:
    """
    Create a receipt for audit log entries
    
    Args:
        user_id: User who performed the action
        action: Action performed
        resource_type: Type of resource affected
        resource_id: Resource identifier
        details: Additional action details
        
    Returns:
        Signed receipt string
    """
    payload = {
        "type": "audit",
        "user_id": user_id,
        "action": action,
        "resource_type": resource_type,
        "resource_id": resource_id,
        "details": details,
        "timestamp": int(time.time() * 1000)
    }
    
    return make_receipt(payload)

def verify_contribution_receipt(contribution_data: Dict[str, Any], receipt: str) -> bool:
    """Verify a contribution receipt"""
    return verify_receipt(contribution_data, receipt)

def verify_payout_receipt(payout_data: Dict[str, Any], receipt: str) -> bool:
    """Verify a payout receipt"""
    return verify_receipt(payout_data, receipt)

def verify_group_receipt(group_data: Dict[str, Any], receipt: str) -> bool:
    """Verify a group action receipt"""
    return verify_receipt(group_data, receipt)

def verify_audit_receipt(audit_data: Dict[str, Any], receipt: str) -> bool:
    """Verify an audit log receipt"""
    return verify_receipt(audit_data, receipt)

# Receipt validation utilities
def validate_receipt_format(receipt: str) -> bool:
    """Validate receipt format without verifying signature"""
    try:
        if ":" not in receipt:
            return False
            
        version, signature = receipt.split(":", 1)
        
        # Check version format
        if not version.startswith("v") or not version[1:].isdigit():
            return False
            
        # Check signature format (should be hex)
        if not all(c in "0123456789abcdef" for c in signature.lower()):
            return False
            
        # Check signature length (SHA-256 = 64 hex chars)
        if len(signature) != 64:
            return False
            
        return True
        
    except Exception:
        return False

def extract_receipt_version(receipt: str) -> Optional[str]:
    """Extract version from receipt string"""
    try:
        if ":" in receipt:
            return receipt.split(":", 1)[0]
    except Exception:
        pass
    return None

def extract_receipt_signature(receipt: str) -> Optional[str]:
    """Extract signature from receipt string"""
    try:
        if ":" in receipt:
            return receipt.split(":", 1)[1]
    except Exception:
        pass
    return None

# Batch receipt operations
def create_batch_receipt(operations: list[Dict[str, Any]]) -> str:
    """
    Create a receipt for a batch of operations
    
    Args:
        operations: List of operation data dictionaries
        
    Returns:
        Signed receipt string for the batch
    """
    payload = {
        "type": "batch",
        "operations": operations,
        "count": len(operations),
        "timestamp": int(time.time() * 1000)
    }
    
    return make_receipt(payload)

def verify_batch_receipt(operations: list[Dict[str, Any]], receipt: str) -> bool:
    """Verify a batch receipt"""
    batch_data = {
        "type": "batch",
        "operations": operations,
        "count": len(operations)
    }
    
    return verify_receipt(batch_data, receipt)

# Receipt rotation utilities
def rotate_receipt_keys(new_version: str = "v2"):
    """
    Rotate receipt signing keys
    
    Args:
        new_version: New version identifier
        
    Note: This should be called during maintenance windows
    """
    try:
        # Get current secret
        current_secret = get_secret("RECEIPT_HMAC_V1")
        
        # Set previous secret for transition period
        from .secrets import rotate_secret
        rotate_secret("RECEIPT_HMAC_PREV", current_secret)
        
        # Generate new secret
        import secrets
        new_secret = secrets.token_urlsafe(32)
        
        # Set new secret
        rotate_secret(f"RECEIPT_HMAC_{new_version.upper()}", new_secret)
        
        print(f"✅ Receipt keys rotated to version {new_version}")
        print("⚠️  Previous version will be supported for 30 days")
        
    except Exception as e:
        print(f"❌ Failed to rotate receipt keys: {e}")
        raise

if __name__ == "__main__":
    # CLI for receipt management
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python receipt.py [test|rotate <version>]")
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "test":
        # Test receipt creation and verification
        test_data = {
            "id": "test_123",
            "group_id": "group_456",
            "user_id": "user_789",
            "amount_sats": 1000,
            "created_at_ms": int(time.time() * 1000)
        }
        
        receipt = make_receipt(test_data)
        print(f"Created receipt: {receipt}")
        
        is_valid = verify_receipt(test_data, receipt)
        print(f"Verification result: {is_valid}")
        
    elif command == "rotate" and len(sys.argv) == 3:
        version = sys.argv[2]
        try:
            rotate_receipt_keys(version)
        except Exception as e:
            print(f"❌ Failed to rotate keys: {e}")
            sys.exit(1)
            
    else:
        print("Invalid command")
        sys.exit(1)
