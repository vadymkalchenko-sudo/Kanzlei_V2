from rest_framework import serializers
from .models import Zahlungsposition

class ZahlungspositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zahlungsposition
        fields = '__all__'
