# server/_core/security/crypto.py
"""
Cryptographic utilities for SunuSàv
Includes field encryption, PII scrubbing, and secure data handling
"""

import re
import json
import logging
from typing import Any, Dict, List, Optional, Union
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import secrets
from .secrets import get_secret, get_fernet_key

logger = logging.getLogger(__name__)

class FieldEncryption:
    """Field-level encryption for sensitive data"""
    
    def __init__(self):
        self._fernet = None
        
    def _get_fernet(self) -> Fernet:
        """Get Fernet cipher instance"""
        if self._fernet is None:
            key = get_fernet_key()
            self._fernet = Fernet(key)
        return self._fernet
        
    def encrypt_str(self, plaintext: str) -> bytes:
        """Encrypt a string field"""
        if not plaintext:
            return b""
        try:
            return self._get_fernet().encrypt(plaintext.encode('utf-8'))
        except Exception as e:
            logger.error(f"Failed to encrypt string: {e}")
            raise
            
    def decrypt_str(self, ciphertext: bytes) -> str:
        """Decrypt a string field"""
        if not ciphertext:
            return ""
        try:
            return self._get_fernet().decrypt(ciphertext).decode('utf-8')
        except Exception as e:
            logger.error(f"Failed to decrypt string: {e}")
            raise
            
    def encrypt_json(self, data: Dict[str, Any]) -> bytes:
        """Encrypt JSON data"""
        if not data:
            return b""
        try:
            json_str = json.dumps(data, sort_keys=True)
            return self._get_fernet().encrypt(json_str.encode('utf-8'))
        except Exception as e:
            logger.error(f"Failed to encrypt JSON: {e}")
            raise
            
    def decrypt_json(self, ciphertext: bytes) -> Dict[str, Any]:
        """Decrypt JSON data"""
        if not ciphertext:
            return {}
        try:
            json_str = self._get_fernet().decrypt(ciphertext).decode('utf-8')
            return json.loads(json_str)
        except Exception as e:
            logger.error(f"Failed to decrypt JSON: {e}")
            raise

# Global field encryption instance
field_encryption = FieldEncryption()

