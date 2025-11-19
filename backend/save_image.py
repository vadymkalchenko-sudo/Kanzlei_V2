import os
import django
from django.core.files import File
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from aktenverwaltung.models import Akte, Dokument
from aktenverwaltung.storage import store_document

def upload_image():
    try:
        import shutil
        akte = Akte.objects.first()
        if not akte:
            print("Keine Akte gefunden.")
            return

        file_path = '/app/test_image.png'
        if not os.path.exists(file_path):
            print(f"Datei nicht gefunden: {file_path}")
            return

        print(f"Speichere Bild für Akte {akte.aktenzeichen}...")
        
        filename = "LLM_Settings.png"
        save_dir = os.path.join(settings.MEDIA_ROOT, 'akten', str(akte.id))
        os.makedirs(save_dir, exist_ok=True)
        
        dest_path = os.path.join(save_dir, filename)
        print(f"Kopiere von {file_path} nach {dest_path}")
        shutil.copy(file_path, dest_path)
        
        # Create DB Entry
        relative_path = os.path.join('akten', str(akte.id), filename)
        doc = Dokument.objects.create(
            akte=akte,
            titel="LLM Settings Screenshot",
            dateiname=filename,
            pfad_auf_server=relative_path
        )
        print(f"Dokument erstellt: {doc}")

    except Exception as e:
        print(f"Fehler: {e}")

if __name__ == "__main__":
    upload_image()
