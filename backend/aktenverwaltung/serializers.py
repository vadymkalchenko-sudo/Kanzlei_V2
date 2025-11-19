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
    mandant = MandantSerializer()
    gegner = GegnerSerializer()
    
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
    
    def create(self, validated_data):
        mandant_data = validated_data.pop('mandant')
        gegner_data = validated_data.pop('gegner')
        
        # Create or get Mandant and Gegner
        mandant = Mandant.objects.create(**mandant_data)
        gegner = Gegner.objects.create(**gegner_data)
        
        # Create Akte with the created Mandant and Gegner
        akte = Akte.objects.create(
            mandant=mandant,
            gegner=gegner,
            **validated_data
        )
        return akte
    
    def update(self, instance, validated_data):
        # For updates, handle nested objects if provided
        mandant_data = validated_data.pop('mandant', None)
        gegner_data = validated_data.pop('gegner', None)
        
        if mandant_data:
            for attr, value in mandant_data.items():
                setattr(instance.mandant, attr, value)
            instance.mandant.save()
        
        if gegner_data:
            for attr, value in gegner_data.items():
                setattr(instance.gegner, attr, value)
            instance.gegner.save()
        
        # Update Akte fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        return instance


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
