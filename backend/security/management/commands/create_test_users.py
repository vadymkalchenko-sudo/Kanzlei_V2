from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from security.models import Profile

class Command(BaseCommand):
    help = 'Creates or updates test users (admin, sachbearbeiter, mandant) with profiles.'

    def handle(self, *args, **options):
        self.stdout.write("Creating/Updating Admin/Superuser...")
        self.create_or_update_user_with_profile(
            "admin", "admin@example.com", "adminpassword", "ADMIN", is_superuser=True
        )
        self.stdout.write("Creating/Updating Standardbenutzer (Sachbearbeiter)...")
        self.create_or_update_user_with_profile(
            "sachbearbeiter", "sach@example.com", "sachbearbeiterpassword", "SACHBEARBEITER"
        )
        self.stdout.write("Creating/Updating Standardbenutzer (Mandant)...")
        self.create_or_update_user_with_profile(
            "mandant", "mandant@example.com", "mandantpassword", "MANDANT"
        )

        self.stdout.write("\nTest-Zugangsdaten:")
        self.stdout.write("Admin/Superuser: Username=admin, Password=adminpassword")
        self.stdout.write("Standardbenutzer (Sachbearbeiter): Username=sachbearbeiter, Password=sachbearbeiterpassword")
        self.stdout.write("Standardbenutzer (Mandant): Username=mandant, Password=mandantpassword")

    def create_or_update_user_with_profile(self, username, email, password, role, is_superuser=False):
        try:
            user = User.objects.get(username=username)
            user.email = email
            user.set_password(password)
            user.is_superuser = is_superuser
            user.is_staff = is_superuser
            user.save()
            self.stdout.write(f"Updated user: {username}")
        except User.DoesNotExist:
            if is_superuser:
                user = User.objects.create_superuser(username, email, password)
            else:
                user = User.objects.create_user(username, email, password)
            self.stdout.write(f"Created user: {username}")

        profile, created = Profile.objects.get_or_create(user=user)
        if profile.role != role:
            profile.role = role
            profile.save()
            self.stdout.write(f"Updated profile for {username} with role: {role}")
        else:
            self.stdout.write(f"Profile for {username} already has role: {role}")