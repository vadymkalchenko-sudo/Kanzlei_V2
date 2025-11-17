from django.db import models


class ZeitstempelModell(models.Model):
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Mandant(ZeitstempelModell):
    name = models.CharField(max_length=255)
    adresse = models.TextField(blank=True)
    bankverbindung = models.TextField(blank=True)

    def __str__(self):
        return self.name


class Gegner(ZeitstempelModell):
    name = models.CharField(max_length=255)
    adresse = models.TextField(blank=True)
    bankverbindung = models.TextField(blank=True)

    def __str__(self):
        return self.name


STATUS_CHOICES = (
    ("Offen", "Offen"),
    ("Geschlossen", "Geschlossen"),
    ("Archiviert", "Archiviert"),
)


class Akte(ZeitstempelModell):
    aktenzeichen = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Offen")

    mandant = models.ForeignKey(Mandant, on_delete=models.PROTECT, related_name="akten")
    gegner = models.ForeignKey(Gegner, on_delete=models.PROTECT, related_name="gegner_akten")

    info_zusatz = models.JSONField(default=dict, blank=True)
    mandant_historie = models.JSONField(default=dict, blank=True)
    gegner_historie = models.JSONField(default=dict, blank=True)

    dokumenten_pfad_root = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-aktualisiert_am"]

    def __str__(self):
        return self.aktenzeichen

    def freeze_stammdaten(self):
        self.mandant_historie = {
            "name": self.mandant.name,
            "adresse": self.mandant.adresse,
            "bankverbindung": self.mandant.bankverbindung,
        }
        self.gegner_historie = {
            "name": self.gegner.name,
            "adresse": self.gegner.adresse,
            "bankverbindung": self.gegner.bankverbindung,
        }


class Dokument(ZeitstempelModell):
    akte = models.ForeignKey(Akte, on_delete=models.CASCADE, related_name="dokumente")
    titel = models.CharField(max_length=255)
    dateiname = models.CharField(max_length=255)
    pfad_auf_server = models.CharField(max_length=512)

    def __str__(self):
        return f"{self.akte.aktenzeichen} - {self.titel}"
