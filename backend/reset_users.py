import os
import django
import sys

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from django.contrib.auth.models import User

def setup_users():
    print("Setting up users...")
    
    # Setup Admin
    try:
        admin = User.objects.get(username='admin')
        admin.set_password('adminpassword')
        admin.save()
        print("Admin password reset to 'adminpassword'")
    except User.DoesNotExist:
        User.objects.create_superuser('admin', 'admin@example.com', 'adminpassword')
        print("Admin created with password 'adminpassword'")

    # Setup Sachbearbeiter
    try:
        sb = User.objects.get(username='sachbearbeiter')
        sb.set_password('sachbearbeiterpassword')
        sb.save()
        print("Sachbearbeiter password reset to 'sachbearbeiterpassword'")
    except User.DoesNotExist:
        User.objects.create_user('sachbearbeiter', 'sb@example.com', 'sachbearbeiterpassword')
        print("Sachbearbeiter created with password 'sachbearbeiterpassword'")

if __name__ == "__main__":
    setup_users()
