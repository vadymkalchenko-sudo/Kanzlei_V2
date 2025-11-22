import json
import os
from pathlib import Path
from django.core.serializers.json import DjangoJSONEncoder
from ..storage import get_akte_directory

from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def export_stammdaten(akte):
    """
    Exportiert die Stammdaten der Akte in eine JSON-Datei im Aktenordner.
    """
    data = {
        "aktenzeichen": akte.aktenzeichen,
        "anlagedatum": akte.erstellt_am,
        "status": akte.status,
        "mandant": {
            "name": akte.mandant.name,
            "adresse": akte.mandant.adresse,
            "email": akte.mandant.email,
            "telefon": akte.mandant.telefon,
            "typ": akte.mandant.typ
        } if akte.mandant else None,
        "gegner": {
            "name": akte.gegner.name,
            "adresse": akte.gegner.adresse,
            "email": akte.gegner.email,
            "telefon": akte.gegner.telefon,
            "typ": akte.gegner.typ
        } if akte.gegner else None,
        "drittbeteiligte": akte.drittbeteiligte_historie.get("drittbeteiligte", []),
        "zusatzinfo": akte.info_zusatz
    }
    
    directory = get_akte_directory(akte.aktenzeichen)
    filepath = directory / "stammdaten.json"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, cls=DjangoJSONEncoder, indent=4, ensure_ascii=False)
    
    try:
        os.chmod(filepath, 0o664)
    except Exception:
        pass

def export_stammdaten_pdf(akte):
    """
    Erstellt eine PDF-Datei mit den Stammdaten der Akte.
    """
    directory = get_akte_directory(akte.aktenzeichen)
    filepath = directory / "stammdaten.pdf"

    doc = SimpleDocTemplate(str(filepath), pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='SectionHeader', fontSize=14, leading=18, spaceAfter=10, textColor=colors.darkblue))
    styles.add(ParagraphStyle(name='Label', fontSize=10, leading=12, textColor=colors.gray))
    styles.add(ParagraphStyle(name='Value', fontSize=10, leading=12, spaceAfter=6))

    elements = []

    # Titel
    elements.append(Paragraph(f"Akte: {akte.aktenzeichen}", styles['Title']))
    elements.append(Paragraph(f"Betreff: {akte.mandant.name} ./. {akte.gegner.name}", styles['Heading2']))
    elements.append(Spacer(1, 1*cm))

    # Mandant
    elements.append(Paragraph("Mandant", styles['SectionHeader']))
    if akte.mandant:
        data = [
            ["Name:", akte.mandant.name],
            ["Typ:", akte.mandant.typ],
            ["Adresse:", akte.mandant.adresse],
            ["Telefon:", akte.mandant.telefon],
            ["Email:", akte.mandant.email],
        ]
        t = Table(data, colWidths=[4*cm, 10*cm])
        t.setStyle(TableStyle([
            ('TEXTCOLOR', (0,0), (0,-1), colors.gray),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph("Kein Mandant zugewiesen", styles['Normal']))
    elements.append(Spacer(1, 1*cm))

    # Gegner
    elements.append(Paragraph("Gegner", styles['SectionHeader']))
    if akte.gegner:
        data = [
            ["Name:", akte.gegner.name],
            ["Typ:", akte.gegner.typ],
            ["Adresse:", akte.gegner.adresse],
            ["Telefon:", akte.gegner.telefon],
            ["Email:", akte.gegner.email],
        ]
        t = Table(data, colWidths=[4*cm, 10*cm])
        t.setStyle(TableStyle([
            ('TEXTCOLOR', (0,0), (0,-1), colors.gray),
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ]))
        elements.append(t)
    else:
        elements.append(Paragraph("Kein Gegner zugewiesen", styles['Normal']))
    elements.append(Spacer(1, 1*cm))

    # Drittbeteiligte
    elements.append(Paragraph("Drittbeteiligte", styles['SectionHeader']))
    drittbeteiligte_list = akte.drittbeteiligte_historie.get("drittbeteiligte", [])
    
    if drittbeteiligte_list:
        for db in drittbeteiligte_list:
            data = [
                ["Name:", db.get("name", "")],
                ["Rolle:", db.get("rolle", "")],
                ["Typ:", db.get("typ", "")],
                ["Adresse:", db.get("adresse", "")],
                ["Kontakt:", f"{db.get('telefon', '')} / {db.get('email', '')}"],
                ["Notizen:", db.get("notizen", "")],
            ]
            t = Table(data, colWidths=[4*cm, 10*cm])
            t.setStyle(TableStyle([
                ('TEXTCOLOR', (0,0), (0,-1), colors.gray),
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('LINEBELOW', (0,-1), (-1,-1), 0.5, colors.lightgrey),
            ]))
            elements.append(t)
            elements.append(Spacer(1, 0.5*cm))
    else:
        elements.append(Paragraph("Keine Drittbeteiligten verknüpft", styles['Normal']))

    # Build PDF
    try:
        doc.build(elements)
        os.chmod(filepath, 0o664)
    except Exception as e:
        print(f"Fehler beim Erstellen der PDF: {e}")

def export_verlauf(akte):
    """
    Exportiert den Verlauf (Aufgaben, Fristen, Notizen) in eine JSON-Datei.
    """
    # Fetch organizer data
    # Note: We use values() to get dictionaries, handling relations might need more care if complex
    aufgaben = list(akte.aufgaben.values())
    fristen = list(akte.fristen.values())
    notizen = list(akte.notizen.values())
    
    data = {
        "aufgaben": aufgaben,
        "fristen": fristen,
        "notizen": notizen
    }
    
    directory = get_akte_directory(akte.aktenzeichen)
    filepath = directory / "verlauf.json"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, cls=DjangoJSONEncoder, indent=4, ensure_ascii=False)

    try:
        os.chmod(filepath, 0o664)
    except Exception:
        pass
