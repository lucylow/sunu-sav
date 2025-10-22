# server/_core/security/logging/pii_filter.py
"""
PII scrubbing logging filter for SunuSàv
Ensures no personally identifiable information appears in logs
"""

import logging
import re
import json
from typing import Any, Dict, List, Optional
from ..crypto import pii_scrubber

class PIIFilter(logging.Filter):
    """Logging filter that scrubs PII from log messages"""
    
    def __init__(self, name: str = ""):
        super().__init__(name)
        self.scrubber = pii_scrubber
        
    def filter(self, record: logging.LogRecord) -> bool:
        """Filter and scrub PII from log record"""
        try:
            # Scrub the main message
            if hasattr(record, 'msg') and record.msg:
                record.msg = self._scrub_message(record.msg)
                
            # Scrub extra data
            if hasattr(record, 'extra') and record.extra:
                record.extra = self.scrubber.scrub_value(record.extra)
                
            # Scrub args if present
            if hasattr(record, 'args') and record.args:
                record.args = tuple(self.scrubber.scrub_value(arg) for arg in record.args)
                
        except Exception as e:
            # If scrubbing fails, log the error but don't crash
            print(f"PII scrubbing failed: {e}")
            
        return True
        
    def _scrub_message(self, message: Any) -> Any:
        """Scrub PII from log message"""
        if isinstance(message, str):
            return self.scrubber.scrub_value(message)
        elif isinstance(message, (dict, list)):
            return self.scrubber.scrub_value(message)
        else:
            return message

class SecureFormatter(logging.Formatter):
    """Log formatter that ensures PII scrubbing"""
    
    def __init__(self, fmt: Optional[str] = None, datefmt: Optional[str] = None):
        if fmt is None:
            fmt = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        super().__init__(fmt, datefmt)
        
    def format(self, record: logging.LogRecord) -> str:
        """Format log record with PII scrubbing"""
        # Apply PII filter before formatting
        pii_filter = PIIFilter()
        pii_filter.filter(record)
        
        return super().format(record)

class AuditLogger:
    """Secure audit logger for security events"""
    
    def __init__(self, name: str = "audit"):
        self.logger = logging.getLogger(name)
        self.logger.addFilter(PIIFilter())
        
        # Ensure audit logs go to a separate file
        if not self.logger.handlers:
            handler = logging.FileHandler('logs/audit.log')
            handler.setFormatter(SecureFormatter())
            self.logger.addHandler(handler)
            self.logger.setLevel(logging.INFO)
            
    def log_security_event(self, event_type: str, user_id: str, details: Dict[str, Any]):
        """Log a security event"""
        self.logger.info(f"Security event: {event_type}", extra={
            'event_type': event_type,
            'user_id': user_id,
            'details': details,
            'timestamp': self._get_timestamp()
        })
        
    def log_authentication(self, user_id: str, success: bool, ip_address: str, user_agent: str):
        """Log authentication attempt"""
        self.logger.info(f"Authentication attempt: {'success' if success else 'failed'}", extra={
            'event_type': 'authentication',
            'user_id': user_id,
            'success': success,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'timestamp': self._get_timestamp()
        })
        
    def log_authorization(self, user_id: str, resource: str, action: str, success: bool):
        """Log authorization attempt"""
        self.logger.info(f"Authorization attempt: {'granted' if success else 'denied'}", extra={
            'event_type': 'authorization',
            'user_id': user_id,
            'resource': resource,
            'action': action,
            'success': success,
            'timestamp': self._get_timestamp()
        })
        
    def log_financial_transaction(self, transaction_type: str, user_id: str, amount: int, details: Dict[str, Any]):
        """Log financial transaction"""
        self.logger.info(f"Financial transaction: {transaction_type}", extra={
            'event_type': 'financial_transaction',
            'transaction_type': transaction_type,
            'user_id': user_id,
            'amount': amount,
            'details': details,
            'timestamp': self._get_timestamp()
        })
        
    def log_data_access(self, user_id: str, resource_type: str, resource_id: str, action: str):
        """Log data access"""
        self.logger.info(f"Data access: {action}", extra={
            'event_type': 'data_access',
            'user_id': user_id,
            'resource_type': resource_type,
            'resource_id': resource_id,
            'action': action,
            'timestamp': self._get_timestamp()
        })
        
    def log_system_event(self, event_type: str, details: Dict[str, Any]):
        """Log system event"""
        self.logger.info(f"System event: {event_type}", extra={
            'event_type': 'system_event',
            'event': event_type,
            'details': details,
            'timestamp': self._get_timestamp()
        })
        
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'

