import pytest

from aktenverwaltung.models import Akte, Gegner, Mandant


@pytest.mark.django_db
def test_freeze_stammdaten_persistiert_snapshot():
    mandant = Mandant.objects.create(name="Max Mandant")
    gegner = Gegner.objects.create(name="Ina Gegner")
    akte = Akte.objects.create(
        aktenzeichen="VR-2025-0001",
        mandant=mandant,
        gegner=gegner,
    )

    akte.freeze_stammdaten()

    assert akte.mandant_historie["name"] == "Max Mandant"
    assert akte.gegner_historie["name"] == "Ina Gegner"


@pytest.mark.django_db
def test_conflict_rule_erkennt_gegner_als_mandant():
    mandant = Mandant.objects.create(name="Kollision GmbH")
    gegner = Gegner.objects.create(name="Kollision GmbH")
    Akte.objects.create(
        aktenzeichen="VR-2025-0002",
        mandant=mandant,
        gegner=gegner,
        status="Offen",
    )

    konflikt_vorhanden = Akte.objects.filter(
        status="Offen",
        gegner__name="Kollision GmbH",
    ).exists()

    assert konflikt_vorhanden is True

