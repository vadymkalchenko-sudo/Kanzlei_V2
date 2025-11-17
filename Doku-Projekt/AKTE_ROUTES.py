# AKTE_ROUTES.py: REST API Endpunkte für Akten-CRUD und Spezial-Logik

import logging

from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from aktenverwaltung.datenmodelle import Akte
from aktenverwaltung.db_connector import write_akte_data
from aktenverwaltung.permissions import IsAdminOrReadWriteUser # Rollenprüfung

logger = logging.getLogger(__name__)

class AkteViewSet(viewsets.ModelViewSet):
    queryset = Akte.objects.all()
    # Hier werden die Autorisierungsklassen (Schritt 2) angewendet
    permission_classes = [IsAdminOrReadWriteUser] 

    def perform_create(self, serializer):
        """
        Überschreibt das Erstellen, um die KRITISCHE Konfliktprüfung durchzuführen
        und das Aktenzeichen zu generieren.
        """
        # 1. AKTENZEICHEN-GENERIERUNG (Logik hier)
        # 2. KRITISCHE KONFLIKTPRÜFUNG (Mandant vs. Gegner in offenen Akten)
        if self._has_conflict(serializer.validated_data):
            logger.info(
                "Konfliktprüfung schlug fehl: Mandant %s ist bereits Gegner in offener Akte.",
                serializer.validated_data.get("mandant"),
            )
            raise serializers.ValidationError(
                {"konflikt": "Mandant ist bereits Gegner in offener Akte."}
            )
             
        serializer.save()

    @action(detail=True, methods=['post'], url_path='schliessen')
    def close_akte(self, request, pk=None):
        """
        Endpoint für den Freezing State (Statuswechsel & JSONB-Snapshot)
        URL: /api/akten/{id}/schliessen/
        """
        akte = self.get_object()
        # Logik: Rufe Mandant/Gegner-Daten ab und kopiere sie in akte.mandant_historie (JSONB)
        akte.status = 'Geschlossen'
        # ... Logik des Daten-Freezing (Snapshot) HIER ...
        akte.save()
        return Response({'status': 'Akte geschlossen und Daten eingefroren'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='update_zusatzinfo')
    def update_zusatzinfo(self, request, pk=None):
        """
        Schreibt flexible Zusatzinformationen in das JSONB-Feld (info_zusatz).
        Erwartet: {"json_data": {...}}
        """
        akte = self.get_object()
        json_data = request.data.get('json_data')

        if json_data is None or not isinstance(json_data, dict):
            return Response(
                {"detail": "json_data muss ein Objekt sein."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        success, error = write_akte_data(akte.id, json_data)
        if not success:
            logger.error(
                "JSONB-Schreibfehler für Akte %s: %s",
                akte.id,
                error,
            )
            return Response(
                {"detail": error or "Schreiben fehlgeschlagen."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"status": "Zusatzinformationen aktualisiert"},
            status=status.HTTP_200_OK,
        )

    def _has_conflict(self, validated_data):
        """
        Prüft, ob der Mandant bereits als Gegner in einer offenen Akte existiert.
        """
        mandant = validated_data.get('mandant')
        if mandant is None:
            return False

        return Akte.objects.filter(
            status='Offen',
            gegner_id=mandant.id
        ).exists()

    # ... weitere Endpunkte für Export, Upload, etc.