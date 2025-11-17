from rest_framework import permissions


class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Erlaubt Admins vollen Zugriff, anderen Benutzern nur Lesezugriff.
    """

    def has_permission(self, request, view):
        # Authentifizierte Benutzer dürfen lesen
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return request.user and request.user.is_authenticated

        # Nur Admins dürfen schreiben
        return request.user and request.user.is_staff