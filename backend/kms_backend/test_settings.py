from .settings import *

# Use in-memory SQLite for faster tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Additional test-specific settings
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',  # Faster hasher for tests
]

# Ensure REST framework settings are properly configured for tests
REST_FRAMEWORK = getattr(globals(), 'REST_FRAMEWORK', {}).copy()
REST_FRAMEWORK.update({
    # Override default authentication classes if needed for testing
    # Added SessionAuthentication back to make force_authenticate work more reliably with test clients
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework_simplejwt.authentication.JWTAuthentication",  # Added JWT authentication
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated", # Ensures 401 for unauthenticated requests when no token is present
    ],
})
