import os
import django
import sys
from datetime import date, timedelta

# Setup Django environment
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from aktenverwaltung.models import Akte
from organizer.models import Frist

def create_test_frist():
    akte = Akte.objects.first()
    if not akte:
        print("Keine Akte gefunden. Bitte erst eine Akte erstellen.")
        return

    frist = Frist.objects.create(
        akte=akte,
        bezeichnung="Test Frist für Browser Verifikation",
        frist_datum=date.today() + timedelta(days=2),
        prioritaet="hoch",
        erledigt=False
    )
    print(f"Frist erstellt: {frist.bezeichnung} (ID: {frist.id}) für Akte {akte.aktenzeichen}")

if __name__ == "__main__":
    create_test_frist()
