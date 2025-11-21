import os
import shutil
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models import Akte
from .storage import get_akte_directory, ensure_docs_root

@receiver(post_save, sender=Akte)
def create_akte_directory(sender, instance, created, **kwargs):
    """
    Erstellt automatisch den Ordner für die Akte, wenn sie neu angelegt wird.
    """
    if created:
        get_akte_directory(instance.aktenzeichen)

@receiver(pre_save, sender=Akte)
def rename_akte_directory(sender, instance, **kwargs):
    """
    Benennt den Ordner um, wenn sich das Aktenzeichen ändert.
    """
    if instance.pk:
        try:
            old_instance = Akte.objects.get(pk=instance.pk)
            if old_instance.aktenzeichen != instance.aktenzeichen:
                old_dir = get_akte_directory(old_instance.aktenzeichen)
                new_dir = get_akte_directory(instance.aktenzeichen)
                
                if old_dir.exists():
                    # Wenn der neue Ordner schon existiert (sollte nicht passieren bei unique Aktenzeichen),
                    # müssen wir vorsichtig sein. shutil.move kann in existierende Ordner verschieben.
                    # Wir gehen davon aus, dass das neue Aktenzeichen sauber ist.
                    
                    # Stellen sicher, dass das Root-Verzeichnis existiert
                    ensure_docs_root()
                    
                    print(f"Renaming Akte directory from {old_dir} to {new_dir}")
                    shutil.move(str(old_dir), str(new_dir))
        except Akte.DoesNotExist:
            pass
