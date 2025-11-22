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

def export_fragebogen_pdf(akte):
    """
    Erstellt eine PDF-Datei mit den Fragebogen-Daten der Akte.
    """
    directory = get_akte_directory(akte.aktenzeichen)
    filepath = directory / "fragebogen.pdf"

    doc = SimpleDocTemplate(str(filepath), pagesize=A4,
                            rightMargin=2*cm, leftMargin=2*cm,
                            topMargin=2*cm, bottomMargin=2*cm)

    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='SectionHeader', fontSize=14, leading=18, spaceAfter=10, textColor=colors.darkblue))

    elements = []
    data = akte.fragebogen_data

    # Titel
    elements.append(Paragraph(f"Fragebogen - Akte: {akte.aktenzeichen}", styles['Title']))
    elements.append(Spacer(1, 0.5*cm))

    # Helper function for yes/no display
    def ja_nein(value):
        if value is True:
            return "Ja"
        elif value is False:
            return "Nein"
        return "-"

    # Section 1: Unfalldaten
    elements.append(Paragraph("Unfalldaten", styles['SectionHeader']))
    section1_data = [
        ["Unfallort:", data.get("unfallort", "-")],
        ["Datum/Zeit:", data.get("datum_zeit", "-")],
        ["Polizei:", ja_nein(data.get("polizei"))],
    ]
    
    if data.get("polizei"):
        section1_data.extend([
            ["VEV:", data.get("polizei_vev", "-")],
            ["Dienststelle:", data.get("polizei_dienststelle", "-")],
            ["Vorgangs-Nr.:", data.get("polizei_vorgangs_nr", "-")],
        ])
    
    t = Table(section1_data, colWidths=[5*cm, 9*cm])
    t.setStyle(TableStyle([
        ('TEXTCOLOR', (0,0), (0,-1), colors.gray),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))

    # Section 2: Schadenshergang
    elements.append(Paragraph("Schadenshergang", styles['SectionHeader']))
    section2_data = [
        ["Schadenshergang:", data.get("schadenshergang", "-")],
        ["Zeugen:", ja_nein(data.get("zeugen"))],
        ["Lichtbilder vom Unfallort:", ja_nein(data.get("lichtbilder_unfallort"))],
    ]
    t = Table(section2_data, colWidths=[5*cm, 9*cm])
    t.setStyle(TableStyle([
        ('TEXTCOLOR', (0,0), (0,-1), colors.gray),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))

    # Section 3: KFZ-Daten
    elements.append(Paragraph("KFZ-Daten", styles['SectionHeader']))
    section3_data = []
    
    # Finanziert
    if data.get("kfz_finanziert"):
        finanziert_text = f"Ja, bei {data.get('kfz_finanziert_bei', '-')}, Vertrags-Nr.: {data.get('kfz_finanziert_vertrag_nr', '-')}"
    else:
        finanziert_text = "Nein"
    section3_data.append(["KFZ finanziert:", finanziert_text])
    
    # Geleast
    if data.get("kfz_geleast"):
        geleast_text = f"Ja, bei {data.get('kfz_geleast_bei', '-')}, Vertrags-Nr.: {data.get('kfz_geleast_vertrag_nr', '-')}"
    else:
        geleast_text = "Nein"
    section3_data.append(["KFZ geleast:", geleast_text])
    
    section3_data.extend([
        ["Kennzeichen:", data.get("kennzeichen", "-")],
        ["Typ:", data.get("kfz_typ", "-")],
        ["KW/PS:", data.get("kfz_kw_ps", "-")],
        ["EZ (Erstzulassung):", data.get("kfz_ez", "-")],
    ])
    
    # Vollkasko
    if data.get("vollkasko"):
        vollkasko_text = f"Ja, bei {data.get('vollkasko_bei', '-')}"
    else:
        vollkasko_text = "Nein"
    section3_data.append(["Vollkasko:", vollkasko_text])
    
    t = Table(section3_data, colWidths=[5*cm, 9*cm])
    t.setStyle(TableStyle([
        ('TEXTCOLOR', (0,0), (0,-1), colors.gray),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))

    # Section 4: Versicherung & SV
    elements.append(Paragraph("Versicherung & Sachverständiger", styles['SectionHeader']))
    section4_data = [
        ["Vers. Gegner:", data.get("vers_gegner", "-")],
        ["Schaden-Nr.:", data.get("schaden_nr", "-")],
    ]
    
    # SV beauftragt
    if data.get("sv_beauftragt"):
        sv_text = f"Ja, {data.get('sv_beauftragt_details', '-')}"
    else:
        sv_text = f"Nein, weil {data.get('sv_nicht_beauftragt_grund', '-')}"
    section4_data.append(["SV beauftragt:", sv_text])
    
    t = Table(section4_data, colWidths=[5*cm, 9*cm])
    t.setStyle(TableStyle([
        ('TEXTCOLOR', (0,0), (0,-1), colors.gray),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))

    # Section 5: Mietwagen & Schaden
    elements.append(Paragraph("Mietwagen & Schaden", styles['SectionHeader']))
    section5_data = []
    
    # Mietwagen/Nutzungsausfall
    mw_na = data.get("mietwagen_nutzungsausfall", "nein")
    if mw_na == "mietwagen":
        mw_text = f"Mietwagen von {data.get('mietwagen_von', '-')}"
    elif mw_na == "nutzungsausfall":
        mw_text = "Nutzungsausfall (Hinweis auf umgehende Reparatur)"
    else:
        mw_text = "Nein"
    section5_data.append(["Mietwagen/Nutzungsausfall:", mw_text])
    
    section5_data.append(["KFZ verkehrssicher:", ja_nein(data.get("kfz_verkehrssicher"))])
    
    # Personenschaden
    if data.get("personenschaden"):
        ps_text = f"Ja, {data.get('personenschaden_details', '-')}"
    else:
        ps_text = "Nein"
    section5_data.append(["Personenschaden/Verletzte:", ps_text])
    
    t = Table(section5_data, colWidths=[5*cm, 9*cm])
    t.setStyle(TableStyle([
        ('TEXTCOLOR', (0,0), (0,-1), colors.gray),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 0.5*cm))

    # Section 6: Verwaltung
    elements.append(Paragraph("Verwaltung", styles['SectionHeader']))
    section6_data = [
        ["Referat:", data.get("referat", "-")],
        ["Servicemitarbeiter:", data.get("servicemitarbeiter", "-")],
        ["Aufnahme erfolgte:", data.get("aufnahme_datum_zeit", "-")],
    ]
    t = Table(section6_data, colWidths=[5*cm, 9*cm])
    t.setStyle(TableStyle([
        ('TEXTCOLOR', (0,0), (0,-1), colors.gray),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(t)

    # Build PDF
    try:
        doc.build(elements)
        os.chmod(filepath, 0o664)
    except Exception as e:
        print(f"Fehler beim Erstellen der Fragebogen-PDF: {e}")

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
