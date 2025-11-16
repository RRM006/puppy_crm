"""
Test script to verify Twilio connection and credentials
Run: python manage.py shell < test_twilio_connection.py
Or: python test_twilio_connection.py
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.conf import settings
from twilio.rest import Client
from twilio.base.exceptions import TwilioException

def test_twilio_connection():
    """Test Twilio connection with credentials from settings"""
    print("=" * 60)
    print("Testing Twilio Connection")
    print("=" * 60)
    
    # Check if credentials are set
    account_sid = settings.TWILIO_ACCOUNT_SID
    auth_token = settings.TWILIO_AUTH_TOKEN
    
    if not account_sid or not auth_token:
        print("[ERROR] Twilio credentials not configured!")
        print("   Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env")
        return False
    
    print(f"[OK] Account SID: {account_sid[:10]}...")
    print(f"[OK] Auth Token: {'*' * 20} (hidden)")
    print()
    
    try:
        # Initialize Twilio client
        print("Attempting to connect to Twilio...")
        client = Client(account_sid, auth_token)
        
        # Fetch account details (this validates credentials)
        account = client.api.accounts(account_sid).fetch()
        
        print("[SUCCESS] Connected to Twilio!")
        print(f"   Account Name: {account.friendly_name}")
        print(f"   Account Status: {account.status}")
        print(f"   Account Type: {account.type}")
        print()
        
        # Test: Get available phone numbers (if any)
        print("Checking phone numbers...")
        phone_numbers = client.incoming_phone_numbers.list(limit=5)
        
        if phone_numbers:
            print(f"[OK] Found {len(phone_numbers)} phone number(s):")
            for number in phone_numbers:
                print(f"   - {number.phone_number} (SID: {number.sid})")
        else:
            print("   No phone numbers found. You can purchase one via the API.")
        
        print()
        print("=" * 60)
        print("[SUCCESS] Twilio connection test PASSED!")
        print("=" * 60)
        return True
        
    except TwilioException as e:
        print(f"[ERROR] Twilio API error: {e}")
        print()
        print("Common issues:")
        print("  1. Invalid Account SID or Auth Token")
        print("  2. Account suspended or inactive")
        print("  3. Network connectivity issues")
        return False
    except Exception as e:
        print(f"[ERROR] Unexpected error: {e}")
        return False


def test_twilio_service():
    """Test our Twilio service functions"""
    print()
    print("=" * 60)
    print("Testing Twilio Service Functions")
    print("=" * 60)
    
    try:
        from apps.calls.services.twilio_service import initialize_twilio_client
        
        print("Testing initialize_twilio_client()...")
        client = initialize_twilio_client()
        
        if client:
            print("[SUCCESS] Twilio service initialized successfully!")
            return True
        else:
            print("[ERROR] Failed to initialize Twilio service")
            return False
            
    except Exception as e:
        print(f"[ERROR] {e}")
        return False


if __name__ == '__main__':
    print()
    success1 = test_twilio_connection()
    success2 = test_twilio_service()
    
    print()
    if success1 and success2:
        print("[SUCCESS] All tests passed! Twilio is ready to use.")
        sys.exit(0)
    else:
        print("[ERROR] Some tests failed. Please check your configuration.")
        sys.exit(1)

