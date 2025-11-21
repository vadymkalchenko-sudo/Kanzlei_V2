import os
import django
import sys
from pathlib import Path
from django.core.files.uploadedfile import SimpleUploadedFile

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from aktenverwaltung.models import Akte, Mandant, Gegner, Dokument
from aktenverwaltung.storage import get_akte_directory, store_document

def verify():
    print("Starting verification...")
    
    # 1. Create Mandant/Gegner
    m = Mandant.objects.create(name="Test Mandant Structure", adresse="Musterstr. 1")
    g = Gegner.objects.create(name="Test Gegner Structure", adresse="Gegnerstr. 1")
    
    # 2. Create Akte
    print("Creating Akte...")
    # Ensure unique aktenzeichen
    import random
    suffix = random.randint(1000, 9999)
    aktenzeichen = f"TEST.STRUCT.{suffix}"
    
    akte = Akte.objects.create(
        aktenzeichen=aktenzeichen,
        mandant=m,
        gegner=g
    )
    
    # 3. Check Directory
    directory = get_akte_directory(akte.aktenzeichen)
    print(f"Checking directory: {directory}")
    if directory.exists():
        print("SUCCESS: Directory created.")
    else:
        print("FAILURE: Directory not created.")
        return

    # 4. Upload Document
    print("Uploading document...")
    content = b"Hello World"
    upload = SimpleUploadedFile("test_doc.txt", content)
    
    rel_path = store_document(akte, upload)
    doc = Dokument.objects.create(
        akte=akte,
        titel="Test Doc",
        dateiname="test_doc.txt",
        pfad_auf_server=rel_path
    )
    
    file_path = directory / "test_doc.txt"
    if file_path.exists():
        print("SUCCESS: File created.")
    else:
        print("FAILURE: File not created.")
        return

    # 5. Close Akte (Freeze)
    print("Closing Akte...")
    akte.status = "Geschlossen"
    akte.save() 
    
    # 6. Check JSON files
    stammdaten = directory / "stammdaten.json"
    verlauf = directory / "verlauf.json"
    
    if stammdaten.exists():
        print("SUCCESS: stammdaten.json created.")
    else:
        print("FAILURE: stammdaten.json missing.")
        
    if verlauf.exists():
        print("SUCCESS: verlauf.json created.")
    else:
        print("FAILURE: verlauf.json missing.")

if __name__ == "__main__":
    verify()
