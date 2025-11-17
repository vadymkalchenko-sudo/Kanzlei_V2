# Django Models / ORM Definition

from django.db import models
from django.contrib.postgres.fields import JSONField # JSONB in Django

# --- aktenverwaltung App ---

class Mandant(models.Model):
    name = models.CharField(max_length=255)
    adresse = models.TextField()
    bankverbindung = models.TextField()
    # ... weitere Felder

class Akte(models.Model):
    # KRITISCHES FELD: Die Aktenzeichen-Logik generiert dieses beim Speichern.
    aktenzeichen = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=50, default='Offen', choices=STATUS_CHOICES)
    
    # Fremdschlüssel (FKs) zu Stammdaten
    mandant = models.ForeignKey(Mandant, on_delete=models.PROTECT)
    gegner = models.ForeignKey(Gegner, on_delete=models.PROTECT)
    
    # JSONB-Felder (Flexibel und Historisch)
    info_zusatz = JSONField(default=dict) # Für flexible Zusatzdaten (Fehlervermutung 2025-10-03)
    mandant_historie = JSONField(default=dict) # Snapshot bei Schließen
    gegner_historie = JSONField(default=dict)  # Snapshot bei Schließen
    
    # ... on_save Logik für Aktenzeichen und Konfliktprüfung hier!

class Dokument(models.Model):
    akte = models.ForeignKey(Akte, on_delete=models.CASCADE)
    pfad_auf_server = models.CharField(max_length=512) # Relativer Pfad

# --- finanzen App ---

class Zahlungsposition(models.Model):
    akte = models.ForeignKey(Akte, on_delete=models.CASCADE)
    betrag_soll = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    betrag_haben = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=50, default='Anstehend', choices=ZAHLUNGS_STATUS_CHOICES)