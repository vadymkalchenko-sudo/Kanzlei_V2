from django.db import models
from django.contrib.auth.models import User

from aktenverwaltung.models import Akte


class OrganizerZeitstempel(models.Model):
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Aufgabe(OrganizerZeitstempel):
    STATUS_CHOICES = (
        ("offen", "Offen"),
        ("in_bearbeitung", "In Bearbeitung"),
        ("erledigt", "Erledigt"),
    )

    akte = models.ForeignKey(Akte, on_delete=models.CASCADE, related_name="aufgaben")
    titel = models.CharField(max_length=255)
    beschreibung = models.TextField(blank=True)
    faellig_am = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="offen")
    zugewiesen_an = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name="aufgaben")

    class Meta:
        ordering = ["faellig_am", "status"]

    def __str__(self):
        return f"{self.titel} ({self.get_status_display()})"


class Frist(OrganizerZeitstempel):
    PRIORITAET_CHOICES = (
        ("hoch", "Hoch"),
        ("mittel", "Mittel"),
        ("niedrig", "Niedrig"),
    )

    akte = models.ForeignKey(Akte, on_delete=models.CASCADE, related_name="fristen")
    bezeichnung = models.CharField(max_length=255)
    frist_datum = models.DateField()
    prioritaet = models.CharField(max_length=16, choices=PRIORITAET_CHOICES, default="mittel")
    erledigt = models.BooleanField(default=False)

    class Meta:
        ordering = ["frist_datum"]

    def __str__(self):
        return f"{self.bezeichnung} - {self.frist_datum}"


class Notiz(OrganizerZeitstempel):
    akte = models.ForeignKey(Akte, on_delete=models.CASCADE, related_name="notizen")
    titel = models.CharField(max_length=255)
    inhalt = models.TextField()

    class Meta:
        ordering = ["-erstellt_am"]

    def __str__(self):
        return self.titel
