import logging

from django.db import IntegrityError, transaction

from .models import Akte

logger = logging.getLogger(__name__)


def write_akte_data(akte_id, json_data):
    """
    Speichert flexible Zusatzdaten (JSONB) revisionssicher.
    """
    try:
        with transaction.atomic():
            akte = Akte.objects.select_for_update().get(pk=akte_id)
            akte.info_zusatz = json_data
            akte.save(update_fields=["info_zusatz", "aktualisiert_am"])
            logger.info("JSONB-Daten erfolgreich für Akte %s geschrieben.", akte_id)
            return True, None
    except Akte.DoesNotExist:
        logger.error("Akte %s wurde für JSONB-Schreiben nicht gefunden.", akte_id)
        return False, "Akte nicht gefunden."
    except IntegrityError as exc:
        logger.error(
            "Integritätsfehler beim Schreiben in JSONB für Akte %s: %s", akte_id, exc
        )
        return False, f"Datenbank-Integritätsfehler: {exc}"
    except Exception as exc:  # pylint: disable=broad-except
        logger.exception("Unerwarteter Fehler beim Schreiben in JSONB für Akte %s", akte_id)
        return False, f"Unerwarteter Fehler: {exc}"


def create_akte_with_conflict_check(data):
    """
    Platzhalter für Logik der Aktenanlage mit Konfliktprüfung.
    """
    raise NotImplementedError("Use AkteViewSet.perform_create für die Konfliktprüfung.")

