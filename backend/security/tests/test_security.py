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
def poweruser_user():
    user = User.objects.create_user(username="poweruser", password="poweruserpassword")
    Profile.objects.create(user=user, role="POWERUSER")
    return user

@pytest.fixture
def user_user():
    user = User.objects.create_user(username="user", password="userpassword")
    Profile.objects.create(user=user, role="USER")
    return user

@pytest.fixture
def betrachter_user():
    user = User.objects.create_user(username="betrachter", password="betrachterpassword")
    Profile.objects.create(user=user, role="BETRACHTER")
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
def authenticated_poweruser_client(poweruser_user):
    client = APIClient()
    refresh = RefreshToken.for_user(poweruser_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client

@pytest.fixture
def authenticated_user_client(user_user):
    client = APIClient()
    refresh = RefreshToken.for_user(user_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client

@pytest.fixture
def authenticated_betrachter_client(betrachter_user):
    client = APIClient()
    refresh = RefreshToken.for_user(betrachter_user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client

@pytest.fixture
def akte():
    mandant = Mandant.objects.create(name="Test Mandant")
    gegner = Gegner.objects.create(name="Test Gegner")
    akte = Akte.objects.create(aktenzeichen="TEST-AKTE-01", mandant=mandant, gegner=gegner)
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
def test_poweruser_can_create_akte(authenticated_poweruser_client):
    mandant = Mandant.objects.create(name="New Mandant")
    gegner = Gegner.objects.create(name="New Gegner")
    response = authenticated_poweruser_client.post("/api/akten/", {"aktenzeichen": "TEST-POWERUSER-01", "mandant": mandant.id, "gegner": gegner.id})
    assert response.status_code == 201

@pytest.mark.django_db
def test_user_can_read_akte(authenticated_user_client, akte):
    response = authenticated_user_client.get(f"/api/akten/{akte.pk}/")
    assert response.status_code == 200

@pytest.mark.django_db
def test_poweruser_can_read_akte(authenticated_poweruser_client, akte):
    response = authenticated_poweruser_client.get(f"/api/akten/{akte.pk}/")
    assert response.status_code == 200

@pytest.mark.django_db
def test_betrachter_can_read_akte(authenticated_betrachter_client, akte):
    response = authenticated_betrachter_client.get(f"/api/akten/{akte.pk}/")
    assert response.status_code == 200

@pytest.mark.django_db
def test_user_can_create_akte(authenticated_user_client):
    mandant = Mandant.objects.create(name="Another Mandant")
    gegner = Gegner.objects.create(name="Another Gegner")
    response = authenticated_user_client.post("/api/akten/", {"aktenzeichen": "TEST-USER-001", "mandant": mandant.id, "gegner": gegner.id})
    assert response.status_code == 201

@pytest.mark.django_db
def test_unauthenticated_cannot_access_akte(api_client, akte):
    response = api_client.get(f"/api/akten/{akte.pk}/")
    assert response.status_code == 403

@pytest.mark.django_db
def test_betrachter_cannot_create_akte(authenticated_betrachter_client):
    mandant = Mandant.objects.create(name="Client Mandant")
    gegner = Gegner.objects.create(name="Client Gegner")
    response = authenticated_betrachter_client.post("/api/akten/", {"aktenzeichen": "TEST-BETRACHTER-01", "mandant": mandant.id, "gegner": gegner.id})
    assert response.status_code == 403

@pytest.mark.django_db
def test_admin_can_update_akte(authenticated_admin_client, akte):
    response = authenticated_admin_client.patch(f"/api/akten/{akte.pk}/", {"aktenzeichen": "UPDATED-AKTE"})
    assert response.status_code == 200
    akte.refresh_from_db()
    assert akte.aktenzeichen == "UPDATED-AKTE"

@pytest.mark.django_db
def test_poweruser_can_update_akte(authenticated_poweruser_client, akte):
    response = authenticated_poweruser_client.patch(f"/api/akten/{akte.pk}/", {"aktenzeichen": "UPDATED-AKTE"})
    assert response.status_code == 200
    akte.refresh_from_db()
    assert akte.aktenzeichen == "UPDATED-AKTE"

@pytest.mark.django_db
def test_user_cannot_update_aktenzeichen(authenticated_user_client, akte):
    original_aktenzeichen = akte.aktenzeichen
    response = authenticated_user_client.patch(f"/api/akten/{akte.pk}/", {"aktenzeichen": "CHANGED-AKTE"})
    assert response.status_code == 403
    akte.refresh_from_db()
    assert akte.aktenzeichen == original_aktenzeichen

@pytest.mark.django_db
def test_user_can_update_akte_other_fields(authenticated_user_client, akte):
    response = authenticated_user_client.patch(f"/api/akten/{akte.pk}/", {"status": "Geschlossen"})
    assert response.status_code == 200
    akte.refresh_from_db()
    assert akte.status == "Geschlossen"

@pytest.mark.django_db
def test_betrachter_cannot_update_akte(authenticated_betrachter_client, akte):
    original_aktenzeichen = akte.aktenzeichen
    response = authenticated_betrachter_client.patch(f"/api/akten/{akte.pk}/", {"aktenzeichen": "CHANGED-AKTE"})
    assert response.status_code == 403
    akte.refresh_from_db()
    assert akte.aktenzeichen == original_aktenzeichen

@pytest.mark.django_db
def test_admin_can_delete_akte(authenticated_admin_client, akte):
    response = authenticated_admin_client.delete(f"/api/akten/{akte.pk}/")
    assert response.status_code == 204

@pytest.mark.django_db
def test_poweruser_can_delete_akte(authenticated_poweruser_client, akte):
    response = authenticated_poweruser_client.delete(f"/api/akten/{akte.pk}/")
    assert response.status_code == 204

@pytest.mark.django_db
def test_user_cannot_delete_akte(authenticated_user_client, akte):
    response = authenticated_user_client.delete(f"/api/akten/{akte.pk}/")
    assert response.status_code == 403

@pytest.mark.django_db
def test_betrachter_cannot_delete_akte(authenticated_betrachter_client, akte):
    response = authenticated_betrachter_client.delete(f"/api/akten/{akte.pk}/")
    assert response.status_code == 403
