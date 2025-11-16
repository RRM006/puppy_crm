import requests
import sys

print("Testing server connection...")
try:
    response = requests.get("http://127.0.0.1:8000/api/health/", timeout=2)
    print(f"✅ Server responded: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {response.json()}")
    else:
        print(f"Error: {response.text[:200]}")
except requests.exceptions.ConnectionError:
    print("❌ Cannot connect to server at http://127.0.0.1:8000")
    print("Make sure Django server is running: python manage.py runserver")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
