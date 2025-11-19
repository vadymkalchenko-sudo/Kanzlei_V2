import requests
import time
import sys
import json

BASE_URL = "http://localhost:8000/api"

def wait_for_backend():
    print("Waiting for backend to be ready...")
    for i in range(30):
        try:
            response = requests.get(f"{BASE_URL}/akten/")
            if response.status_code == 200:
                print("Backend is ready!")
                return
        except requests.exceptions.ConnectionError:
            pass
        time.sleep(1)
    print("Backend did not become ready in time.")
    sys.exit(1)

def test_conflict_check():
    print("\n--- Testing Conflict Check ---")
    
    # 1. Create Opponent (Gegner)
    gegner_data = {"name": "Böse GmbH", "typ": "Firma"}
    resp = requests.post(f"{BASE_URL}/gegner/", json=gegner_data)
    if resp.status_code != 201:
        print(f"Failed to create Gegner: {resp.text}")
        return False
    gegner_id = resp.json()["id"]
    print(f"Created Gegner 'Böse GmbH' (ID: {gegner_id})")

    # 2. Create Client (Mandant) - Dummy
    mandant_data = {"name": "Unschuldiger Kunde", "typ": "Person"}
    resp = requests.post(f"{BASE_URL}/mandanten/", json=mandant_data)
    mandant_id = resp.json()["id"]

    # 3. Create File (Akte) with Gegner
    akte_data = {
        "aktenzeichen": f"TEST-KONFLIKT-{int(time.time())}",
        "mandant": mandant_id,
        "gegner": gegner_id,
        "status": "Offen"
    }
    resp = requests.post(f"{BASE_URL}/akten/", json=akte_data)
    if resp.status_code != 201:
        print(f"Failed to create Akte: {resp.text}")
        return False
    print("Created Akte with 'Böse GmbH' as Opponent.")

    # 4. Try to create new Akte with "Böse GmbH" as Client (Mandant)
    # First, we need to create a Mandant entry for "Böse GmbH" (same name/entity concept)
    # In this system, Mandant and Gegner are separate tables, but the check logic 
    # seems to rely on IDs or names? Let's check the code again.
    # The code says: Akte.objects.filter(status="Offen", gegner_id=mandant.id).exists()
    # Wait, this implies `mandant` in the check is the Mandant OBJECT being passed to the new Akte.
    # And it checks if that Mandant ID is already a Gegner in an open Akte.
    # BUT Mandant and Gegner are different models!
    # `gegner_id=mandant.id` would only work if they share IDs or if there's a shared base table?
    # They inherit from ZeitstempelModell, so they have separate IDs.
    # Let's look at `_has_conflict` in `views.py`:
    # `return Akte.objects.filter(status="Offen", gegner_id=mandant.id).exists()`
    # This looks like a BUG or a specific design assumption. 
    # If I create a Mandant, it has ID X. If I create a Gegner, it has ID Y.
    # Even if they represent the same entity "Böse GmbH", they have different IDs in DB.
    # Unless... the user is supposed to "convert" a Gegner to a Mandant?
    # Or maybe the check is flawed? 
    # Let's test the "Name" collision or if the ID logic is indeed the intended one (maybe they share IDs via a hidden mechanism? No, separate tables).
    
    # HYPOTHESIS: The code `gegner_id=mandant.id` is WRONG if Mandant and Gegner are separate tables.
    # It compares Mandant.id with Gegner.id. 
    # This will only trigger a conflict if, by chance, the new Mandant has the same ID as an existing Gegner in an open Akte.
    # This is a CRITICAL FINDING if true.
    
    # Let's try to reproduce exactly what the code does.
    # We need a Mandant with ID = X, and a Gegner with ID = X.
    # If we create them sequentially, they might have different IDs.
    # But let's try to force a conflict by creating a Mandant that happens to have the same ID as the Gegner we just used.
    # This is hard to guarantee.
    
    # Wait, let's re-read `views.py`:
    # `mandant = validated_data.get("mandant")` -> This is a Mandant instance.
    # `Akte.objects.filter(..., gegner_id=mandant.id)`
    # Yes, it checks if there is an open Akte where the `gegner_id` equals the `id` of the Mandant we are trying to use.
    # This confirms the logic relies on ID equality between two different tables.
    # This is almost certainly a BUG unless there is a "Person" table they both link to.
    # `models.py` shows they both inherit `ZeitstempelModell` (abstract). So they are separate tables with separate auto-increment IDs.
    
    # I will write the test to expose this.
    # I will create a Mandant. If its ID matches a Gegner ID in an open Akte, it should fail.
    # If I can't easily force IDs, I will just report this analysis.
    # BUT, let's try to run the test as if it WAS working by name (which would be the correct logic).
    # Or maybe I should try to create a Mandant and see if I can trigger it.
    
    # Actually, let's just run a simple test:
    # Create Gegner (ID=1). Create Akte with Gegner ID=1.
    # Create Mandant (ID=1). (If we reset DB or are lucky).
    # Create Akte with Mandant ID=1. -> Should Fail.
    
    # To be safe, I will just create a Mandant and see what happens.
    
    print("WARNING: The conflict logic seems to compare Mandant ID with Gegner ID directly.")
    print("This might be a bug. Proceeding with test to see behavior.")
    
    mandant_conflict_data = {"name": "Böse GmbH", "typ": "Firma"}
    resp = requests.post(f"{BASE_URL}/mandanten/", json=mandant_conflict_data)
    mandant_conflict_id = resp.json()["id"]
    print(f"Created Mandant 'Böse GmbH' (ID: {mandant_conflict_id})")
    
    akte_conflict_data = {
        "aktenzeichen": f"TEST-KONFLIKT-CHECK-{int(time.time())}",
        "mandant": mandant_conflict_id,
        "gegner": gegner_id, # Using the same opponent just to fill the field
        "status": "Offen"
    }
    
    resp = requests.post(f"{BASE_URL}/akten/", json=akte_conflict_data)
    if resp.status_code == 400 and "konflikt" in resp.text.lower():
        print("SUCCESS: Conflict detected!")
        return True
    else:
        print(f"FAILURE: Conflict NOT detected. Status: {resp.status_code}, Response: {resp.text}")
        print(f"Debug: Mandant ID {mandant_conflict_id} vs Gegner ID {gegner_id}")
        return False

