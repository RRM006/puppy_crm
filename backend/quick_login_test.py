"""Quick login test"""
import requests
import json

r = requests.post(
    'http://127.0.0.1:8000/api/auth/login/',
    json={'email': 'testceo@example.com', 'password': 'TestPass123!'}
)

print(f"Status: {r.status_code}")
print(f"Response:")
print(json.dumps(r.json(), indent=2))
