import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from aktenverwaltung.models import Akte, Dokument
from aktenverwaltung.serializers import AkteSerializer
from organizer.models import Frist
from organizer.serializers import FristSerializer
from rest_framework.renderers import JSONRenderer

def test_akte_serialization():
    print("--- Testing Akte Serialization ---")
    try:
        akte = Akte.objects.get(id=5)
    except Akte.DoesNotExist:
        print("Akte 5 not found!")
        return

    print(f"Akte: {akte.aktenzeichen}")
    
    # Ensure we have a document
    if not akte.dokumente.exists():
        print("Creating test document...")
        Dokument.objects.create(akte=akte, titel="Debug Doc", dateiname="debug.pdf", pfad_auf_server="debug.pdf")
    
    serializer = AkteSerializer(akte)
    data = serializer.data
    print(f"Keys in serializer data: {data.keys()}")
    if 'dokumente' in data:
        print(f"Dokumente found: {len(data['dokumente'])}")
        print(data['dokumente'])
    else:
        print("ERROR: 'dokumente' key MISSING in serializer output!")

def test_frist_creation():
    print("\n--- Testing Frist Creation ---")
    akten = Akte.objects.all()
    if not akten.exists():
        return
    akte = akten.first()
    
    data = {
        "akte": akte.id,
        "bezeichnung": "Debug Frist",
        "frist_datum": "2025-12-31",
        "prioritaet": "mittel",
        "erledigt": False
    }
    
    serializer = FristSerializer(data=data)
    if serializer.is_valid():
        print("FristSerializer is VALID.")
        # Don't save to avoid clutter, just check validation
    else:
        print(f"FristSerializer ERRORS: {serializer.errors}")

if __name__ == "__main__":
    test_akte_serialization()
    test_frist_creation()
