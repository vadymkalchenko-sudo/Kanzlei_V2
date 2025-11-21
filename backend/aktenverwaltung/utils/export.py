import json
import os
from pathlib import Path
from django.core.serializers.json import DjangoJSONEncoder
from ..storage import get_akte_directory

def export_stammdaten(akte):
    """
    Exportiert die Stammdaten der Akte in eine JSON-Datei im Aktenordner.
    """
    data = {
        "aktenzeichen": akte.aktenzeichen,
        "anlagedatum": akte.erstellt_am,
        "status": akte.status,
        "mandant": {
            "name": akte.mandant.name,
            "adresse": akte.mandant.adresse,
            "email": akte.mandant.email,
            "telefon": akte.mandant.telefon,
            "typ": akte.mandant.typ
        } if akte.mandant else None,
        "gegner": {
            "name": akte.gegner.name,
            "adresse": akte.gegner.adresse,
            "email": akte.gegner.email,
            "telefon": akte.gegner.telefon,
            "typ": akte.gegner.typ
        } if akte.gegner else None,
        "zusatzinfo": akte.info_zusatz
    }
    
    directory = get_akte_directory(akte.aktenzeichen)
    filepath = directory / "stammdaten.json"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, cls=DjangoJSONEncoder, indent=4, ensure_ascii=False)
    
    try:
        os.chmod(filepath, 0o664)
    except Exception:
        pass

def export_verlauf(akte):
    """
    Exportiert den Verlauf (Aufgaben, Fristen, Notizen) in eine JSON-Datei.
    """
    # Fetch organizer data
    # Note: We use values() to get dictionaries, handling relations might need more care if complex
    aufgaben = list(akte.aufgaben.values())
    fristen = list(akte.fristen.values())
    notizen = list(akte.notizen.values())
    
    data = {
        "aufgaben": aufgaben,
        "fristen": fristen,
        "notizen": notizen
    }
    
    directory = get_akte_directory(akte.aktenzeichen)
    filepath = directory / "verlauf.json"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, cls=DjangoJSONEncoder, indent=4, ensure_ascii=False)

    try:
        os.chmod(filepath, 0o664)
    except Exception:
        pass
