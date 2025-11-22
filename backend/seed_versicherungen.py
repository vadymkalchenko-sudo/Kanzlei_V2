import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from aktenverwaltung.models import Gegner

versicherungen = [
    {
        "name": "Allianz Versicherungs-AG",
        "strasse": "Königinstraße",
        "hausnummer": "28",
        "plz": "80802",
        "stadt": "München",
        "email": "info@allianz.de",
        "telefon": "0800 4100101"
    },
    {
        "name": "HUK-COBURG",
        "strasse": "Bahnhofsplatz",
        "hausnummer": "1",
        "plz": "96444",
        "stadt": "Coburg",
        "email": "info@huk-coburg.de",
        "telefon": "0800 2153153"
    },
    {
        "name": "AXA Konzern AG",
        "strasse": "Colonia-Allee",
        "hausnummer": "10-20",
        "plz": "51067",
        "stadt": "Köln",
        "email": "service@axa.de",
        "telefon": "0800 3203205"
    },
    {
        "name": "R+V Versicherung AG",
        "strasse": "Raiffeisenplatz",
        "hausnummer": "1",
        "plz": "65189",
        "stadt": "Wiesbaden",
        "email": "ruv@ruv.de",
        "telefon": "0800 533-1112"
    },
    {
        "name": "DEVK Versicherungen",
        "strasse": "Riehler Straße",
        "hausnummer": "190",
        "plz": "50735",
        "stadt": "Köln",
        "email": "info@devk.de",
        "telefon": "0800 4-757-757"
    },
    {
        "name": "Generali Deutschland AG",
        "strasse": "Adenauerring",
        "hausnummer": "7",
        "plz": "81737",
        "stadt": "München",
        "email": "service.de@generali.com",
        "telefon": "089 5121-0"
    },
    {
        "name": "Signal Iduna",
        "strasse": "Joseph-Scherer-Straße",
        "hausnummer": "3",
        "plz": "44139",
        "stadt": "Dortmund",
        "email": "info@signal-iduna.de",
        "telefon": "0231 135-0"
    },
    {
        "name": "VHV Allgemeine Versicherung AG",
        "strasse": "VHV-Platz",
        "hausnummer": "1",
        "plz": "30177",
        "stadt": "Hannover",
        "email": "info@vhv.de",
        "telefon": "0511 907-0"
    },
    {
        "name": "LVM Versicherung",
        "strasse": "Kolde-Ring",
        "hausnummer": "21",
        "plz": "48151",
        "stadt": "Münster",
        "email": "info@lvm.de",
        "telefon": "0251 702-0"
    },
    {
        "name": "Gothaer Versicherungsbank VVaG",
        "strasse": "Gothaer Allee",
        "hausnummer": "1",
        "plz": "50969",
        "stadt": "Köln",
        "email": "info@gothaer.de",
        "telefon": "0221 308-00"
    }
]

def seed():
    print("Seeding KFZ-Versicherungen...")
    count = 0
    for data in versicherungen:
        obj, created = Gegner.objects.get_or_create(
            name=data["name"],
            defaults={
                "strasse": data["strasse"],
                "hausnummer": data["hausnummer"],
                "plz": data["plz"],
                "stadt": data["stadt"],
                "land": "Deutschland",
                "email": data["email"],
                "telefon": data["telefon"],
                "typ": "Versicherung"
            }
        )
        if created:
            print(f"Created: {obj.name}")
            count += 1
        else:
            print(f"Already exists: {obj.name}")
    
    print(f"Seeding complete. {count} new entries created.")

if __name__ == "__main__":
    seed()