class PIIScrubber:
    """PII scrubbing for logs and data export"""
    
    def __init__(self):
        # Regex patterns for different types of PII
        self.patterns = {
            'phone': re.compile(r'(\+221|0)\d{7,9}'),  # Senegal phone numbers
            'phone_intl': re.compile(r'\+[1-9]\d{1,14}'),  # International phone numbers
            'bitcoin_address': re.compile(r'\b(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b'),
            'lightning_invoice': re.compile(r'lnbc\d+[munp]1[0-9a-z]+'),
            'email': re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'),
            'ip_address': re.compile(r'\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b'),
            'macaroon': re.compile(r'[A-Za-z0-9+/]{64,}={0,2}'),  # Base64 macaroons
            'jwt_token': re.compile(r'eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*'),
            'api_key': re.compile(r'[A-Za-z0-9]{32,}'),  # Generic API keys
        }
        
        # Sensitive keys that should be redacted
        self.sensitive_keys = {
            'phone', 'phone_number', 'phone_hash', 'email', 'email_address',
            'mnemonic', 'seed', 'private_key', 'password', 'secret', 'token',
            'payment_request', 'lightning_invoice', 'bitcoin_address',
            'macaroon', 'api_key', 'jwt', 'session_token', 'auth_token'
        }
        
    def scrub_value(self, value: Any) -> Any:
        """Scrub PII from a single value"""
        if isinstance(value, str):
            # Apply regex patterns
            for pattern_name, pattern in self.patterns.items():
                value = pattern.sub(f'[REDACTED_{pattern_name.upper()}]', value)
            return value
            
        elif isinstance(value, dict):
            return {k: self.scrub_value(v) if k not in self.sensitive_keys 
                   else f'[REDACTED_{k.upper()}]' for k, v in value.items()}
                   
        elif isinstance(value, list):
            return [self.scrub_value(item) for item in value]
            
        else:
            return value
            
    def scrub_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Scrub PII from a dictionary"""
        return self.scrub_value(data)
        
    def scrub_json_string(self, json_str: str) -> str:
        """Scrub PII from a JSON string"""
        try:
            data = json.loads(json_str)
            scrubbed = self.scrub_value(data)
            return json.dumps(scrubbed, separators=(',', ':'))
        except Exception:
            # If JSON parsing fails, scrub as string
            return self.scrub_value(json_str)

# Global PII scrubber instance
pii_scrubber = PIIScrubber()

class SecureHasher:
    """Secure hashing utilities for sensitive data"""
    
    @staticmethod
    def hash_phone(phone: str, salt: Optional[str] = None) -> str:
        """Hash phone number with salt for privacy"""
        if not phone:
            return ""
            
        # Use server secret as salt if not provided
        if not salt:
            salt = get_secret("DB_ENCRYPTION_KEY")
            
        # Create hash
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt.encode(),
            iterations=100000,
        )
        
        key = kdf.derive(phone.encode())
        return base64.urlsafe_b64encode(key).decode()
        
    @staticmethod
    def hash_user_data(data: str, user_id: str) -> str:
        """Hash user data with user-specific salt"""
        if not data:
            return ""
            
        # Use user ID as salt for deterministic hashing
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=user_id.encode(),
            iterations=100000,
        )
        
        key = kdf.derive(data.encode())
        return base64.urlsafe_b64encode(key).decode()
        
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """Generate a cryptographically secure token"""
        return secrets.token_urlsafe(length)
        
    @staticmethod
    def generate_api_key(prefix: str = "sunusav") -> str:
        """Generate a secure API key"""
        random_part = secrets.token_urlsafe(24)
        return f"{prefix}_{random_part}"

class SecureValidator:
    """Security validation utilities"""
    
    @staticmethod
    def validate_phone_number(phone: str) -> bool:
        """Validate phone number format"""
        if not phone:
            return False
            
        # Remove common formatting
        cleaned = re.sub(r'[\s\-\(\)\+]', '', phone)
        
        # Check if it's a valid phone number
        return re.match(r'^[0-9]{7,15}$', cleaned) is not None
        
    @staticmethod
    def validate_bitcoin_address(address: str) -> bool:
        """Validate Bitcoin address format"""
        if not address:
            return False
            
        # Basic Bitcoin address validation
        return re.match(r'^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$', address) is not None
        
    @staticmethod
    def validate_lightning_invoice(invoice: str) -> bool:
        """Validate Lightning invoice format"""
        if not invoice:
            return False
            
        # Basic Lightning invoice validation
        return re.match(r'^lnbc\d+[munp]1[0-9a-z]+$', invoice) is not None
        
    @staticmethod
    def validate_amount_sats(amount: int) -> bool:
        """Validate amount in satoshis"""
        return isinstance(amount, int) and 0 < amount <= 21_000_000_000_000  # Max Bitcoin supply
        
    @staticmethod
    def validate_idempotency_key(key: str) -> bool:
        """Validate idempotency key format"""
        if not key:
            return False
            
        # Should be alphanumeric with hyphens, 8-128 characters
        return re.match(r'^[a-zA-Z0-9\-]{8,128}$', key) is not None

class SecureLogger:
    """Secure logging with PII scrubbing"""
    
    def __init__(self, logger_name: str):
        self.logger = logging.getLogger(logger_name)
        
    def info(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log info message with PII scrubbing"""
        if extra:
            extra = pii_scrubber.scrub_dict(extra)
        self.logger.info(message, extra=extra)
        
    def warning(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log warning message with PII scrubbing"""
        if extra:
            extra = pii_scrubber.scrub_dict(extra)
        self.logger.warning(message, extra=extra)
        
    def error(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log error message with PII scrubbing"""
        if extra:
            extra = pii_scrubber.scrub_dict(extra)
        self.logger.error(message, extra=extra)
        
    def debug(self, message: str, extra: Optional[Dict[str, Any]] = None):
        """Log debug message with PII scrubbing"""
        if extra:
            extra = pii_scrubber.scrub_dict(extra)
        self.logger.debug(message, extra=extra)

# Utility functions for easy import
def encrypt_field(value: str) -> bytes:
    """Encrypt a field value"""
    return field_encryption.encrypt_str(value)

def decrypt_field(ciphertext: bytes) -> str:
    """Decrypt a field value"""
    return field_encryption.decrypt_str(ciphertext)

def scrub_pii(data: Any) -> Any:
    """Scrub PII from data"""
    return pii_scrubber.scrub_value(data)

def hash_phone(phone: str) -> str:
    """Hash phone number for privacy"""
    return SecureHasher.hash_phone(phone)

def generate_secure_token(length: int = 32) -> str:
    """Generate secure token"""
    return SecureHasher.generate_secure_token(length)

def validate_phone(phone: str) -> bool:
    """Validate phone number"""
    return SecureValidator.validate_phone_number(phone)

def validate_bitcoin_address(address: str) -> bool:
    """Validate Bitcoin address"""
    return SecureValidator.validate_bitcoin_address(address)

def validate_lightning_invoice(invoice: str) -> bool:
    """Validate Lightning invoice"""
    return SecureValidator.validate_lightning_invoice(invoice)

# Database model mixins for encrypted fields
class EncryptedFieldMixin:
    """Mixin for SQLAlchemy models with encrypted fields"""
    
    def set_encrypted_field(self, field_name: str, value: str):
        """Set an encrypted field value"""
        encrypted_value = encrypt_field(value)
        setattr(self, f"_{field_name}_enc", encrypted_value)
        
    def get_encrypted_field(self, field_name: str) -> str:
        """Get an encrypted field value"""
        encrypted_value = getattr(self, f"_{field_name}_enc", None)
        if encrypted_value:
            return decrypt_field(encrypted_value)
        return ""
        
    def has_encrypted_field(self, field_name: str) -> bool:
        """Check if encrypted field has a value"""
        encrypted_value = getattr(self, f"_{field_name}_enc", None)
        return encrypted_value is not None

if __name__ == "__main__":
    # CLI for crypto utilities
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python crypto.py [test|hash <phone>|validate <type> <value>]")
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "test":
        # Test encryption/decryption
        test_data = "test_phone_number"
        encrypted = encrypt_field(test_data)
        decrypted = decrypt_field(encrypted)
        print(f"Original: {test_data}")
        print(f"Encrypted: {encrypted}")
        print(f"Decrypted: {decrypted}")
        print(f"Match: {test_data == decrypted}")
        
        # Test PII scrubbing
        test_dict = {
            "phone": "+221701234567",
            "email": "test@example.com",
            "bitcoin_address": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
            "normal_field": "safe_data"
        }
        scrubbed = scrub_pii(test_dict)
        print(f"Original: {test_dict}")
        print(f"Scrubbed: {scrubbed}")
        
    elif command == "hash" and len(sys.argv) == 3:
        phone = sys.argv[2]
        hashed = hash_phone(phone)
        print(f"Phone: {phone}")
        print(f"Hashed: {hashed}")
        
    elif command == "validate" and len(sys.argv) == 4:
        validation_type = sys.argv[2]
        value = sys.argv[3]
        
        if validation_type == "phone":
            result = validate_phone(value)
        elif validation_type == "bitcoin":
            result = validate_bitcoin_address(value)
        elif validation_type == "lightning":
            result = validate_lightning_invoice(value)
        else:
            print("Invalid validation type")
            sys.exit(1)
            
        print(f"Validation result: {result}")
        
    else:
        print("Invalid command")
        sys.exit(1)
