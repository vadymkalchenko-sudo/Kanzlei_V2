from django.apps import AppConfig


class AktenverwaltungConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'aktenverwaltung'

    def ready(self):
        from . import storage  # noqa: F401
        storage.ensure_docs_root()
        from . import signals  # noqa: F401