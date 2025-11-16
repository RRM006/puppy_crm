# Activity API Test Script
# Run while server is running: python test_activity_apis.py

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

print("=" * 60)
print("PUPPY CRM - Activity API Tests")
print("=" * 60)

# Helper to auth/login or register quickly

def login_company(email="ceo@testcompany.com", password="SecurePass123!"):
    r = requests.post(f"{BASE_URL}/auth/login/", json={"email": email, "password": password})
    if r.status_code == 200:
        return r.json()["tokens"]["access"], r.json()["user"]["id"]
    raise SystemExit(f"Login failed: {r.status_code} {r.text}")

access, user_id = login_company()
headers = {"Authorization": f"Bearer {access}", "Content-Type": "application/json"}

# 1) Get pipelines to pick one
r = requests.get(f"{BASE_URL}/pipelines/", headers=headers)
print("Pipelines:", r.status_code)
print(r.json())
pipe = r.json()[0]

# 2) Create a deal to attach activities (if none exist)
create_deal_payload = {
    "pipeline_id": pipe["id"],
    "title": "API Activity Deal",
    "value": 1000,
    "currency": "USD",
    "company_name": "Activity Co",
    "contact_name": "Amy Activity",
    "contact_email": "amy@example.com",
    "priority": "medium"
}
r = requests.post(f"{BASE_URL}/deals/", headers=headers, data=json.dumps(create_deal_payload))
print("Create deal:", r.status_code)
print(r.json())

deal_id = r.json()["id"] if r.status_code in (200,201) else None

# 3) Create an activity on the deal
activity_payload = {
    "deal_id": deal_id,
    "activity_type": "call",
    "subject": "Kickoff Call",
    "description": "Discussed scope",
    "scheduled_at": (datetime.utcnow() + timedelta(days=1)).isoformat() + "Z"
}
r = requests.post(f"{BASE_URL}/activities/", headers=headers, data=json.dumps(activity_payload))
print("Create activity:", r.status_code)
print(r.json())
activity_id = r.json().get("id") if r.status_code in (200,201) else None

# 4) List activities filtered by deal
r = requests.get(f"{BASE_URL}/activities/?deal={deal_id}", headers=headers)
print("List activities by deal:", r.status_code)
print(json.dumps(r.json(), indent=2))

# 5) Mark activity complete
if activity_id:
    r = requests.post(f"{BASE_URL}/activities/{activity_id}/complete/", headers=headers)
    print("Mark complete:", r.status_code, r.json())

# 6) Deal timeline
r = requests.get(f"{BASE_URL}/deals/{deal_id}/activities/", headers=headers)
print("Deal timeline:", r.status_code)
print(json.dumps(r.json(), indent=2))

print("\nDone.")