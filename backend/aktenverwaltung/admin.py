from django.contrib import admin

from .models import Akte, Dokument, Gegner, Mandant


@admin.register(Mandant)
class MandantAdmin(admin.ModelAdmin):
    list_display = ("__str__", "ansprache", "erstellt_am", "aktualisiert_am")
    search_fields = ("vorname", "nachname", "strasse", "stadt", "email")


@admin.register(Gegner)
class GegnerAdmin(admin.ModelAdmin):
    list_display = ("name", "erstellt_am", "aktualisiert_am")
    search_fields = ("name",)


@admin.register(Akte)
class AkteAdmin(admin.ModelAdmin):
    list_display = ("aktenzeichen", "status", "mandant", "gegner", "erstellt_am")
    list_filter = ("status",)
    search_fields = ("aktenzeichen", "mandant__vorname", "mandant__nachname", "gegner__name")


@admin.register(Dokument)
class DokumentAdmin(admin.ModelAdmin):
    list_display = ("titel", "akte", "dateiname")
    search_fields = ("titel", "dateiname", "akte__aktenzeichen")
