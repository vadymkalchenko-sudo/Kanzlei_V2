import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kms_backend.settings')
django.setup()

from django.contrib.auth.models import User

username = 'testuser'
password = 'testpasswort'
email = 'testuser@example.com'

if not User.objects.filter(username=username).exists():
    User.objects.create_user(username=username, password=password, email=email)
    print(f"User '{username}' created.")
else:
    print(f"User '{username}' already exists.")
