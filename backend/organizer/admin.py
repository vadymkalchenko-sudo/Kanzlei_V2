from django.contrib import admin

from .models import Aufgabe, Frist, Notiz


@admin.register(Aufgabe)
class AufgabeAdmin(admin.ModelAdmin):
    list_display = ("titel", "akte", "faellig_am", "status")
    list_filter = ("status",)
    search_fields = ("titel", "akte__aktenzeichen")


@admin.register(Frist)
class FristAdmin(admin.ModelAdmin):
    list_display = ("bezeichnung", "akte", "frist_datum", "prioritaet", "erledigt")
    list_filter = ("prioritaet", "erledigt")
    search_fields = ("bezeichnung", "akte__aktenzeichen")


@admin.register(Notiz)
class NotizAdmin(admin.ModelAdmin):
    list_display = ("titel", "akte", "erstellt_am")
    search_fields = ("titel", "inhalt", "akte__aktenzeichen")
