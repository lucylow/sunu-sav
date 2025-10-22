# server/_core/security/routers/secure_example.py
"""
Example secure route demonstrating all security features
This serves as a template for implementing secure endpoints
"""

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
import time
import logging

# Import security modules
from ..auth.permissions import require_permission_dep, require_role_dep, Permissions, Roles
from ..receipt import create_contribution_receipt, verify_contribution_receipt
from ..crypto import validate_phone, validate_bitcoin_address, validate_lightning_invoice, hash_phone
from ..logging.pii_filter import log_financial_transaction, log_data_access
from ..secrets import get_secret

logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Router
router = APIRouter()

# Pydantic models with validation
class ContributionRequest(BaseModel):
    """Secure contribution request model"""
    id: str = Field(..., min_length=8, max_length=128, description="Unique contribution ID")
    group_id: str = Field(..., min_length=8, description="Group identifier")
    user_id: str = Field(..., min_length=8, description="User identifier")
    amount_sats: int = Field(..., gt=0, le=10_000_000, description="Amount in satoshis")
    phone_number: Optional[str] = Field(None, description="User phone number")
    bitcoin_address: Optional[str] = Field(None, description="Bitcoin address for fallback")
    lightning_invoice: Optional[str] = Field(None, description="Lightning invoice")
    created_at_ms: int = Field(..., description="Creation timestamp in milliseconds")
    client_idempotency_key: str = Field(..., min_length=8, max_length=128, description="Client idempotency key")
    
    @validator("phone_number")
    def validate_phone_number(cls, v):
        if v and not validate_phone(v):
            raise ValueError("Invalid phone number format")
        return v
        
    @validator("bitcoin_address")
    def validate_bitcoin_address(cls, v):
        if v and not validate_bitcoin_address(v):
            raise ValueError("Invalid Bitcoin address format")
        return v
        
    @validator("lightning_invoice")
    def validate_lightning_invoice(cls, v):
        if v and not validate_lightning_invoice(v):
            raise ValueError("Invalid Lightning invoice format")
        return v
        
    @validator("created_at_ms")
    def validate_timestamp(cls, v):
        now_ms = int(time.time() * 1000)
        if v > now_ms + 5 * 60 * 1000:  # 5 minutes in future
            raise ValueError("Timestamp cannot be in the future")
        return v

class ContributionResponse(BaseModel):
    """Secure contribution response model"""
    success: bool
    contribution_id: str
    receipt_hash: str
    status: str
    message: str

class GroupRequest(BaseModel):
    """Secure group creation request model"""
    name: str = Field(..., min_length=1, max_length=100, description="Group name")
    description: Optional[str] = Field(None, max_length=500, description="Group description")
    contribution_amount_sats: int = Field(..., gt=0, le=1_000_000, description="Contribution amount")
    max_members: int = Field(..., gt=1, le=50, description="Maximum number of members")
    frequency: str = Field(..., regex="^(weekly|monthly|quarterly)$", description="Contribution frequency")

class GroupResponse(BaseModel):
    """Secure group response model"""
    success: bool
    group_id: str
    receipt_hash: str
    message: str

