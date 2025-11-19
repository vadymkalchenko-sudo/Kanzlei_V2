import os
import django
import sys
import time
import requests

# Setup Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token

User = get_user_model()

BASE_URL = "http://localhost:8000/api"

def setup_auth():
    print("Setting up authentication...")
    username = "e2e_tester"
    password = "secure_password_123"
    email = "tester@kanzlei.de"
    
    try:
        user = User.objects.get(username=username)
        print(f"User {username} already exists.")
    except User.DoesNotExist:
        user = User.objects.create_superuser(username=username, email=email, password=password)
        print(f"Created superuser {username}.")
    
    token, created = Token.objects.get_or_create(user=user)
    print(f"Token: {token.key}")
    return token.key

def wait_for_backend(headers):
    print("Waiting for backend to be ready...")
    for i in range(30):
        try:
            response = requests.get(f"{BASE_URL}/akten/", headers=headers)
            if response.status_code == 200:
                print("Backend is ready!")
                return
            elif response.status_code == 403:
                print("Backend reachable but 403 (Auth issue?). Retrying...")
            else:
                print(f"Backend status: {response.status_code}")
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(1)
    print("Backend did not become ready in time.")
    sys.exit(1)

def test_conflict_check(headers):
    print("\n--- Testing Conflict Check ---")
    
    # 1. Create Opponent (Gegner)
    gegner_data = {"name": "Böse GmbH", "typ": "Firma"}
    resp = requests.post(f"{BASE_URL}/gegner/", json=gegner_data, headers=headers)
    if resp.status_code != 201:
        print(f"Failed to create Gegner: {resp.text}")
        return False
    gegner_id = resp.json()["id"]
    print(f"Created Gegner 'Böse GmbH' (ID: {gegner_id})")

    # 2. Create Client (Mandant) - Dummy
    mandant_data = {"name": "Unschuldiger Kunde", "typ": "Person"}
    resp = requests.post(f"{BASE_URL}/mandanten/", json=mandant_data, headers=headers)
    mandant_id = resp.json()["id"]

    # 3. Create File (Akte) with Gegner
    akte_data = {
        "aktenzeichen": f"TEST-KONFLIKT-{int(time.time())}",
        "mandant": mandant_id,
        "gegner": gegner_id,
        "status": "Offen"
    }
    resp = requests.post(f"{BASE_URL}/akten/", json=akte_data, headers=headers)
    if resp.status_code != 201:
        print(f"Failed to create Akte: {resp.text}")
        return False
    print("Created Akte with 'Böse GmbH' as Opponent.")

    # 4. Try to create new Akte with "Böse GmbH" as Client (Mandant)
    print("Testing conflict detection...")
    
    mandant_conflict_data = {"name": "Böse GmbH", "typ": "Firma"}
    resp = requests.post(f"{BASE_URL}/mandanten/", json=mandant_conflict_data, headers=headers)
    mandant_conflict_id = resp.json()["id"]
    print(f"Created Mandant 'Böse GmbH' (ID: {mandant_conflict_id})")
    
    akte_conflict_data = {
        "aktenzeichen": f"TEST-KONFLIKT-CHECK-{int(time.time())}",
        "mandant": mandant_conflict_id,
        "gegner": gegner_id, # Using the same opponent just to fill the field
        "status": "Offen"
    }
    
    resp = requests.post(f"{BASE_URL}/akten/", json=akte_conflict_data, headers=headers)
    
    # NOTE: As discovered in code analysis, the check relies on ID matching (gegner_id=mandant.id).
    # This is likely a bug in the backend logic, but we are verifying CURRENT behavior.
    # If the test fails to detect conflict (because IDs differ), we will log it.
    
    if resp.status_code == 400 and "konflikt" in resp.text.lower():
        print("SUCCESS: Conflict detected!")
        return True
    else:
        print(f"FAILURE: Conflict NOT detected. Status: {resp.status_code}, Response: {resp.text}")
        print(f"Debug: Mandant ID {mandant_conflict_id} vs Gegner ID {gegner_id}")
        print("NOTE: This confirms the suspicion that conflict check relies on ID equality, not Name equality.")
        # We return True here if we want to acknowledge the current state, but strictly it's a failure of the business requirement.
        # Let's return False to highlight the issue.
        return False

def test_history_logic(headers):
    print("\n--- Testing History Logic ---")
    
    # 1. Create Mandant
    mandant_data = {
        "name": "Hans Historie", 
        "adresse": "Altstraße 1", 
        "typ": "Person",
        "email": "hans@old.com"
    }
    resp = requests.post(f"{BASE_URL}/mandanten/", json=mandant_data, headers=headers)
    mandant_id = resp.json()["id"]
    
    # 2. Create Gegner
    gegner_data = {"name": "Greta Gestern", "typ": "Person"}
    resp = requests.post(f"{BASE_URL}/gegner/", json=gegner_data, headers=headers)
    gegner_id = resp.json()["id"]
    
    # 3. Create Akte
    akte_data = {
        "aktenzeichen": f"TEST-HISTORIE-{int(time.time())}",
        "mandant": mandant_id,
        "gegner": gegner_id,
        "status": "Offen"
    }
    resp = requests.post(f"{BASE_URL}/akten/", json=akte_data, headers=headers)
    akte_id = resp.json()["id"]
    print(f"Created Akte (ID: {akte_id})")
    
    # 4. Update Mandant
    new_address = "Neustraße 99"
    requests.patch(f"{BASE_URL}/mandanten/{mandant_id}/", json={"adresse": new_address}, headers=headers)
    print(f"Updated Mandant address to '{new_address}'")
    
    # 5. Close Akte
    print("Closing Akte...")
    resp = requests.post(f"{BASE_URL}/akten/{akte_id}/schliessen/", headers=headers)
    if resp.status_code != 200:
        print(f"Failed to close Akte: {resp.text}")
        return False
        
    # 6. Verify History
    resp = requests.get(f"{BASE_URL}/akten/{akte_id}/", headers=headers)
    data = resp.json()
    
    mandant_historie = data.get("mandant_historie", {})
    
    if mandant_historie.get("adresse") == new_address:
        print("History captured current state correctly.")
    else:
        print(f"History mismatch! Expected '{new_address}', got '{mandant_historie.get('adresse')}'")
        return False

    # Now change Mandant again
    future_address = "Zukunftsstraße 2000"
    requests.patch(f"{BASE_URL}/mandanten/{mandant_id}/", json={"adresse": future_address}, headers=headers)
    print(f"Updated Mandant address to '{future_address}' (after closing)")
    
    # Fetch Akte again
    resp = requests.get(f"{BASE_URL}/akten/{akte_id}/", headers=headers)
    data = resp.json()
    frozen_address = data["mandant_historie"]["adresse"]
    
    if frozen_address == new_address:
        print("SUCCESS: History preserved original data despite master data update.")
        return True
    else:
        print(f"FAILURE: History was overwritten! Got '{frozen_address}'")
        return False

if __name__ == "__main__":
    token = setup_auth()
    headers = {"Authorization": f"Token {token}"}
    
    wait_for_backend(headers)
    conflict_success = test_conflict_check(headers)
    history_success = test_history_logic(headers)
    
    if conflict_success and history_success:
        print("\nALL TESTS PASSED")
        sys.exit(0)
    else:
        print("\nSOME TESTS FAILED")
        sys.exit(1)
