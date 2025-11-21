from rest_framework import permissions
from django.core.exceptions import ObjectDoesNotExist
import logging

logger = logging.getLogger(__name__)


class IsAdminOrReadWriteUser(permissions.BasePermission):
    """
    Platzhalter für rollenbasierte Logik:
    - ADMIN & POWERUSER: Vollzugriff (inkl. Aktenzeichen-Änderung und Löschen)
    - USER: Lesen, Schreiben (außer Aktenzeichen-Änderung und Löschen)
    - BETRACHTER: Nur Lesen
    - Anonyme: Kein Zugriff
    """

    def has_permission(self, request, view):
        # Wenn der Benutzer anonym ist (was bei SessionAuthentication + IsAuthenticated der Fall sein kann),
        # dann wird er hier explizit abgelehnt, was zu einem 403 führt.
        if request.user and request.user.is_anonymous:
            logger.info(f"Benutzer ist anonym: {request.user}")
            return False

        # Admins (is_staff=True) haben immer Vollzugriff, unabhängig von der Profilrolle
        # Diese Prüfung erfolgt unmittelbar nach der is_anonymous-Prüfung
        if request.user.is_staff:
            logger.info(f"Admin-Benutzer {request.user.username} hat Vollzugriff")
            return True

        # Für alle anderen authentifizierten Benutzer: Versuche, das Profil zu laden
        try:
            profile = request.user.profile
            user_role = profile.role
            logger.info(f"Benutzerprofil gefunden: {request.user.username} hat Rolle {user_role}")
        except (AttributeError, ObjectDoesNotExist):
            # If user doesn't have a profile, or profile is malformed, deny access
            logger.info(f"Benutzer {request.user.username} hat kein Profil oder Profil ist fehlerhaft")
            return False

        # Prüfe Berechtigung basierend auf Rolle und Aktion
        action = getattr(view, 'action', None)
        logger.info(f"View action: {action}, HTTP Methode: {request.method}")

        # Für Benutzer mit Profilrolle
        if action is None:
            # Standard-ViewSet-Operationen basierend auf HTTP-Methode
            if request.method in ['GET', 'HEAD', 'OPTIONS']:  # list, retrieve
                # Benutzer mit bestimmten Rollen dürfen lesen
                if user_role in ['BETRACHTER', 'USER', 'POWERUSER', 'ADMIN']:
                    logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} darf lesen")
                    return True
                else:
                    logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} darf NICHT lesen")
            elif request.method == 'POST':  # create
                if user_role in ['ADMIN', 'POWERUSER', 'USER']:
                    logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} darf erstellen")
                    return True
                else:
                    logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} darf NICHT erstellen")
            elif request.method in ['PUT', 'PATCH']:  # update, partial_update
                if user_role in ['ADMIN', 'POWERUSER']:
                    logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} darf aktualisieren")
                    return True
                elif user_role == 'USER':
                    # USER kann aktualisieren, aber nicht 'aktenzeichen' ändern
                    if 'aktenzeichen' in request.data:
                        logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} darf aktenzeichen nicht ändern")
                        return False
                    logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} darf andere Felder aktualisieren")
                    return True
                else:
                    logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} darf NICHT aktualisieren")
            elif request.method == 'DELETE':  # destroy
                if user_role in ['ADMIN', 'POWERUSER']:
                    logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} darf löschen")
                    return True
                else:
                    logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} darf NICHT löschen")

        else:
            # Wenn view.action verfügbar ist (für benutzerdefinierte Aktionen)
            if user_role == 'ADMIN':
                logger.info(f"ADMIN {request.user.username} hat Vollzugriff")
                return True
            elif user_role == 'POWERUSER':
                # POWERUSER can perform most operations including delete
                if action in ['list', 'retrieve', 'priorisierte_akten', 'create', 'update', 'partial_update', 'upload_dokument', 'destroy', 'close_akte', 'search', 'organizer']:
                    logger.info(f"POWERUSER {request.user.username} darf Aktion {action} durchführen")
                    return True
                else:
                    logger.info(f"POWERUSER {request.user.username} darf Aktion {action} NICHT durchführen")
            elif user_role == 'USER':
                # USER can read, create, and update (but not aktenzeichen or delete)
                if action in ['list', 'retrieve', 'priorisierte_akten', 'create', 'search', 'organizer', 'close_akte']:
                    logger.info(f"USER {request.user.username} darf Aktion {action} durchführen")
                    return True
                elif action in ['update', 'partial_update']:
                    # USER can update akten, but not the 'aktenzeichen' field (special logic needed)
                    if 'aktenzeichen' in request.data:
                        logger.info(f"USER {request.user.username} darf aktenzeichen nicht ändern")
                        return False
                    logger.info(f"USER {request.user.username} darf andere Felder aktualisieren")
                    return True
                elif action == 'upload_dokument':
                    logger.info(f"USER {request.user.username} darf Aktion {action} durchführen")
                    return True
                else:
                    logger.info(f"USER {request.user.username} darf Aktion {action} NICHT durchführen")
            elif user_role == 'BETRACHTER':
                # BETRACHTER can only read
                if action in ['list', 'retrieve', 'priorisierte_akten', 'search', 'organizer']:
                    logger.info(f"BETRACHTER {request.user.username} darf Aktion {action} durchführen")
                    return True
                else:
                    logger.info(f"BETRACHTER {request.user.username} darf Aktion {action} NICHT durchführen")

        logger.info(f"Benutzer {request.user.username} mit Rolle {user_role} hat keine Berechtigung für Aktion {action} oder Methode {request.method}")
        return False
