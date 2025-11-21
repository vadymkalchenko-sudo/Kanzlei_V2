import os
import django
import sys

sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from django.contrib.auth.models import User

def check_users():
    print("Checking users...")
    users = User.objects.all()
    for user in users:
        print(f"User: {user.username}, Active: {user.is_active}")
    
    if not users.exists():
        print("No users found!")

if __name__ == "__main__":
    check_users()
