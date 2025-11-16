# Deal API Test Script
# Run after starting Django server: python test_deal_apis.py

import requests
import json

BASE_URL = "http://localhost:8000/api"

print("=" * 60)
print("PUPPY CRM - Deal API Tests")
print("=" * 60)

# 1) Register a company user (CEO) to auto-create default pipeline
print("\n1. Registering Company User (CEO)...")
company_data = {
    "email": "ceo+dealtests@testcompany.com",
    "password": "SecurePass123!",
    "password2": "SecurePass123!",
    "first_name": "Ceo",
    "last_name": "Deals",
    "company_name": "Deals Test LLC",
    "phone": "+1234567890",
    "employee_count": 10
}
resp = requests.post(f"{BASE_URL}/auth/register/company/", json=company_data)
print(f"Status: {resp.status_code}")
print(json.dumps(resp.json(), indent=2))
assert resp.status_code in (200, 201), "Company registration failed"
access_token = resp.json()["tokens"]["access"]
headers = {"Authorization": f"Bearer {access_token}"}

# 2) List pipelines and pick default
print("\n2. Fetching pipelines...")
resp = requests.get(f"{BASE_URL}/pipelines/", headers=headers)
print(f"Status: {resp.status_code}")
print(json.dumps(resp.json(), indent=2))
assert resp.status_code == 200, "Failed to get pipelines"
pipelines = resp.json()
assert len(pipelines) >= 1, "No pipeline found"
pipeline = None
for p in pipelines:
    if p.get("is_default"):
        pipeline = p
        break
pipeline = pipeline or pipelines[0]
print(f"Using pipeline: {pipeline['name']} (id={pipeline['id']})")

# 3) Create a deal in first stage
print("\n3. Creating a deal...")
create_payload = {
    "pipeline_id": pipeline["id"],
    "title": "Enterprise Subscription",
    "value": 25000,
    "currency": "USD",
    "company_name": "Acme Corp",
    "contact_name": "Alice Brown",
    "contact_email": "alice@example.com",
    "priority": "high"
}
resp = requests.post(f"{BASE_URL}/deals/", headers=headers, json=create_payload)
print(f"Status: {resp.status_code}")
print(json.dumps(resp.json(), indent=2))
assert resp.status_code in (200, 201), "Failed to create deal"
deal_id = resp.json().get("id") or resp.json().get("deal", {}).get("id")
if not deal_id:
    # fallback: fetch list and pick last
    list_resp = requests.get(f"{BASE_URL}/deals/", headers=headers)
    deal_id = list_resp.json()[0]["id"]
print(f"Deal created id={deal_id}")

# 4) List deals with filters
print("\n4. Listing deals...")
resp = requests.get(f"{BASE_URL}/deals/?pipeline={pipeline['id']}", headers=headers)
print(f"Status: {resp.status_code}")
print(json.dumps(resp.json(), indent=2))
assert resp.status_code == 200, "Failed to list deals"

# 5) Move deal to next stage (if exists)
print("\n5. Moving deal stage...")
stages = pipeline.get("stages", [])
stage_ids = [s["id"] for s in stages]
move_target = stage_ids[1] if len(stage_ids) > 1 else stage_ids[0]
resp = requests.post(f"{BASE_URL}/deals/{deal_id}/move-stage/", headers=headers, json={"stage_id": move_target})
print(f"Status: {resp.status_code}")
print(resp.json())
assert resp.status_code == 200, "Failed to move stage"

# 6) Close deal as won
print("\n6. Closing deal as won...")
resp = requests.post(f"{BASE_URL}/deals/{deal_id}/close/", headers=headers, json={"status":"won"})
print(f"Status: {resp.status_code}")
print(resp.json())
assert resp.status_code == 200, "Failed to close deal"

# 7) Fetch stats
print("\n7. Fetching deal stats...")
resp = requests.get(f"{BASE_URL}/deals/stats/", headers=headers)
print(f"Status: {resp.status_code}")
print(json.dumps(resp.json(), indent=2))
assert resp.status_code == 200, "Failed to get deal stats"

# 8) Kanban grouping
print("\n8. Fetching deals by stage (Kanban)...")
resp = requests.get(f"{BASE_URL}/deals/by-stage/?pipeline_id={pipeline['id']}", headers=headers)
print(f"Status: {resp.status_code}")
print(json.dumps(resp.json(), indent=2))
assert resp.status_code == 200, "Failed to get deals by stage"

print("\n" + "=" * 60)
print("Deal API Tests Completed!")
print("=" * 60)
