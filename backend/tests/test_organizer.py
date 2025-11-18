import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from aktenverwaltung.models import Akte, Gegner, Mandant
from organizer.models import Aufgabe, Frist
from security.models import Profile


@pytest.mark.django_db
def test_aufgabe_default_status():
    mandant = Mandant.objects.create(name="Mandant")
    gegner = Gegner.objects.create(name="Gegner")
    akte = Akte.objects.create(aktenzeichen="VR-ORG-1", mandant=mandant, gegner=gegner)

    aufgabe = Aufgabe.objects.create(akte=akte, titel="Unterlagen prüfen")

    assert aufgabe.status == "offen"


@pytest.mark.django_db
def test_frist_ordering():
    mandant = Mandant.objects.create(name="Mandant")
    gegner = Gegner.objects.create(name="Gegner")
    akte = Akte.objects.create(aktenzeichen="VR-ORG-2", mandant=mandant, gegner=gegner)

    frist_b = Frist.objects.create(
        akte=akte, bezeichnung="Frist B", frist_datum="2025-12-01", prioritaet="hoch"
    )
    frist_a = Frist.objects.create(
        akte=akte, bezeichnung="Frist A", frist_datum="2025-11-01", prioritaet="mittel"
    )

    fristen = list(Frist.objects.filter(akte=akte))
    assert fristen == [frist_a, frist_b]


@pytest.mark.django_db
def test_dashboard_priorisiert_fristen():
    today = timezone.now().date()
    mandant = Mandant.objects.create(name="Mandant")
    gegner = Gegner.objects.create(name="Gegner")
    akte = Akte.objects.create(aktenzeichen="VR-ORG-3", mandant=mandant, gegner=gegner)

    Frist.objects.create(
        akte=akte, bezeichnung="Späte niedrige Frist", frist_datum=today, prioritaet="niedrig"
    )
    Frist.objects.create(
        akte=akte, bezeichnung="Früh & hoch", frist_datum=today, prioritaet="hoch"
    )
    Aufgabe.objects.create(akte=akte, titel="Offene Aufgabe")

    user = get_user_model().objects.create_user(username="tester", password="secret")
    # Füge das Profil mit minimaler Rolle hinzu
    Profile.objects.create(user=user, role='BETRACHTER')
    client = APIClient()
    client.force_authenticate(user=user)

    response = client.get("/api/dashboard/")
    data = response.json()

    assert response.status_code == 200
    assert data["offene_aufgaben"] == 1
    assert data["fristen_heute"] == 2
    first_entry = data["priorisierte_fristen"][0]
    assert first_entry["bezeichnung"] == "Früh & hoch"
