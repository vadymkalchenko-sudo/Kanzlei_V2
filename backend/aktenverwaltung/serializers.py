from rest_framework import serializers

from .models import Akte, Dokument, Mandant, Gegner, Drittbeteiligter, AkteDrittbeteiligter


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


class DrittbeteiligterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Drittbeteiligter
        fields = [
            "id",
            "name",
            "adresse",
            "telefon",
            "email",
            "typ",
            "rolle",
            "notizen",
            "erstellt_am",
            "aktualisiert_am",
        ]


class AkteDrittbeteiligterSerializer(serializers.ModelSerializer):
    """Serializer for Akte-Drittbeteiligter relationship with role"""
    drittbeteiligter = DrittbeteiligterSerializer(read_only=True)
    drittbeteiligter_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = AkteDrittbeteiligter
        fields = [
            "id",
            "drittbeteiligter",
            "drittbeteiligter_id",
            "rolle",
            "erstellt_am",
            "aktualisiert_am",
        ]
        read_only_fields = ("erstellt_am", "aktualisiert_am")


class DokumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Dokument
        fields = [
            "id",
            "akte",
            "titel",
            "dateiname",
            "pfad_auf_server",
            "datum",
            "erstellt_am",
        ]
        read_only_fields = ("pfad_auf_server", "erstellt_am")


class AkteSerializer(serializers.ModelSerializer):
    # Read: Full objects (compatibility with frontend)
    mandant = MandantSerializer(read_only=True)
    gegner = GegnerSerializer(read_only=True)
    
    # Write: IDs
    mandant_id = serializers.PrimaryKeyRelatedField(
        queryset=Mandant.objects.all(), 
        write_only=True, 
        source='mandant'
    )
    gegner_id = serializers.PrimaryKeyRelatedField(
        queryset=Gegner.objects.all(), 
        write_only=True, 
        required=False, 
        allow_null=True,
        source='gegner'
    )
    
    dokumente = DokumentSerializer(many=True, read_only=True)
    akte_drittbeteiligte = AkteDrittbeteiligterSerializer(many=True, read_only=True)
    
    class Meta:
        model = Akte
        fields = [
            "id",
            "aktenzeichen",
            "status",
            "mandant",
            "mandant_id",
            "gegner",
            "gegner_id",
            "info_zusatz",
            "mandant_historie",
            "gegner_historie",
            "dokumenten_pfad_root",
            "dokumente",
            "erstellt_am",
            "erstellt_am",
            "aktualisiert_am",
            "modus_operandi",
            "drittbeteiligte",
            "akte_drittbeteiligte",
        ]
        extra_kwargs = {
            "drittbeteiligte": {"required": False}
        }
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