class RequestLogger:
    """Secure request logger that scrubs PII from HTTP requests"""
    
    def __init__(self, name: str = "requests"):
        self.logger = logging.getLogger(name)
        self.logger.addFilter(PIIFilter())
        
    def log_request(self, method: str, path: str, user_id: Optional[str], 
                   ip_address: str, user_agent: str, status_code: int,
                   response_time: float, request_size: int, response_size: int):
        """Log HTTP request with PII scrubbing"""
        self.logger.info(f"HTTP {method} {path} - {status_code}", extra={
            'method': method,
            'path': path,
            'user_id': user_id,
            'ip_address': ip_address,
            'user_agent': user_agent,
            'status_code': status_code,
            'response_time_ms': int(response_time * 1000),
            'request_size_bytes': request_size,
            'response_size_bytes': response_size,
            'timestamp': self._get_timestamp()
        })
        
    def log_error(self, method: str, path: str, user_id: Optional[str],
                 ip_address: str, error: str, stack_trace: Optional[str] = None):
        """Log HTTP error with PII scrubbing"""
        self.logger.error(f"HTTP {method} {path} - Error: {error}", extra={
            'method': method,
            'path': path,
            'user_id': user_id,
            'ip_address': ip_address,
            'error': error,
            'stack_trace': stack_trace,
            'timestamp': self._get_timestamp()
        })
        
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + 'Z'

def setup_secure_logging():
    """Setup secure logging configuration"""
    import logging.config
    
    # Create logs directory if it doesn't exist
    import os
    os.makedirs('logs', exist_ok=True)
    
    # Logging configuration
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'secure': {
                '()': SecureFormatter,
                'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            },
            'audit': {
                '()': SecureFormatter,
                'format': '%(asctime)s - AUDIT - %(levelname)s - %(message)s'
            }
        },
        'filters': {
            'pii_filter': {
                '()': PIIFilter
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': 'INFO',
                'formatter': 'secure',
                'filters': ['pii_filter']
            },
            'file': {
                'class': 'logging.FileHandler',
                'filename': 'logs/app.log',
                'level': 'INFO',
                'formatter': 'secure',
                'filters': ['pii_filter']
            },
            'audit_file': {
                'class': 'logging.FileHandler',
                'filename': 'logs/audit.log',
                'level': 'INFO',
                'formatter': 'audit',
                'filters': ['pii_filter']
            },
            'error_file': {
                'class': 'logging.FileHandler',
                'filename': 'logs/error.log',
                'level': 'ERROR',
                'formatter': 'secure',
                'filters': ['pii_filter']
            }
        },
        'loggers': {
            '': {  # Root logger
                'level': 'INFO',
                'handlers': ['console', 'file'],
                'propagate': False
            },
            'audit': {
                'level': 'INFO',
                'handlers': ['audit_file'],
                'propagate': False
            },
            'uvicorn.error': {
                'level': 'ERROR',
                'handlers': ['error_file'],
                'propagate': False
            },
            'uvicorn.access': {
                'level': 'INFO',
                'handlers': ['file'],
                'propagate': False
            }
        }
    }
    
    logging.config.dictConfig(config)
    
    # Ensure all loggers use PII filter
    for logger_name in ['uvicorn.error', 'uvicorn.access']:
        logger = logging.getLogger(logger_name)
        logger.addFilter(PIIFilter())

# Global logger instances
audit_logger = AuditLogger()
request_logger = RequestLogger()

# Convenience functions
def log_security_event(event_type: str, user_id: str, details: Dict[str, Any]):
    """Log security event"""
    audit_logger.log_security_event(event_type, user_id, details)

def log_authentication(user_id: str, success: bool, ip_address: str, user_agent: str):
    """Log authentication attempt"""
    audit_logger.log_authentication(user_id, success, ip_address, user_agent)

def log_authorization(user_id: str, resource: str, action: str, success: bool):
    """Log authorization attempt"""
    audit_logger.log_authorization(user_id, resource, action, success)

def log_financial_transaction(transaction_type: str, user_id: str, amount: int, details: Dict[str, Any]):
    """Log financial transaction"""
    audit_logger.log_financial_transaction(transaction_type, user_id, amount, details)

def log_data_access(user_id: str, resource_type: str, resource_id: str, action: str):
    """Log data access"""
    audit_logger.log_data_access(user_id, resource_type, resource_id, action)

def log_system_event(event_type: str, details: Dict[str, Any]):
    """Log system event"""
    audit_logger.log_system_event(event_type, details)

if __name__ == "__main__":
    # Test PII scrubbing
    setup_secure_logging()
    
    # Test audit logging
    log_security_event("test_event", "user_123", {"phone": "+221701234567", "amount": 1000})
    log_authentication("user_123", True, "192.168.1.1", "Mozilla/5.0")
    log_financial_transaction("contribution", "user_123", 1000, {"group_id": "group_456"})
    
    print("✅ PII scrubbing and audit logging test completed")
