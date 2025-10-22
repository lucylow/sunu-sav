#!/usr/bin/env python3
"""
Macaroon file permission check script for LND
Ensures Lightning Network macaroon files have correct permissions (600)
"""

import os
import stat
import sys
import argparse
from pathlib import Path

def check_macaroon_permissions(file_path: str, expected_permissions: int = 0o600) -> bool:
    """
    Check if macaroon file has correct permissions
    
    Args:
        file_path: Path to macaroon file
        expected_permissions: Expected permissions (default: 0o600)
        
    Returns:
        True if permissions are correct, False otherwise
    """
    try:
        # Check if file exists
        if not os.path.exists(file_path):
            print(f"❌ Macaroon file not found: {file_path}")
            return False
            
        # Get file stats
        file_stat = os.stat(file_path)
        current_permissions = stat.S_IMODE(file_stat.st_mode)
        
        # Check permissions
        if current_permissions == expected_permissions:
            print(f"✅ {file_path} permissions OK ({oct(current_permissions)})")
            return True
        else:
            print(f"❌ {file_path} incorrect permissions: {oct(current_permissions)} - expected {oct(expected_permissions)}")
            return False
            
    except PermissionError:
        print(f"❌ Permission denied accessing {file_path}")
        return False
    except Exception as e:
        print(f"❌ Error checking {file_path}: {e}")
        return False

def fix_macaroon_permissions(file_path: str, permissions: int = 0o600) -> bool:
    """
    Fix macaroon file permissions
    
    Args:
        file_path: Path to macaroon file
        permissions: Desired permissions (default: 0o600)
        
    Returns:
        True if permissions were fixed, False otherwise
    """
    try:
        os.chmod(file_path, permissions)
        print(f"✅ Fixed permissions for {file_path} to {oct(permissions)}")
        return True
    except PermissionError:
        print(f"❌ Permission denied fixing {file_path}")
        return False
    except Exception as e:
        print(f"❌ Error fixing {file_path}: {e}")
        return False

def check_directory_permissions(dir_path: str) -> bool:
    """
    Check if directory has secure permissions
    
    Args:
        dir_path: Path to directory
        
    Returns:
        True if directory permissions are secure, False otherwise
    """
    try:
        if not os.path.exists(dir_path):
            print(f"❌ Directory not found: {dir_path}")
            return False
            
        dir_stat = os.stat(dir_path)
        current_permissions = stat.S_IMODE(dir_stat.st_mode)
        
        # Directory should be readable and executable by owner only (0o700)
        expected_permissions = 0o700
        
        if current_permissions == expected_permissions:
            print(f"✅ {dir_path} directory permissions OK ({oct(current_permissions)})")
            return True
        else:
            print(f"⚠️  {dir_path} directory permissions: {oct(current_permissions)} - consider {oct(expected_permissions)}")
            return True  # Not critical for directories
            
    except Exception as e:
        print(f"❌ Error checking directory {dir_path}: {e}")
        return False

def find_macaroon_files(base_path: str) -> list:
    """
    Find all macaroon files in a directory
    
    Args:
        base_path: Base directory to search
        
    Returns:
        List of macaroon file paths
    """
    macaroon_files = []
    
    try:
        base_path = Path(base_path)
        
        # Look for common macaroon file patterns
        patterns = [
            "*.macaroon",
            "admin.macaroon",
            "readonly.macaroon",
            "invoice.macaroon"
        ]
        
        for pattern in patterns:
            macaroon_files.extend(base_path.glob(pattern))
            
        # Also check subdirectories
        for subdir in base_path.iterdir():
            if subdir.is_dir():
                for pattern in patterns:
                    macaroon_files.extend(subdir.glob(pattern))
                    
    except Exception as e:
        print(f"❌ Error searching for macaroon files: {e}")
        
    return [str(f) for f in macaroon_files]

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Check and fix macaroon file permissions")
    parser.add_argument("--file", "-f", help="Specific macaroon file to check")
    parser.add_argument("--directory", "-d", help="Directory to search for macaroon files")
    parser.add_argument("--fix", action="store_true", help="Fix incorrect permissions")
    parser.add_argument("--permissions", "-p", type=lambda x: int(x, 8), default=0o600,
                       help="Expected permissions in octal (default: 600)")
    
    args = parser.parse_args()
    
    # Get file path from environment or arguments
    if args.file:
        file_path = args.file
    elif args.directory:
        macaroon_files = find_macaroon_files(args.directory)
        if not macaroon_files:
            print(f"❌ No macaroon files found in {args.directory}")
            sys.exit(1)
        file_paths = macaroon_files
    else:
        # Try environment variable
        file_path = os.environ.get("LND_MACAROON_PATH")
        if not file_path:
            # Default LND paths
            default_paths = [
                "/root/.lnd/data/chain/bitcoin/mainnet/admin.macaroon",
                "/home/lnd/.lnd/data/chain/bitcoin/mainnet/admin.macaroon",
                "./admin.macaroon"
            ]
            
            for path in default_paths:
                if os.path.exists(path):
                    file_path = path
                    break
                    
            if not file_path:
                print("❌ No macaroon file specified and none found in default locations")
                print("Usage: python check_macaroon_permissions.py --file /path/to/macaroon")
                sys.exit(1)
        file_paths = [file_path]
    
    # Check permissions
    all_good = True
    
    for file_path in file_paths:
        if not check_macaroon_permissions(file_path, args.permissions):
            all_good = False
            
            if args.fix:
                if not fix_macaroon_permissions(file_path, args.permissions):
                    all_good = False
                    
        # Also check directory permissions
        dir_path = os.path.dirname(file_path)
        check_directory_permissions(dir_path)
    
    # Exit with appropriate code
    if all_good:
        print("✅ All macaroon permissions are correct")
        sys.exit(0)
    else:
        print("❌ Some macaroon permissions are incorrect")
        if not args.fix:
            print("💡 Use --fix to automatically fix permissions")
        sys.exit(1)

if __name__ == "__main__":
    main()
