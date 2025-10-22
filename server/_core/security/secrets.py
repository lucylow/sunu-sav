# server/_core/security/secrets.py
"""
Secure secrets management for SunuSàv
Supports development (env vars) and production (KMS/Vault) backends
"""

import os
import json
import logging
from functools import lru_cache
from typing import Dict, Optional, Any
from cryptography.fernet import Fernet
import base64

logger = logging.getLogger(__name__)

class SecretsManager:
    """Secure secrets management with KMS/Vault integration"""
    
    def __init__(self, backend: str = None):
        self.backend = backend or os.getenv("SECRETS_BACKEND", "env")
        self._secrets_cache = {}
        self._initialized = False
        
    def _initialize(self):
        """Initialize secrets based on backend"""
        if self._initialized:
            return
            
        env = os.getenv("ENV", "dev")
        
        if self.backend == "aws-kms":
            self._load_from_aws_kms()
        elif self.backend == "vault":
            self._load_from_vault()
        elif self.backend == "env":
            self._load_from_env()
        else:
            raise ValueError(f"Unknown secrets backend: {self.backend}")
            
        self._initialized = True
        
    def _load_from_env(self):
        """Load secrets from environment variables (development)"""
        self._secrets_cache = {
            "JWT_SECRET": os.environ.get("JWT_SECRET"),
            "RECEIPT_HMAC_V1": os.environ.get("RECEIPT_HMAC_V1"),
            "RECEIPT_HMAC_PREV": os.environ.get("RECEIPT_HMAC_PREV"),
            "FERNET_KEY": os.environ.get("FERNET_KEY"),
            "LND_MACAROON_PATH": os.environ.get("LND_MACAROON_PATH"),
            "LND_TLS_CERT_PATH": os.environ.get("LND_TLS_CERT_PATH"),
            "LND_GRPC_HOST": os.environ.get("LND_GRPC_HOST"),
            "BTCPAY_API_KEY": os.environ.get("BTCPAY_API_KEY"),
            "WEBHOOK_SECRET": os.environ.get("WEBHOOK_SECRET"),
            "AUDIT_KEY_PATH": os.environ.get("AUDIT_KEY_PATH"),
            "DB_ENCRYPTION_KEY": os.environ.get("DB_ENCRYPTION_KEY"),
            "MFA_ISSUER": os.environ.get("MFA_ISSUER", "SunuSàv"),
        }
        
    def _load_from_aws_kms(self):
        """Load secrets from AWS KMS/Secrets Manager (production)"""
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            # Initialize AWS clients
            kms_client = boto3.client('kms')
            secrets_client = boto3.client('secretsmanager')
            
            # Load secrets from Secrets Manager
            secret_name = os.getenv("AWS_SECRET_NAME", "sunusav/prod/secrets")
            
            try:
                response = secrets_client.get_secret_value(SecretId=secret_name)
                secrets = json.loads(response['SecretString'])
                self._secrets_cache.update(secrets)
            except ClientError as e:
                logger.error(f"Failed to load secrets from AWS: {e}")
                raise
                
        except ImportError:
            logger.error("boto3 not installed for AWS KMS integration")
            raise RuntimeError("AWS KMS integration requires boto3")
            
    def _load_from_vault(self):
        """Load secrets from HashiCorp Vault (production)"""
        try:
            import hvac
            
            # Initialize Vault client
            vault_url = os.getenv("VAULT_URL")
            vault_token = os.getenv("VAULT_TOKEN")
            
            if not vault_url or not vault_token:
                raise ValueError("VAULT_URL and VAULT_TOKEN must be set")
                
            client = hvac.Client(url=vault_url, token=vault_token)
            
            # Load secrets from Vault
            secret_path = os.getenv("VAULT_SECRET_PATH", "secret/sunusav/prod")
            
            try:
                response = client.secrets.kv.v2.read_secret_version(path=secret_path)
                secrets = response['data']['data']
                self._secrets_cache.update(secrets)
            except Exception as e:
                logger.error(f"Failed to load secrets from Vault: {e}")
                raise
                
        except ImportError:
            logger.error("hvac not installed for Vault integration")
            raise RuntimeError("Vault integration requires hvac")
            
    def get_secret(self, name: str, required: bool = True) -> Optional[str]:
        """Get a secret by name"""
        if not self._initialized:
            self._initialize()
            
        value = self._secrets_cache.get(name)
        
        if not value and required:
            raise RuntimeError(f"Missing required secret: {name}")
            
        return value
        
    def get_fernet_key(self) -> bytes:
        """Get Fernet encryption key"""
        key_str = self.get_secret("FERNET_KEY")
        if not key_str:
            # Generate a new key if none exists (development only)
            key = Fernet.generate_key()
            logger.warning("Generated new Fernet key - ensure it's stored securely")
            return key
        return key_str.encode()
        
    def rotate_secret(self, name: str, new_value: str):
        """Rotate a secret (production only)"""
        if self.backend == "env":
            logger.warning("Secret rotation not supported in env backend")
            return
            
        # Update cache
        self._secrets_cache[name] = new_value
        
        # Update in backend
        if self.backend == "aws-kms":
            self._rotate_aws_secret(name, new_value)
        elif self.backend == "vault":
            self._rotate_vault_secret(name, new_value)
            
    def _rotate_aws_secret(self, name: str, new_value: str):
        """Rotate secret in AWS Secrets Manager"""
        try:
            import boto3
            
            secrets_client = boto3.client('secretsmanager')
            secret_name = os.getenv("AWS_SECRET_NAME", "sunusav/prod/secrets")
            
            # Get current secrets
            response = secrets_client.get_secret_value(SecretId=secret_name)
            secrets = json.loads(response['SecretString'])
            
            # Update the specific secret
            secrets[name] = new_value
            
            # Update in Secrets Manager
            secrets_client.update_secret(
                SecretId=secret_name,
                SecretString=json.dumps(secrets)
            )
            
            logger.info(f"Rotated secret {name} in AWS Secrets Manager")
            
        except Exception as e:
            logger.error(f"Failed to rotate secret {name} in AWS: {e}")
            raise
            
    def _rotate_vault_secret(self, name: str, new_value: str):
        """Rotate secret in HashiCorp Vault"""
        try:
            import hvac
            
            vault_url = os.getenv("VAULT_URL")
            vault_token = os.getenv("VAULT_TOKEN")
            secret_path = os.getenv("VAULT_SECRET_PATH", "secret/sunusav/prod")
            
            client = hvac.Client(url=vault_url, token=vault_token)
            
            # Get current secrets
            response = client.secrets.kv.v2.read_secret_version(path=secret_path)
            secrets = response['data']['data']
            
            # Update the specific secret
            secrets[name] = new_value
            
            # Update in Vault
            client.secrets.kv.v2.create_or_update_secret(
                path=secret_path,
                secret=secrets
            )
            
            logger.info(f"Rotated secret {name} in Vault")
            
        except Exception as e:
            logger.error(f"Failed to rotate secret {name} in Vault: {e}")
            raise

