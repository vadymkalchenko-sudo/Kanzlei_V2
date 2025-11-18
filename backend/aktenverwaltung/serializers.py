from rest_framework import serializers

from .models import Akte, Dokument, Mandant, Gegner


class MandantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mandant
        fields = [
            "id",
            "name",
            "adresse",
            "bankverbindung",
            "telefon",
            "email",
            "typ",
            "erstellt_am",
            "aktualisiert_am",
        ]


class GegnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gegner
        fields = [
            "id",
            "name",
            "adresse",
            "bankverbindung",
            "telefon",
            "email",
            "typ",
            "erstellt_am",
            "aktualisiert_am",
        ]


class AkteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Akte
        fields = [
            "id",
            "aktenzeichen",
            "status",
            "mandant",
            "gegner",
            "info_zusatz",
            "mandant_historie",
            "gegner_historie",
            "dokumenten_pfad_root",
            "erstellt_am",
            "aktualisiert_am",
        ]
        read_only_fields = (
            "mandant_historie",
            "gegner_historie",
            "erstellt_am",
            "aktualisiert_am",
        )


class AkteDashboardSerializer(AkteSerializer):
    naechste_frist = serializers.DateField(read_only=True)
    naechste_prioritaet = serializers.CharField(read_only=True)

    class Meta(AkteSerializer.Meta):
        fields = AkteSerializer.Meta.fields + ["naechste_frist", "naechste_prioritaet"]


class DokumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dokument
        fields = [
            "id",
            "akte",
            "titel",
            "dateiname",
            "pfad_auf_server",
            "erstellt_am",
        ]
        read_only_fields = ("pfad_auf_server", "erstellt_am")
