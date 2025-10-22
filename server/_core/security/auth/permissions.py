# server/_core/security/auth/permissions.py
"""
Role-Based Access Control (RBAC) for SunuSàv
Implements least-privilege access control for all endpoints
"""

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import List, Optional, Callable, Any
from functools import wraps
import logging
from ..logging.pii_filter import log_authorization

logger = logging.getLogger(__name__)

class RBACManager:
    """Role-Based Access Control manager"""
    
    def __init__(self, db_session: Callable):
        self.get_db = db_session
        
    def check_permission(self, user_id: str, permission: str, resource_id: Optional[str] = None, 
                        resource_type: Optional[str] = None, db: Session = None) -> bool:
        """Check if user has specific permission"""
        if not db:
            db = next(self.get_db())
            
        try:
            # Check if user has the permission directly or through a role
            query = """
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = :user_id 
                AND ur.is_active = true
                AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
                AND p.name = :permission
                AND (ur.resource_id IS NULL OR ur.resource_id = :resource_id)
                AND (ur.resource_type IS NULL OR ur.resource_type = :resource_type)
            """
            
            result = db.execute(query, {
                'user_id': user_id,
                'permission': permission,
                'resource_id': resource_id,
                'resource_type': resource_type
            }).fetchone()
            
            return result is not None
            
        except Exception as e:
            logger.error(f"Permission check failed: {e}")
            return False
            
    def check_role(self, user_id: str, role: str, resource_id: Optional[str] = None,
                   resource_type: Optional[str] = None, db: Session = None) -> bool:
        """Check if user has specific role"""
        if not db:
            db = next(self.get_db())
            
        try:
            query = """
                SELECT 1 FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = :user_id 
                AND ur.is_active = true
                AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
                AND r.name = :role
                AND (ur.resource_id IS NULL OR ur.resource_id = :resource_id)
                AND (ur.resource_type IS NULL OR ur.resource_type = :resource_type)
            """
            
            result = db.execute(query, {
                'user_id': user_id,
                'role': role,
                'resource_id': resource_id,
                'resource_type': resource_type
            }).fetchone()
            
            return result is not None
            
        except Exception as e:
            logger.error(f"Role check failed: {e}")
            return False
            
    def get_user_permissions(self, user_id: str, db: Session = None) -> List[str]:
        """Get all permissions for a user"""
        if not db:
            db = next(self.get_db())
            
        try:
            query = """
                SELECT DISTINCT p.name FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                JOIN role_permissions rp ON r.id = rp.role_id
                JOIN permissions p ON rp.permission_id = p.id
                WHERE ur.user_id = :user_id 
                AND ur.is_active = true
                AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
            """
            
            result = db.execute(query, {'user_id': user_id}).fetchall()
            return [row[0] for row in result]
            
        except Exception as e:
            logger.error(f"Failed to get user permissions: {e}")
            return []
            
    def get_user_roles(self, user_id: str, db: Session = None) -> List[Dict[str, Any]]:
        """Get all roles for a user with resource context"""
        if not db:
            db = next(self.get_db())
            
        try:
            query = """
                SELECT r.name, ur.resource_id, ur.resource_type, ur.granted_at, ur.expires_at
                FROM user_roles ur
                JOIN roles r ON ur.role_id = r.id
                WHERE ur.user_id = :user_id 
                AND ur.is_active = true
                AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
            """
            
            result = db.execute(query, {'user_id': user_id}).fetchall()
            return [
                {
                    'role': row[0],
                    'resource_id': row[1],
                    'resource_type': row[2],
                    'granted_at': row[3],
                    'expires_at': row[4]
                }
                for row in result
            ]
            
        except Exception as e:
            logger.error(f"Failed to get user roles: {e}")
            return []

# Global RBAC manager instance
rbac_manager = None

def init_rbac(db_session: Callable):
    """Initialize RBAC manager"""
    global rbac_manager
    rbac_manager = RBACManager(db_session)

def get_current_user(request: Request) -> Optional[Dict[str, Any]]:
    """Get current user from request"""
    # This should be implemented based on your authentication system
    # For now, return a mock user
    return getattr(request.state, 'user', None)

def require_permission(permission: str, resource_param: str = None):
    """Decorator to require specific permission"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request and user
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
                    
            if not request:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Request object not found"
                )
                
            user = get_current_user(request)
            if not user:
                log_authorization("anonymous", permission, "denied", False)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
                
            # Get resource ID if specified
            resource_id = None
            if resource_param:
                resource_id = request.path_params.get(resource_param) or request.query_params.get(resource_param)
                
            # Check permission
            db = next(rbac_manager.get_db())
            has_permission = rbac_manager.check_permission(
                user['id'], permission, resource_id, db=db
            )
            
            if not has_permission:
                log_authorization(user['id'], permission, "denied", False)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions: {permission}"
                )
                
            log_authorization(user['id'], permission, "granted", True)
            return await func(*args, **kwargs)
            
        return wrapper
    return decorator

def require_role(role: str, resource_param: str = None):
    """Decorator to require specific role"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request and user
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
                    
            if not request:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Request object not found"
                )
                
            user = get_current_user(request)
            if not user:
                log_authorization("anonymous", role, "denied", False)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
                
            # Get resource ID if specified
            resource_id = None
            if resource_param:
                resource_id = request.path_params.get(resource_param) or request.query_params.get(resource_param)
                
            # Check role
            db = next(rbac_manager.get_db())
            has_role = rbac_manager.check_role(
                user['id'], role, resource_id, db=db
            )
            
            if not has_role:
                log_authorization(user['id'], role, "denied", False)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient role: {role}"
                )
                
            log_authorization(user['id'], role, "granted", True)
            return await func(*args, **kwargs)
            
        return wrapper
    return decorator

