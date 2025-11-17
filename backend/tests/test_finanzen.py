import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from aktenverwaltung.models import Akte, Mandant, Gegner
from finanzen.models import Zahlungsposition
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def api_client():
    user = User.objects.create_user(username="testuser", password="testpassword")
    client = APIClient()
    client.force_authenticate(user=user)
    return client

@pytest.fixture
def mandant():
    return Mandant.objects.create(name="Mandant 1")

@pytest.fixture
def gegner():
    return Gegner.objects.create(name="Gegner 1")

@pytest.fixture
def akte(mandant, gegner):
    return Akte.objects.create(
        aktenzeichen="AZ-123",
        mandant=mandant,
        gegner=gegner
    )

@pytest.mark.django_db
def test_crud_zahlungsposition(akte):
    # Create
    zahlung = Zahlungsposition.objects.create(
        akte=akte,
        status='OFFEN',
        betrag=100.00,
        beschreibung="Test"
    )
    assert zahlung.pk is not None

    # Read
    assert Zahlungsposition.objects.count() == 1

    # Update
    zahlung.status = 'BEZAHLT'
    zahlung.save()
    assert Zahlungsposition.objects.get(pk=zahlung.pk).status == 'BEZAHLT'

    # Delete
    zahlung.delete()
    assert Zahlungsposition.objects.count() == 0

@pytest.mark.django_db
def test_filter_zahlungsposition_by_status(api_client, akte):
    Zahlungsposition.objects.create(
        akte=akte,
        status='ABGLEICH',
        betrag=150.00,
        beschreibung="Abgleich"
    )
    Zahlungsposition.objects.create(
        akte=akte,
        status='OFFEN',
        betrag=200.00,
        beschreibung="Offen"
    )

    url = reverse('zahlung-list')
    response = api_client.get(url, {'status': 'ABGLEICH'})

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['status'] == 'ABGLEICH'
