import pytest
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from aktenverwaltung.models import Akte, Dokument, Gegner, Mandant
from aktenverwaltung.storage import store_document


@pytest.mark.django_db
def test_store_document_writes_file(tmp_path, settings):
    settings.KANZELEI_DOCS_ROOT = tmp_path
    mandant = Mandant.objects.create(name="Mandant")
    gegner = Gegner.objects.create(name="Gegner")
    akte = Akte.objects.create(aktenzeichen="VR-DOK-1", mandant=mandant, gegner=gegner)

    file = SimpleUploadedFile("beleg.txt", b"Inhalt")
    relative_path = store_document(akte, file)

    assert relative_path == "VR-DOK-1/beleg.txt"
    assert (tmp_path / "VR-DOK-1" / "beleg.txt").read_bytes() == b"Inhalt"


@pytest.mark.django_db
def test_dokument_upload_endpoint(tmp_path, settings):
    settings.KANZELEI_DOCS_ROOT = tmp_path
    mandant = Mandant.objects.create(name="Mandant")
    gegner = Gegner.objects.create(name="Gegner")
    akte = Akte.objects.create(aktenzeichen="VR-DOK-2", mandant=mandant, gegner=gegner)

    user = get_user_model().objects.create_user(username="upload", password="secret", is_staff=True)
    client = APIClient()
    client.force_authenticate(user=user)

    upload = SimpleUploadedFile("scan.pdf", b"PDFDATA")
    response = client.post(
        f"/api/akten/{akte.id}/dokumente/",
        {"datei": upload, "titel": "Scan"},
        format="multipart",
    )

    assert response.status_code == 201
    dokument = Dokument.objects.get(akte=akte)
    assert dokument.titel == "Scan"
    assert (tmp_path / "VR-DOK-2" / "scan.pdf").exists()

