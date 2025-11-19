import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from rest_framework.test import APIRequestFactory
from organizer.views import DashboardView

def debug_dashboard():
    factory = APIRequestFactory()
    view = DashboardView.as_view()
    
    # Create a request
    request = factory.get('/api/dashboard/')
    
    # Create a user and force authenticate
    from django.contrib.auth.models import User
    from rest_framework.test import force_authenticate
    
    user, created = User.objects.get_or_create(username='debug_admin', is_staff=True, is_superuser=True)
    force_authenticate(request, user=user)
    
    response = view(request)
    print("Status Code:", response.status_code)
    print("Data Keys:", response.data.keys())
    
    if 'priorisierte_fristen' in response.data:
        fristen = response.data['priorisierte_fristen']
        print(f"\nFound {len(fristen)} fristen.")
        for i, f in enumerate(fristen):
            print(f"[{i}] Keys: {list(f.keys())}")
            print(f"    Aktenzeichen: {f.get('aktenzeichen')}")
            print(f"    Akte ID: {f.get('akte_id')}")
            print(f"    Bezeichnung: {f.get('bezeichnung')}")

if __name__ == "__main__":
    debug_dashboard()
