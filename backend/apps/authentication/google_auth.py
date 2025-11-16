"""
Google OAuth Authentication Utilities

This module provides functions for verifying Google OAuth tokens
and managing user authentication with Google Sign-In.
"""

from google.oauth2 import id_token
from google.auth.transport import requests
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


def verify_google_token(token):
    """
    Verify Google OAuth token and return user info.
    
    Args:
        token (str): Google OAuth ID token from frontend
        
    Returns:
        dict: User info from Google containing email, name, etc.
        None: If token is invalid
        
    Example return:
        {
            'iss': 'https://accounts.google.com',
            'sub': '1234567890',
            'email': 'user@gmail.com',
            'email_verified': True,
            'name': 'John Doe',
            'given_name': 'John',
            'family_name': 'Doe',
            'picture': 'https://...'
        }
    """
    try:
        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token,
            requests.Request(),
            settings.GOOGLE_CLIENT_ID
        )
        
        # Verify the issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            return None
            
        # Check if email is verified
        if not idinfo.get('email_verified', False):
            return None
            
        return idinfo
        
    except ValueError as e:
        # Token is invalid
        print(f"Google token verification failed: {e}")
        return None


def get_user_info_from_google(google_data):
    """
    Extract user information from Google OAuth response.
    
    Args:
        google_data (dict): Verified Google token data
        
    Returns:
        dict: Formatted user information
        
    Example return:
        {
            'email': 'user@gmail.com',
            'first_name': 'John',
            'last_name': 'Doe',
            'google_id': '1234567890',
            'picture': 'https://...'
        }
    """
    return {
        'email': google_data.get('email', ''),
        'first_name': google_data.get('given_name', ''),
        'last_name': google_data.get('family_name', ''),
        'google_id': google_data.get('sub', ''),
        'picture': google_data.get('picture', ''),
    }


def get_or_create_google_user(google_data, account_type='customer', **extra_data):
    """
    Get existing user or create new user from Google OAuth data.
    
    Args:
        google_data (dict): Verified Google token data
        account_type (str): 'company' or 'customer'
        **extra_data: Additional data (company_name, phone, employee_count, address, etc.)
        
    Returns:
        tuple: (user, created) - User instance and boolean indicating if created
        
    Raises:
        ValueError: If required fields are missing
    """
    user_info = get_user_info_from_google(google_data)
    email = user_info['email']
    
    if not email:
        raise ValueError("Email not provided by Google")
    
    # Check if user already exists
    try:
        user = User.objects.get(email=email)
        return user, False
    except User.DoesNotExist:
        # Create new user
        user = User.objects.create_user(
            email=email,
            username=email,  # Use email as username
            first_name=user_info['first_name'],
            last_name=user_info['last_name'],
            account_type=account_type,
            is_verified=True,  # Email verified by Google
            phone=extra_data.get('phone', '')
        )
        
        # Set unusable password since user authenticates via Google
        user.set_unusable_password()
        user.save()
        
        return user, True