# Example secure contribution endpoint
@router.post("/contributions", response_model=ContributionResponse)
@limiter.limit("20/hour")  # Rate limiting
async def create_contribution(
    request: Request,
    contribution: ContributionRequest,
    # RBAC: require create_contribution permission
    user = Depends(require_permission_dep(Permissions.CREATE_CONTRIBUTION))
):
    """
    Create a secure contribution with full validation and audit logging
    
    This endpoint demonstrates:
    - Rate limiting
    - RBAC permission checking
    - Input validation with Pydantic
    - PII scrubbing in logs
    - HMAC receipt generation
    - Financial transaction logging
    """
    try:
        # Log data access
        log_data_access(
            user_id=user['id'],
            resource_type="contribution",
            resource_id=contribution.id,
            action="create"
        )
        
        # Check for duplicate contribution (idempotency)
        # In real implementation, check database
        # existing_contribution = db.query(Contribution).filter_by(id=contribution.id).first()
        # if existing_contribution:
        #     return ContributionResponse(
        #         success=True,
        #         contribution_id=contribution.id,
        #         receipt_hash=existing_contribution.receipt_hash,
        #         status="duplicate",
        #         message="Contribution already exists"
        #     )
        
        # Hash phone number for privacy
        phone_hash = None
        if contribution.phone_number:
            phone_hash = hash_phone(contribution.phone_number)
        
        # Create contribution record
        contribution_data = {
            "id": contribution.id,
            "group_id": contribution.group_id,
            "user_id": contribution.user_id,
            "amount_sats": contribution.amount_sats,
            "phone_hash": phone_hash,
            "bitcoin_address": contribution.bitcoin_address,
            "lightning_invoice": contribution.lightning_invoice,
            "created_at_ms": contribution.created_at_ms,
            "client_idempotency_key": contribution.client_idempotency_key
        }
        
        # Generate HMAC receipt
        receipt_hash = create_contribution_receipt(
            contribution_id=contribution.id,
            group_id=contribution.group_id,
            user_id=contribution.user_id,
            amount_sats=contribution.amount_sats,
            created_at_ms=contribution.created_at_ms
        )
        
        # Log financial transaction
        log_financial_transaction(
            transaction_type="contribution",
            user_id=user['id'],
            amount=contribution.amount_sats,
            details={
                "group_id": contribution.group_id,
                "contribution_id": contribution.id,
                "receipt_hash": receipt_hash
            }
        )
        
        # In real implementation, save to database
        # contribution_record = Contribution(**contribution_data)
        # db.add(contribution_record)
        # db.commit()
        
        logger.info(f"Contribution created successfully", extra={
            "contribution_id": contribution.id,
            "group_id": contribution.group_id,
            "amount_sats": contribution.amount_sats,
            "receipt_hash": receipt_hash
        })
        
        return ContributionResponse(
            success=True,
            contribution_id=contribution.id,
            receipt_hash=receipt_hash,
            status="created",
            message="Contribution created successfully"
        )
        
    except ValueError as e:
        logger.warning(f"Validation error in contribution creation: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error creating contribution: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# Example secure group creation endpoint
@router.post("/groups", response_model=GroupResponse)
@limiter.limit("10/hour")  # Rate limiting
async def create_group(
    request: Request,
    group: GroupRequest,
    # RBAC: require create_group permission
    user = Depends(require_permission_dep(Permissions.CREATE_GROUP))
):
    """
    Create a secure group with full validation and audit logging
    
    This endpoint demonstrates:
    - Rate limiting
    - RBAC permission checking
    - Input validation with Pydantic
    - PII scrubbing in logs
    - HMAC receipt generation
    - Data access logging
    """
    try:
        # Generate group ID
        group_id = f"group_{int(time.time() * 1000)}"
        
        # Log data access
        log_data_access(
            user_id=user['id'],
            resource_type="group",
            resource_id=group_id,
            action="create"
        )
        
        # Create group record
        group_data = {
            "id": group_id,
            "name": group.name,
            "description": group.description,
            "contribution_amount_sats": group.contribution_amount_sats,
            "max_members": group.max_members,
            "frequency": group.frequency,
            "created_by": user['id']
        }
        
        # Generate HMAC receipt
        receipt_hash = create_group_receipt(
            group_id=group_id,
            action="create",
            admin_user_id=user['id'],
            details=group_data
        )
        
        # Log system event
        log_system_event("group_created", {
            "group_id": group_id,
            "created_by": user['id'],
            "name": group.name,
            "max_members": group.max_members
        })
        
        # In real implementation, save to database
        # group_record = Group(**group_data)
        # db.add(group_record)
        # db.commit()
        
        logger.info(f"Group created successfully", extra={
            "group_id": group_id,
            "name": group.name,
            "created_by": user['id'],
            "receipt_hash": receipt_hash
        })
        
        return GroupResponse(
            success=True,
            group_id=group_id,
            receipt_hash=receipt_hash,
            message="Group created successfully"
        )
        
    except Exception as e:
        logger.error(f"Error creating group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# Example secure group management endpoint
@router.post("/groups/{group_id}/close")
@limiter.limit("5/hour")  # Rate limiting
async def close_group(
    request: Request,
    group_id: str,
    # RBAC: require group_admin role for this specific group
    user = Depends(require_role_dep(Roles.GROUP_ADMIN, "group_id"))
):
    """
    Close a group (admin only)
    
    This endpoint demonstrates:
    - Rate limiting
    - RBAC role checking with resource scoping
    - PII scrubbing in logs
    - HMAC receipt generation
    - Data access logging
    """
    try:
        # Log data access
        log_data_access(
            user_id=user['id'],
            resource_type="group",
            resource_id=group_id,
            action="close"
        )
        
        # Generate HMAC receipt
        receipt_hash = create_group_receipt(
            group_id=group_id,
            action="close",
            admin_user_id=user['id'],
            details={"closed_at": int(time.time() * 1000)}
        )
        
        # Log system event
        log_system_event("group_closed", {
            "group_id": group_id,
            "closed_by": user['id'],
            "receipt_hash": receipt_hash
        })
        
        # In real implementation, update database
        # db.query(Group).filter_by(id=group_id).update({"status": "closed"})
        # db.commit()
        
        logger.info(f"Group closed successfully", extra={
            "group_id": group_id,
            "closed_by": user['id'],
            "receipt_hash": receipt_hash
        })
        
        return {
            "success": True,
            "group_id": group_id,
            "receipt_hash": receipt_hash,
            "message": "Group closed successfully"
        }
        
    except Exception as e:
        logger.error(f"Error closing group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# Example secure data retrieval endpoint
@router.get("/groups/{group_id}")
@limiter.limit("100/hour")  # Rate limiting
async def get_group(
    request: Request,
    group_id: str,
    # RBAC: require view_group permission for this specific group
    user = Depends(require_permission_dep(Permissions.VIEW_GROUP, "group_id"))
):
    """
    Get group information (with permission checking)
    
    This endpoint demonstrates:
    - Rate limiting
    - RBAC permission checking with resource scoping
    - PII scrubbing in logs
    - Data access logging
    """
    try:
        # Log data access
        log_data_access(
            user_id=user['id'],
            resource_type="group",
            resource_id=group_id,
            action="read"
        )
        
        # In real implementation, fetch from database
        # group = db.query(Group).filter_by(id=group_id).first()
        # if not group:
        #     raise HTTPException(status_code=404, detail="Group not found")
        
        # Mock group data
        group_data = {
            "id": group_id,
            "name": "Example Group",
            "description": "A secure tontine group",
            "contribution_amount_sats": 1000,
            "max_members": 10,
            "current_members": 5,
            "frequency": "monthly",
            "status": "active"
        }
        
        logger.info(f"Group retrieved successfully", extra={
            "group_id": group_id,
            "requested_by": user['id']
        })
        
        return group_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving group: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# Example secure validation endpoints
@router.post("/validate/phone")
@limiter.limit("1000/hour")  # Rate limiting
async def validate_phone_endpoint(
    request: Request,
    phone: str = Field(..., description="Phone number to validate")
):
    """Validate phone number format"""
    is_valid = validate_phone(phone)
    return {"valid": is_valid, "phone": phone}

@router.post("/validate/bitcoin-address")
@limiter.limit("1000/hour")  # Rate limiting
async def validate_bitcoin_address_endpoint(
    request: Request,
    address: str = Field(..., description="Bitcoin address to validate")
):
    """Validate Bitcoin address format"""
    is_valid = validate_bitcoin_address(address)
    return {"valid": is_valid, "address": address}

@router.post("/validate/lightning-invoice")
@limiter.limit("1000/hour")  # Rate limiting
async def validate_lightning_invoice_endpoint(
    request: Request,
    invoice: str = Field(..., description="Lightning invoice to validate")
):
    """Validate Lightning invoice format"""
    is_valid = validate_lightning_invoice(invoice)
    return {"valid": is_valid, "invoice": invoice}

# Example secure admin endpoint
@router.get("/admin/security-status")
@limiter.limit("10/hour")  # Rate limiting
async def get_security_status(
    request: Request,
    # RBAC: require system_admin role
    user = Depends(require_role_dep(Roles.SYS_ADMIN))
):
    """
    Get security status (admin only)
    
    This endpoint demonstrates:
    - Rate limiting
    - RBAC role checking
    - Admin-only access
    - Data access logging
    """
    try:
        # Log data access
        log_data_access(
            user_id=user['id'],
            resource_type="system",
            resource_id="security_status",
            action="read"
        )
        
        security_status = {
            "rbac_enabled": True,
            "rate_limiting_enabled": True,
            "pii_scrubbing_enabled": True,
            "audit_logging_enabled": True,
            "field_encryption_enabled": True,
            "hmac_receipts_enabled": True,
            "security_headers_enabled": True,
            "last_security_scan": "2024-10-22T10:00:00Z",
            "vulnerability_count": 0,
            "certificate_expiry": "2025-10-22T10:00:00Z"
        }
        
        logger.info(f"Security status retrieved", extra={
            "requested_by": user['id']
        })
        
        return security_status
        
    except Exception as e:
        logger.error(f"Error retrieving security status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# Import missing functions
from ..receipt import create_group_receipt
from ..logging.pii_filter import log_system_event
