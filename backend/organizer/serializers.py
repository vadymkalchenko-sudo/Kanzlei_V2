from rest_framework import serializers

from .models import Aufgabe, Frist, Notiz


class AufgabeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Aufgabe
        fields = "__all__"


class FristSerializer(serializers.ModelSerializer):
    class Meta:
        model = Frist
        fields = "__all__"


class NotizSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notiz
        fields = "__all__"