# Global secrets manager instance
secrets_manager = SecretsManager()

def get_secret(name: str, required: bool = True) -> Optional[str]:
    """Convenience function to get secrets"""
    return secrets_manager.get_secret(name, required)

def get_fernet_key() -> bytes:
    """Convenience function to get Fernet key"""
    return secrets_manager.get_fernet_key()

def rotate_secret(name: str, new_value: str):
    """Convenience function to rotate secrets"""
    secrets_manager.rotate_secret(name, new_value)

# Validation functions
def validate_secrets():
    """Validate that all required secrets are present"""
    required_secrets = [
        "JWT_SECRET",
        "RECEIPT_HMAC_V1", 
        "FERNET_KEY",
        "WEBHOOK_SECRET"
    ]
    
    missing_secrets = []
    for secret in required_secrets:
        try:
            get_secret(secret)
        except RuntimeError:
            missing_secrets.append(secret)
            
    if missing_secrets:
        raise RuntimeError(f"Missing required secrets: {', '.join(missing_secrets)}")
        
    logger.info("All required secrets validated successfully")

# Development helpers
def generate_development_secrets():
    """Generate secrets for development environment"""
    if os.getenv("ENV") == "prod":
        raise RuntimeError("Cannot generate secrets in production")
        
    secrets = {
        "JWT_SECRET": base64.urlsafe_b64encode(os.urandom(32)).decode(),
        "RECEIPT_HMAC_V1": base64.urlsafe_b64encode(os.urandom(32)).decode(),
        "FERNET_KEY": Fernet.generate_key().decode(),
        "WEBHOOK_SECRET": base64.urlsafe_b64encode(os.urandom(32)).decode(),
        "DB_ENCRYPTION_KEY": base64.urlsafe_b64encode(os.urandom(32)).decode(),
    }
    
    return secrets

if __name__ == "__main__":
    # CLI for secret management
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python secrets.py [validate|generate|rotate <name> <value>]")
        sys.exit(1)
        
    command = sys.argv[1]
    
    if command == "validate":
        try:
            validate_secrets()
            print("✅ All secrets validated successfully")
        except Exception as e:
            print(f"❌ Secret validation failed: {e}")
            sys.exit(1)
            
    elif command == "generate":
        if os.getenv("ENV") == "prod":
            print("❌ Cannot generate secrets in production")
            sys.exit(1)
            
        secrets = generate_development_secrets()
        print("Generated development secrets:")
        for name, value in secrets.items():
            print(f"{name}={value}")
            
    elif command == "rotate" and len(sys.argv) == 4:
        name = sys.argv[2]
        value = sys.argv[3]
        try:
            rotate_secret(name, value)
            print(f"✅ Rotated secret {name}")
        except Exception as e:
            print(f"❌ Failed to rotate secret {name}: {e}")
            sys.exit(1)
            
    else:
        print("Invalid command")
        sys.exit(1)
