from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from .models import Zahlungsposition
from .serializers import ZahlungspositionSerializer

class ZahlungspositionViewSet(viewsets.ModelViewSet):
    queryset = Zahlungsposition.objects.all()
    serializer_class = ZahlungspositionSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status']
