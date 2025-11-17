import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from security.models import Profile
from aktenverwaltung.models import Akte, Mandant, Gegner

@pytest.fixture
def admin_user():
    user = User.objects.create_user(username="admin", password="adminpassword", is_staff=True)
    Profile.objects.create(user=user, role="ADMIN")
    return user

@pytest.fixture
def sachbearbeiter_user():
    user = User.objects.create_user(username="sachbearbeiter", password="sachbearbeiterpassword")
    Profile.objects.create(user=user, role="SACHBEARBEITER")
    return user

@pytest.fixture
def mandant_user():
    user = User.objects.create_user(username="mandant", password="mandantpassword")
    Profile.objects.create(user=user, role="MANDANT")
    return user

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def authenticated_admin_client(admin_user):
    client = APIClient()
    refresh = RefreshToken.for_user(admin_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client

@pytest.fixture
def authenticated_sachbearbeiter_client(sachbearbeiter_user):
    client = APIClient()
    refresh = RefreshToken.for_user(sachbearbeiter_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client

@pytest.fixture
def authenticated_mandant_client(mandant_user):
    client = APIClient()
    refresh = RefreshToken.for_user(mandant_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client

@pytest.fixture
def akte():
    mandant = Mandant.objects.create(name="Test Mandant")
    gegner = Gegner.objects.create(name="Test Gegner")
    akte = Akte.objects.create(aktenzeichen="TEST-AKTE-001", mandant=mandant, gegner=gegner)
    return akte

@pytest.mark.django_db
def test_token_obtain_and_refresh(api_client, admin_user):
    response = api_client.post("/api/token/", {"username": "admin", "password": "adminpassword"})
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data

    refresh_token = response.data["refresh"]
    response = api_client.post("/api/token/refresh/", {"refresh": refresh_token})
    assert response.status_code == 200
    assert "access" in response.data

@pytest.mark.django_db
def test_admin_can_create_akte(authenticated_admin_client):
    mandant = Mandant.objects.create(name="New Mandant")
    gegner = Gegner.objects.create(name="New Gegner")
    response = authenticated_admin_client.post("/api/akten/", {"aktenzeichen": "TEST-ADMIN-001", "mandant": mandant.id, "gegner": gegner.id})
    assert response.status_code == 201

@pytest.mark.django_db
def test_sachbearbeiter_can_read_akte(authenticated_sachbearbeiter_client, akte):
    response = authenticated_sachbearbeiter_client.get(f"/api/akten/{akte.pk}/")
    assert response.status_code == 200

@pytest.mark.django_db
def test_sachbearbeiter_cannot_create_akte(authenticated_sachbearbeiter_client):
    mandant = Mandant.objects.create(name="Another Mandant")
    gegner = Gegner.objects.create(name="Another Gegner")
    response = authenticated_sachbearbeiter_client.post("/api/akten/", {"aktenzeichen": "TEST-SACH-001", "mandant": mandant.id, "gegner": gegner.id})
    assert response.status_code == 403

@pytest.mark.django_db
def test_unauthenticated_cannot_access_akte(api_client, akte):
    response = api_client.get(f"/api/akten/{akte.pk}/")
    assert response.status_code == 401

@pytest.mark.django_db
def test_mandant_cannot_create_akte(authenticated_mandant_client):
    mandant = Mandant.objects.create(name="Client Mandant")
    gegner = Gegner.objects.create(name="Client Gegner")
    response = authenticated_mandant_client.post("/api/akten/", {"aktenzeichen": "TEST-MANDANT-001", "mandant": mandant.id, "gegner": gegner.id})
    assert response.status_code == 403

@pytest.mark.django_db
def test_admin_can_update_akte(authenticated_admin_client, akte):
    response = authenticated_admin_client.patch(f"/api/akten/{akte.pk}/", {"aktenzeichen": "UPDATED-AKTE"})
    assert response.status_code == 200
    akte.refresh_from_db()
    assert akte.aktenzeichen == "UPDATED-AKTE"

@pytest.mark.django_db
def test_sachbearbeiter_cannot_update_akte(authenticated_sachbearbeiter_client, akte):
    response = authenticated_sachbearbeiter_client.patch(f"/api/akten/{akte.pk}/", {"aktenzeichen": "UPDATED-AKTE"})
    assert response.status_code == 403

@pytest.mark.django_db
def test_admin_can_delete_akte(authenticated_admin_client, akte):
    response = authenticated_admin_client.delete(f"/api/akten/{akte.pk}/")
    assert response.status_code == 204

@pytest.mark.django_db
def test_sachbearbeiter_cannot_delete_akte(authenticated_sachbearbeiter_client, akte):
    response = authenticated_sachbearbeiter_client.delete(f"/api/akten/{akte.pk}/")
    assert response.status_code == 403