import logging

import logging

from django.db.models import Case, IntegerField, OuterRef, Q, Subquery, When, ProtectedError
from django.http import FileResponse
from django.utils import timezone
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from organizer.models import Aufgabe, Frist

from .db_connector import write_akte_data
from .models import Akte, Dokument, Mandant, Gegner, Drittbeteiligter
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsAdminOrReadWriteUser
from .serializers import AkteDashboardSerializer, AkteSerializer, DokumentSerializer, MandantSerializer, GegnerSerializer, DrittbeteiligterSerializer
from .storage import store_document

logger = logging.getLogger(__name__)


class MandantViewSet(viewsets.ModelViewSet):
    queryset = Mandant.objects.all()
    serializer_class = MandantSerializer
    permission_classes = [IsAdminOrReadWriteUser]
    
    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"error": "Dieser Eintrag kann nicht gelöscht werden, da er noch in Akten verwendet wird."},
                status=status.HTTP_409_CONFLICT
            )

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        query = request.query_params.get("q", "")
        if query:
            mandanten = Mandant.objects.filter(
                Q(name__icontains=query) | 
                Q(email__icontains=query) |
                Q(telefon__icontains=query)
            )
        else:
            mandanten = Mandant.objects.all()
        serializer = self.get_serializer(mandanten, many=True)
        return Response(serializer.data)


class GegnerViewSet(viewsets.ModelViewSet):
    queryset = Gegner.objects.all()
    serializer_class = GegnerSerializer
    permission_classes = [IsAdminOrReadWriteUser]
    
    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"error": "Dieser Eintrag kann nicht gelöscht werden, da er noch in Akten verwendet wird."},
                status=status.HTTP_409_CONFLICT
            )

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        query = request.query_params.get("q", "")
        if query:
            gegner = Gegner.objects.filter(
                Q(name__icontains=query) | 
                Q(email__icontains=query) |
                Q(telefon__icontains=query)
            )
        else:
            gegner = Gegner.objects.all()
        serializer = self.get_serializer(gegner, many=True)
        return Response(serializer.data)


class DrittbeteiligterViewSet(viewsets.ModelViewSet):
    queryset = Drittbeteiligter.objects.all()
    serializer_class = DrittbeteiligterSerializer
    permission_classes = [IsAdminOrReadWriteUser]
    
    def destroy(self, request, *args, **kwargs):
        try:
            return super().destroy(request, *args, **kwargs)
        except ProtectedError:
            return Response(
                {"error": "Dieser Eintrag kann nicht gelöscht werden, da er noch in Akten verwendet wird."},
                status=status.HTTP_409_CONFLICT
            )

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        query = request.query_params.get("q", "")
        if query:
            drittbeteiligte = Drittbeteiligter.objects.filter(
                Q(name__icontains=query) | 
                Q(email__icontains=query) |
                Q(telefon__icontains=query) |
                Q(rolle__icontains=query)
            )
        else:
            drittbeteiligte = Drittbeteiligter.objects.all()
        serializer = self.get_serializer(drittbeteiligte, many=True)
        return Response(serializer.data)





