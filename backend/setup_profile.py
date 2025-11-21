import os
import django
import sys

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from django.contrib.auth.models import User
from security.models import Profile

def setup_profile():
    print("Setting up profile for sachbearbeiter...")
    
    try:
        user = User.objects.get(username='sachbearbeiter')
        profile, created = Profile.objects.get_or_create(user=user)
        profile.role = 'USER' # or POWERUSER
        profile.save()
        print(f"Profile for {user.username} set to {profile.role}")
        
        # Also check admin
        admin = User.objects.get(username='admin')
        p_admin, _ = Profile.objects.get_or_create(user=admin)
        p_admin.role = 'ADMIN'
        p_admin.save()
        print(f"Profile for {admin.username} set to {p_admin.role}")
        
    except User.DoesNotExist:
        print("User sachbearbeiter not found!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    setup_profile()