def test_history_logic():
    print("\n--- Testing History Logic ---")
    
    # 1. Create Mandant
    mandant_data = {
        "name": "Hans Historie", 
        "adresse": "Altstraße 1", 
        "typ": "Person",
        "email": "hans@old.com"
    }
    resp = requests.post(f"{BASE_URL}/mandanten/", json=mandant_data)
    mandant_id = resp.json()["id"]
    
    # 2. Create Gegner
    gegner_data = {"name": "Greta Gestern", "typ": "Person"}
    resp = requests.post(f"{BASE_URL}/gegner/", json=gegner_data)
    gegner_id = resp.json()["id"]
    
    # 3. Create Akte
    akte_data = {
        "aktenzeichen": f"TEST-HISTORIE-{int(time.time())}",
        "mandant": mandant_id,
        "gegner": gegner_id,
        "status": "Offen"
    }
    resp = requests.post(f"{BASE_URL}/akten/", json=akte_data)
    akte_id = resp.json()["id"]
    print(f"Created Akte (ID: {akte_id})")
    
    # 4. Update Mandant
    new_address = "Neustraße 99"
    requests.patch(f"{BASE_URL}/mandanten/{mandant_id}/", json={"adresse": new_address})
    print(f"Updated Mandant address to '{new_address}'")
    
    # 5. Close Akte
    print("Closing Akte...")
    resp = requests.post(f"{BASE_URL}/akten/{akte_id}/schliessen/")
    if resp.status_code != 200:
        print(f"Failed to close Akte: {resp.text}")
        return False
        
    # 6. Verify History
    resp = requests.get(f"{BASE_URL}/akten/{akte_id}/")
    data = resp.json()
    
    mandant_historie = data.get("mandant_historie", {})
    
    # The history should contain the address AT THE MOMENT OF CLOSING.
    # Wait, if I updated the address BEFORE closing, the history should reflect the NEW address?
    # "Stammdaten-Historisierung über JSONB beim Akten-Schließen"
    # Usually this means: When closing, we take the CURRENT state of the master data and freeze it.
    # So if I changed it to "Neustraße 99" and THEN closed, the history should show "Neustraße 99".
    # If I change it AFTER closing, the history should stay "Neustraße 99".
    
    # Let's test the "Change AFTER closing" scenario, which is the real value of history.
    
    if mandant_historie.get("adresse") == new_address:
        print("History captured current state correctly.")
    else:
        print(f"History mismatch! Expected '{new_address}', got '{mandant_historie.get('adresse')}'")
        return False

    # Now change Mandant again
    future_address = "Zukunftsstraße 2000"
    requests.patch(f"{BASE_URL}/mandanten/{mandant_id}/", json={"adresse": future_address})
    print(f"Updated Mandant address to '{future_address}' (after closing)")
    
    # Fetch Akte again
    resp = requests.get(f"{BASE_URL}/akten/{akte_id}/")
    data = resp.json()
    frozen_address = data["mandant_historie"]["adresse"]
    
    if frozen_address == new_address:
        print("SUCCESS: History preserved original data despite master data update.")
        return True
    else:
        print(f"FAILURE: History was overwritten! Got '{frozen_address}'")
        return False

if __name__ == "__main__":
    wait_for_backend()
    conflict_success = test_conflict_check()
    history_success = test_history_logic()
    
    if conflict_success and history_success:
        print("\nALL TESTS PASSED")
        sys.exit(0)
    else:
        print("\nSOME TESTS FAILED")
        sys.exit(1)