class AkteViewSet(viewsets.ModelViewSet):
    queryset = Akte.objects.select_related("mandant", "gegner").all()
    serializer_class = AkteSerializer
    permission_classes = [IsAdminOrReadWriteUser]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = serializer.data
        print(f"DEBUG: Akte {instance.id} retrieve. Dokumente count: {len(data.get('dokumente', []))}")
        return Response(data)

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

    @action(detail=False, methods=["get"], url_path="next_aktenzeichen")
    def next_aktenzeichen(self, request):
        """
        Berechnet das nächste Aktenzeichen im Format NNNN.YY.awr
        """
        from datetime import datetime
        
        # Aktuelles Jahr (letzte 2 Ziffern)
        current_year = str(datetime.now().year)[-2:]
        
        # Finde die höchste Nummer für das aktuelle Jahr
        max_num = 0
        akten = Akte.objects.filter(aktenzeichen__endswith=f".{current_year}.awr")
        
        for akte in akten:
            parts = akte.aktenzeichen.split('.')
            if len(parts) >= 2 and parts[1] == current_year:
                try:
                    num = int(parts[0])
                    if num > max_num:
                        max_num = num
                except ValueError:
                    continue
        
        # Nächstes Aktenzeichen ist die nächste Nummer
        next_num = max_num + 1
        next_aktenzeichen = f"{next_num:04d}.{current_year}.awr"
        
        return Response({"next_aktenzeichen": next_aktenzeichen})

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        """
        Sucht nach Akten basierend auf Aktenzeichen oder Mandant
        Query-Parameter: q (Suchbegriff)
        """
        query = request.query_params.get('q', '').strip()
        
        # Mindestens 2 Zeichen für Suche erforderlich
        if len(query) < 2:
            return Response([])
        
        # Suche über Aktenzeichen und Mandant-Name
        akten = Akte.objects.select_related("mandant", "gegner").filter(
            Q(aktenzeichen__icontains=query) |
            Q(mandant__name__icontains=query) |
            Q(gegner__name__icontains=query)
        )[:10]  # Limit auf 10 Ergebnisse
        
        # Verwende vereinfachten Serializer für Suchergebnisse
        results = [
            {
                "id": akte.id,
                "aktenzeichen": akte.aktenzeichen,
                "mandant": akte.mandant.name if akte.mandant else None,
                "gegner": akte.gegner.name if akte.gegner else None,
                "status": akte.status,
            }
            for akte in akten
        ]
        
        return Response(results)


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
                status=status.HTTP_40_BAD_REQUEST,
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
                status=status.HTTP_40_BAD_REQUEST,
            )

        relative_path = store_document(akte, upload)
        dokument = Dokument.objects.create(
            akte=akte,
            titel=titel or upload.name,
            dateiname=upload.name,
            pfad_auf_server=relative_path,
            datum=timezone.now().date(),
        )

        serializer = DokumentSerializer(dokument)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], url_path="dokumente/(?P<doc_pk>[^/.]+)/download")
    def download_dokument(self, request, pk=None, doc_pk=None):
        """
        Gesicherte Download-API für Dokumente
        """
        akte = self.get_object()
        try:
            dokument = akte.dokumente.get(pk=doc_pk)
        except Dokument.DoesNotExist:
            return Response(
                {"detail": "Dokument nicht gefunden."},
                status=status.HTTP_404_NOT_FOUND,
            )
        
        # Dateipfad sicherheitshalber validieren
        import os
        from django.conf import settings
        
        # Konstruiere den vollständigen Dateipfad
        file_path = os.path.join(settings.MEDIA_ROOT, dokument.pfad_auf_server)
        
        # Sicherheitsüberprüfung: Stelle sicher, dass der Dateipfad innerhalb des MEDIA_ROOT ist
        file_path = os.path.abspath(file_path)
        media_root = os.path.abspath(settings.MEDIA_ROOT)
        
        if not file_path.startswith(media_root):
            return Response(
                {"detail": "Ungültiger Dateipfad."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        # Überprüfen, ob die Datei existiert
        if not os.path.exists(file_path):
            # Fallback: Prüfe, ob der Pfad wegen Slash-Ersetzung abweicht (für alte Uploads)
            safe_aktenzeichen = akte.aktenzeichen.replace("/", "_")
            filename = os.path.basename(dokument.pfad_auf_server)
            fallback_path = os.path.join(media_root, safe_aktenzeichen, filename)
            
            if os.path.exists(fallback_path):
                file_path = fallback_path
            else:
                return Response(
                    {"detail": "Datei existiert nicht."},
                    status=status.HTTP_404_NOT_FOUND,
                )
        
        # Datei als Download bereitstellen
        import mimetypes
        content_type, encoding = mimetypes.guess_type(file_path)
        response = FileResponse(
            open(file_path, 'rb'),
            as_attachment=True,
            filename=dokument.dateiname,
            content_type=content_type or 'application/octet-stream'
        )
        return response

    def _has_conflict(self, validated_data):
        mandant_obj = validated_data.get("mandant")
        if not mandant_obj:
            return False

        # mandant_obj is now a Mandant instance, not a dict
        mandant_name = mandant_obj.name
        return Akte.objects.filter(status="Offen", gegner__name=mandant_name).exists()

    @action(detail=True, methods=["get"], url_path="organizer")
    def organizer(self, request, pk=None):
        """
        Liefert eine kombinierte Liste aller Aufgaben, Fristen und Notizen für eine Akte
        """
        akte = self.get_object()
        
        aufgaben = akte.aufgaben.all()
        fristen = akte.fristen.all()
        notizen = akte.notizen.all()
        
        results = []
        
        for aufgabe in aufgaben:
            results.append({
                "id": aufgabe.id,
                "typ": "Aufgabe",
                "titel": aufgabe.titel,
                "beschreibung": aufgabe.beschreibung,
                "status": aufgabe.get_status_display(),
                "faellig_am": aufgabe.faellig_am,
                "erstellt_am": aufgabe.erstellt_am
            })
            
        for frist in fristen:
            results.append({
                "id": frist.id,
                "typ": "Frist",
                "titel": frist.bezeichnung,
                "beschreibung": f"Priorität: {frist.get_prioritaet_display()}",
                "datum": frist.frist_datum,
                "status": "Erledigt" if frist.erledigt else "Offen",
                "prioritaet": frist.prioritaet,
                "erstellt_am": frist.erstellt_am
            })
            
        for notiz in notizen:
            results.append({
                "id": notiz.id,
                "typ": "Notiz",
                "titel": notiz.titel,
                "beschreibung": notiz.inhalt,
                "erstellt_am": notiz.erstellt_am
            })
            
        # Sortieren nach Erstellungsdatum (neueste zuerst)
        results.sort(key=lambda x: x["erstellt_am"], reverse=True)
        
        return Response(results)


class AdressbuchViewSet(ViewSet):
    """
    ViewSet für die Adressbuch-Suche über Mandant und Gegner
    """
    permission_classes = [IsAdminOrReadWriteUser]

    @action(detail=False, methods=["get"], url_path="search")
    def search(self, request):
        """
        Such-API über Mandant und Gegner zur Unterstützung der Übernahme-Funktion
        """
        query = request.query_params.get('q', '')
        
        if query:
            # Suche in Mandanten und Gegnern
            mandanten = Mandant.objects.filter(
                Q(name__icontains=query) | 
                Q(email__icontains=query) | 
                Q(telefon__icontains=query)
            )
            gegner = Gegner.objects.filter(
                Q(name__icontains=query) | 
                Q(email__icontains=query) | 
                Q(telefon__icontains=query)
            )
        else:
            mandanten = Mandant.objects.all()
            gegner = Gegner.objects.all()
        
        # Kombiniere Ergebnisse und serialisiere
        results = []
        for mandant in mandanten:
            results.append({
                'id': mandant.pk, # Verwende pk statt id
                'name': mandant.name,
                'adresse': mandant.adresse,
                'telefon': mandant.telefon,
                'email': mandant.email,
                'typ': mandant.typ,
                'model_type': 'mandant'
            })
        
        for gegner in gegner:
            results.append({
                'id': gegner.pk,  # Verwende pk statt id
                'name': gegner.name,
                'adresse': gegner.adresse,
                'telefon': gegner.telefon,
                'email': gegner.email,
                'typ': gegner.typ,
                'model_type': 'gegner'
            })
        
        # Sortiere nach Name
        results = sorted(results, key=lambda x: x['name'])
        
        return Response(results)


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


class DokumentViewSet(viewsets.ModelViewSet):
    queryset = Dokument.objects.all()
    serializer_class = DokumentSerializer
    permission_classes = [IsAdminOrReadWriteUser]
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Optional: Delete file from filesystem here if needed
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


# --- Backup ViewSet ---
import tempfile
import os
from django.core.management import call_command
from django.http import FileResponse
from rest_framework.parsers import MultiPartParser, FormParser

class BackupViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated] # Or IsAdminUser
    parser_classes = (MultiPartParser, FormParser)

    @action(detail=False, methods=['get'])
    def export_db(self, request):
        """
        Exports the entire database to a JSON file.
        """
        try:
            # Create a temporary file
            with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.json', encoding='utf-8') as tmp:
                # Dump data excluding contenttypes and sessions to avoid issues
                call_command(
                    'dumpdata', 
                    exclude=['contenttypes', 'sessions', 'auth.permission', 'admin.logentry'], 
                    indent=2, 
                    stdout=tmp
                )
                tmp_path = tmp.name
            
            response = FileResponse(open(tmp_path, 'rb'), as_attachment=True, filename='kanzlei_backup.json')
            return response
            
        except Exception as e:
            return Response({'error': str(e)}, status=500)

    @action(detail=False, methods=['post'])
    def import_db(self, request):
        """
        Imports a JSON backup file. WARNING: Overwrites/Merges data.
        """
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'Keine Datei ausgewählt'}, status=status.HTTP_400_BAD_REQUEST)
        
        tmp_path = None
        try:
            # Save uploaded file to temp
            with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp:
                for chunk in file_obj.chunks():
                    tmp.write(chunk)
                tmp_path = tmp.name
            
            # Load data
            call_command('loaddata', tmp_path)
            
            return Response({'status': 'Backup erfolgreich wiederhergestellt'}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({'error': f"Fehler beim Import: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except:
                    pass
