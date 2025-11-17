from rest_framework import permissions


class IsAdminOrReadWriteUser(permissions.BasePermission):
    """
    Platzhalter für rollenbasierte Logik:
    - Admins: Vollzugriff
    - Authentifizierte User: Lesen & Schreiben
    - Anonyme: Kein Zugriff
    """

    def has_permission(self, request, view):
        if request.user and request.user.is_staff:
            return True

        return request.user and request.user.is_authenticated

