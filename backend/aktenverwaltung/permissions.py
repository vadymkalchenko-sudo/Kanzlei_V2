from rest_framework import permissions


class IsAdminOrReadWriteUser(permissions.BasePermission):
    """
    Platzhalter für rollenbasierte Logik:
    - Admins: Vollzugriff
    - Authentifizierte User: Lesen & Schreiben
    - Anonyme: Kein Zugriff
    """

    def has_permission(self, request, view):
        # Debug logging
        if request.user and request.user.is_authenticated:
            # Check if user is staff (admin) - this should work for admin users
            if request.user.is_staff:
                return True
            
            # For non-staff users, check the profile role
            try:
                # Ensure the profile is loaded
                profile = request.user.profile
                user_role = profile.role
                if user_role == 'ADMIN':
                    return True
                elif user_role == 'SACHBEARBEITER':
                    # For read operations, allow access
                    if view.action in ['list', 'retrieve']:
                        return True
                    # For write operations, SACHBEARBEITER has limited permissions
                    # Based on test expectations: SACHBEARBEITER can read but cannot create/update/delete
                    if view.action in ['create', 'update', 'partial_update', 'destroy']:
                        return False
                    return True  # Other actions that are not CRUD
                elif user_role == 'MANDANT':
                    # For read operations, allow access
                    if view.action in ['list', 'retrieve']:
                        return True
                    # For write operations, MANDANT has no permissions
                    if view.action in ['create', 'update', 'partial_update', 'destroy']:
                        return False
                    return True  # Other actions that are not CRUD
            except AttributeError:
                # If user doesn't have a profile, default to no access
                pass

        return False
