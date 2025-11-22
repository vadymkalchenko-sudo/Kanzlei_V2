from rest_framework import serializers

from .models import Akte, Dokument, Mandant, Gegner, Drittbeteiligter, AkteDrittbeteiligter


class MandantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Mandant
        fields = [
            "id",
            "ansprache",
            "vorname",
            "nachname",
            "strasse",
            "hausnummer",
            "plz",
            "stadt",
            "land",
            "telefon",
            "email",
            "bankverbindung",
            "rechtsschutz",
            "rechtsschutz_bei",
            "vst_berechtigt",
            "notizen",
            "erstellt_am",
            "aktualisiert_am",
        ]
    
    def validate_vorname(self, value):
        """Keine Zahlen oder Sonderzeichen in Vorname/Firmenname"""
        if value and not all(c.isalpha() or c.isspace() or c in '-' for c in value):
            raise serializers.ValidationError("Vorname/Firmenname darf nur Buchstaben, Leerzeichen und Bindestriche enthalten.")
        return value
    
    def validate_nachname(self, value):
        """Keine Zahlen oder Sonderzeichen in Nachname/Ansprechpartner"""
        if value and not all(c.isalpha() or c.isspace() or c in '-' for c in value):
            raise serializers.ValidationError("Nachname/Ansprechpartner darf nur Buchstaben, Leerzeichen und Bindestriche enthalten.")
        return value
    
    def validate_plz(self, value):
        """Nur Zahlen in PLZ"""
        if value and not value.isdigit():
            raise serializers.ValidationError("PLZ darf nur Zahlen enthalten.")
        return value
    
    def validate_stadt(self, value):
        """Keine Sonderzeichen in Stadt"""
        if value and not all(c.isalnum() or c.isspace() or c in '-' for c in value):
            raise serializers.ValidationError("Stadt darf nur Buchstaben, Zahlen, Leerzeichen und Bindestriche enthalten.")
        return value
    
    def validate_land(self, value):
        """Keine Sonderzeichen in Land"""
        if value and not all(c.isalpha() or c.isspace() or c in '-' for c in value):
            raise serializers.ValidationError("Land darf nur Buchstaben, Leerzeichen und Bindestriche enthalten.")
        return value
    
    def validate_telefon(self, value):
        """Keine Buchstaben in Telefon"""
        if value and not all(c.isdigit() or c in ' +-/()' for c in value):
            raise serializers.ValidationError("Telefon darf nur Zahlen und die Zeichen + - / ( ) enthalten.")
        return value
    
    def validate_bankverbindung(self, value):
        """Keine Sonderzeichen in Bankverbindung (außer Leerzeichen und Bindestriche)"""
        if value and not all(c.isalnum() or c.isspace() or c in '-/' for c in value):
            raise serializers.ValidationError("Bankverbindung darf nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Schrägstriche enthalten.")
        return value
    
    def validate(self, data):
        """Bedingte Pflichtfelder: Vorname und Nachname sind Pflicht bei Herr/Frau"""
        ansprache = data.get('ansprache')
        vorname = data.get('vorname', '').strip()
        nachname = data.get('nachname', '').strip()
        
        if ansprache in ['Herr', 'Frau']:
            if not vorname:
                raise serializers.ValidationError({"vorname": "Vorname ist Pflichtfeld bei Herr/Frau."})
            if not nachname:
                raise serializers.ValidationError({"nachname": "Nachname ist Pflichtfeld bei Herr/Frau."})
        elif ansprache == 'Firma':
            if not vorname:
                raise serializers.ValidationError({"vorname": "Firmenname ist Pflichtfeld."})
        
        return data


class GegnerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gegner
        fields = [
            "id",
            "name",
            "strasse",
            "hausnummer",
            "plz",
            "stadt",
            "land",
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
