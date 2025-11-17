from django.contrib import admin

from .models import Zahlungsposition


@admin.register(Zahlungsposition)
class ZahlungspositionAdmin(admin.ModelAdmin):
    list_display = ("akte", "status", "betrag", "beschreibung", "datum")
    list_filter = ("status",)
    search_fields = ("akte__aktenzeichen",)