def require_any_permission(permissions: List[str]):
    """Decorator to require any of the specified permissions"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request and user
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
                    
            if not request:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Request object not found"
                )
                
            user = get_current_user(request)
            if not user:
                log_authorization("anonymous", "any_permission", "denied", False)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
                
            # Check if user has any of the required permissions
            db = next(rbac_manager.get_db())
            user_permissions = rbac_manager.get_user_permissions(user['id'], db=db)
            
            has_any_permission = any(perm in user_permissions for perm in permissions)
            
            if not has_any_permission:
                log_authorization(user['id'], "any_permission", "denied", False)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions: {permissions}"
                )
                
            log_authorization(user['id'], "any_permission", "granted", True)
            return await func(*args, **kwargs)
            
        return wrapper
    return decorator

def require_all_permissions(permissions: List[str]):
    """Decorator to require all specified permissions"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Get request and user
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
                    
            if not request:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Request object not found"
                )
                
            user = get_current_user(request)
            if not user:
                log_authorization("anonymous", "all_permissions", "denied", False)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required"
                )
                
            # Check if user has all required permissions
            db = next(rbac_manager.get_db())
            user_permissions = rbac_manager.get_user_permissions(user['id'], db=db)
            
            has_all_permissions = all(perm in user_permissions for perm in permissions)
            
            if not has_all_permissions:
                log_authorization(user['id'], "all_permissions", "denied", False)
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Insufficient permissions: {permissions}"
                )
                
            log_authorization(user['id'], "all_permissions", "granted", True)
            return await func(*args, **kwargs)
            
        return wrapper
    return decorator

# FastAPI dependency functions
def require_permission_dep(permission: str, resource_param: str = None):
    """FastAPI dependency for permission checking"""
    def _require_permission(request: Request, db: Session = Depends(rbac_manager.get_db)):
        user = get_current_user(request)
        if not user:
            log_authorization("anonymous", permission, "denied", False)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
            
        # Get resource ID if specified
        resource_id = None
        if resource_param:
            resource_id = request.path_params.get(resource_param) or request.query_params.get(resource_param)
            
        # Check permission
        has_permission = rbac_manager.check_permission(
            user['id'], permission, resource_id, db=db
        )
        
        if not has_permission:
            log_authorization(user['id'], permission, "denied", False)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions: {permission}"
            )
            
        log_authorization(user['id'], permission, "granted", True)
        return user
        
    return _require_permission

def require_role_dep(role: str, resource_param: str = None):
    """FastAPI dependency for role checking"""
    def _require_role(request: Request, db: Session = Depends(rbac_manager.get_db)):
        user = get_current_user(request)
        if not user:
            log_authorization("anonymous", role, "denied", False)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required"
            )
            
        # Get resource ID if specified
        resource_id = None
        if resource_param:
            resource_id = request.path_params.get(resource_param) or request.query_params.get(resource_param)
            
        # Check role
        has_role = rbac_manager.check_role(
            user['id'], role, resource_id, db=db
        )
        
        if not has_role:
            log_authorization(user['id'], role, "denied", False)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient role: {role}"
            )
            
        log_authorization(user['id'], role, "granted", True)
        return user
        
    return _require_role

# Permission constants for easy reference
class Permissions:
    # Group permissions
    CREATE_GROUP = "create_group"
    MANAGE_GROUP = "manage_group"
    VIEW_GROUP = "view_group"
    DELETE_GROUP = "delete_group"
    
    # Contribution permissions
    CREATE_CONTRIBUTION = "create_contribution"
    VIEW_CONTRIBUTION = "view_contribution"
    CONFIRM_CONTRIBUTION = "confirm_contribution"
    
    # Payout permissions
    CREATE_PAYOUT = "create_payout"
    VIEW_PAYOUT = "view_payout"
    CONFIRM_PAYOUT = "confirm_payout"
    
    # User permissions
    MANAGE_USERS = "manage_users"
    VIEW_USERS = "view_users"
    
    # System permissions
    VIEW_AUDIT_LOGS = "view_audit_logs"
    MANAGE_ROLES = "manage_roles"
    SYSTEM_ADMIN = "system_admin"

class Roles:
    # System roles
    MEMBER = "member"
    GROUP_ADMIN = "group_admin"
    SYS_ADMIN = "sys_admin"
    AUDITOR = "auditor"

# Example usage in FastAPI routes
"""
from fastapi import APIRouter, Depends
from .auth.permissions import require_permission_dep, require_role_dep, Permissions, Roles

router = APIRouter()

@router.post("/groups")
async def create_group(
    user = Depends(require_permission_dep(Permissions.CREATE_GROUP))
):
    # Only users with create_group permission can create groups
    pass

@router.get("/groups/{group_id}")
async def get_group(
    group_id: str,
    user = Depends(require_permission_dep(Permissions.VIEW_GROUP, "group_id"))
):
    # Only users with view_group permission for this specific group can view it
    pass

@router.post("/groups/{group_id}/close")
async def close_group(
    group_id: str,
    user = Depends(require_role_dep(Roles.GROUP_ADMIN, "group_id"))
):
    # Only group admins can close groups
    pass
"""

if __name__ == "__main__":
    # Test RBAC functionality
    print("✅ RBAC system initialized")
    print("Available permissions:", [attr for attr in dir(Permissions) if not attr.startswith('_')])
    print("Available roles:", [attr for attr in dir(Roles) if not attr.startswith('_')])
