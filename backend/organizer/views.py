from django.db.models import Case, IntegerField, When
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Aufgabe, Frist, Notiz
from .serializers import AufgabeSerializer, FristSerializer, NotizSerializer


class AufgabeViewSet(viewsets.ModelViewSet):
    queryset = Aufgabe.objects.select_related("akte")
    serializer_class = AufgabeSerializer
    permission_classes = [IsAuthenticated]


class FristViewSet(viewsets.ModelViewSet):
    queryset = Frist.objects.select_related("akte")
    serializer_class = FristSerializer
    permission_classes = [IsAuthenticated]


class NotizViewSet(viewsets.ModelViewSet):
    queryset = Notiz.objects.select_related("akte")
    serializer_class = NotizSerializer
    permission_classes = [IsAuthenticated]


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        priority_case = Case(
            When(prioritaet="hoch", then=0),
            When(prioritaet="mittel", then=1),
            default=2,
            output_field=IntegerField(),
        )

        fristen = (
            Frist.objects.filter(erledigt=False)
            .select_related("akte")
            .annotate(prioritaet_rank=priority_case)
            .order_by("frist_datum", "prioritaet_rank")[:10]
        )

        priorisierte_fristen = [
            {
                "akte_id": frist.akte_id,
                "aktenzeichen": frist.akte.aktenzeichen,
                "bezeichnung": frist.bezeichnung,
                "frist_datum": frist.frist_datum,
                "tage_bis_frist": (frist.frist_datum - today).days,
                "prioritaet": frist.prioritaet,
            }
            for frist in fristen
        ]

        offene_aufgaben = Aufgabe.objects.exclude(status="erledigt").count()
        fristen_heute = Frist.objects.filter(erledigt=False, frist_datum=today).count()

        return Response(
            {
                "priorisierte_fristen": priorisierte_fristen,
                "offene_aufgaben": offene_aufgaben,
                "fristen_heute": fristen_heute,
            }
        )
