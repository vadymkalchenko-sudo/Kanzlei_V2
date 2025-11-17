import logging

import logging

from django.db.models import Case, IntegerField, OuterRef, Q, Subquery, When
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from organizer.models import Aufgabe, Frist

from .db_connector import write_akte_data
from .models import Akte, Dokument
from .permissions import IsAdminOrReadWriteUser
from .serializers import AkteDashboardSerializer, AkteSerializer, DokumentSerializer
from .storage import store_document

logger = logging.getLogger(__name__)


class AkteViewSet(viewsets.ModelViewSet):
    queryset = Akte.objects.select_related("mandant", "gegner").all()
    serializer_class = AkteSerializer
    permission_classes = [IsAdminOrReadWriteUser]

    def perform_create(self, serializer):
        if self._has_conflict(serializer.validated_data):
            mandant = serializer.validated_data.get("mandant")
            logger.info(
                "Konfliktprüfung schlug fehl: Mandant %s ist bereits Gegner in offener Akte.",
                mandant,
            )
            raise serializers.ValidationError(
                {"konflikt": "Mandant ist bereits Gegner in offener Akte."}
            )

        serializer.save()

    @action(detail=False, methods=["get"], url_path="priorisierung")
    def priorisierte_akten(self, request):
        aktive_fristen = Frist.objects.filter(
            akte=OuterRef("pk"),
            erledigt=False,
        ).order_by("frist_datum")

        queryset = (
            self.queryset.annotate(
                naechste_frist=Subquery(aktive_fristen.values("frist_datum")[:1]),
                naechste_prioritaet=Subquery(aktive_fristen.values("prioritaet")[:1]),
            )
            .filter(~Q(naechste_frist__isnull=True))
            .order_by("naechste_frist")
        )

        serializer = AkteDashboardSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="schliessen")
    def close_akte(self, request, pk=None):
        akte = self.get_object()
        akte.freeze_stammdaten()
        akte.status = "Geschlossen"
        akte.save()
        return Response(
            {"status": "Akte geschlossen und Daten eingefroren"}, status=status.HTTP_200_OK
        )

    @action(detail=True, methods=["post"], url_path="update_zusatzinfo")
    def update_zusatzinfo(self, request, pk=None):
        akte = self.get_object()
        json_data = request.data.get("json_data")

        if json_data is None or not isinstance(json_data, dict):
            return Response(
                {"detail": "json_data muss ein Objekt sein."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, error = write_akte_data(akte.id, json_data)
        if not success:
            logger.error("JSONB-Schreibfehler für Akte %s: %s", akte.id, error)
            return Response(
                {"detail": error or "Schreiben fehlgeschlagen."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"status": "Zusatzinformationen aktualisiert"}, status=status.HTTP_200_OK
        )

    @action(
        detail=True,
        methods=["post"],
        url_path="dokumente",
        parser_classes=[MultiPartParser],
    )
    def upload_dokument(self, request, pk=None):
        akte = self.get_object()
        upload = request.FILES.get("datei")
        titel = request.data.get("titel")

        if upload is None:
            return Response(
                {"detail": "datei ist erforderlich."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        relative_path = store_document(akte, upload)
        dokument = Dokument.objects.create(
            akte=akte,
            titel=titel or upload.name,
            dateiname=upload.name,
            pfad_auf_server=relative_path,
        )

        serializer = DokumentSerializer(dokument)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def _has_conflict(self, validated_data):
        mandant = validated_data.get("mandant")
        if not mandant:
            return False

        return Akte.objects.filter(status="Offen", gegner_id=mandant.id).exists()


class DashboardView(APIView):
    permission_classes = [IsAdminOrReadWriteUser]

    def get(self, request):
        today = timezone.now().date()
        offene_aufgaben = Aufgabe.objects.exclude(status="erledigt").count()
        fristen_heute = Frist.objects.filter(erledigt=False, frist_datum=today).count()

        priorisierte_fristen = (
            Frist.objects.filter(erledigt=False)
            .annotate(
                prioritaet_rank=Case(
                    When(prioritaet="hoch", then=1),
                    When(prioritaet="mittel", then=2),
                    default=3,
                    output_field=IntegerField(),
                )
            )
            .select_related("akte")
            .order_by("frist_datum", "prioritaet_rank")
        )

        fristen_payload = [
            {
                "akte": frist.akte.aktenzeichen,
                "bezeichnung": frist.bezeichnung,
                "frist_datum": frist.frist_datum,
                "prioritaet": frist.prioritaet,
            }
            for frist in priorisierte_fristen
        ]

        return Response(
            {
                "offene_aufgaben": offene_aufgaben,
                "fristen_heute": fristen_heute,
                "priorisierte_fristen": fristen_payload,
            }
        )
