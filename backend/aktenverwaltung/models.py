from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone


class ZeitstempelModell(models.Model):
    erstellt_am = models.DateTimeField(auto_now_add=True)
    aktualisiert_am = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


TYP_CHOICES = (
    ("Person", "Person"),
    ("Firma", "Firma"),
    ("Versicherung", "Versicherung"),
)


class Mandant(ZeitstempelModell):
    name = models.CharField(max_length=255)
    adresse = models.TextField(blank=True)
    bankverbindung = models.TextField(blank=True)
    telefon = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    typ = models.CharField(max_length=20, choices=TYP_CHOICES, default="Person")

    def __str__(self):
        return self.name


class Gegner(ZeitstempelModell):
    name = models.CharField(max_length=255)
    adresse = models.TextField(blank=True)
    bankverbindung = models.TextField(blank=True)
    telefon = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    typ = models.CharField(max_length=20, choices=TYP_CHOICES, default="Person")

    def __str__(self):
        return self.name


class Drittbeteiligter(ZeitstempelModell):
    """Drittbeteiligte Personen/Firmen (z.B. Zeugen, Sachverständige, etc.)"""
    name = models.CharField(max_length=255)
    adresse = models.TextField(blank=True)
    telefon = models.CharField(max_length=50, blank=True)
    email = models.EmailField(blank=True)
    typ = models.CharField(max_length=20, choices=TYP_CHOICES, default="Person")
    rolle = models.CharField(max_length=100, blank=True, help_text="z.B. Zeuge, Sachverständiger, etc.")
    notizen = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Drittbeteiligte"

    def __str__(self):
        return f"{self.name} ({self.rolle})" if self.rolle else self.name


STATUS_CHOICES = (
    ("Offen", "Offen"),
    ("Geschlossen", "Geschlossen"),
    ("Archiviert", "Archiviert"),
)


class AkteDrittbeteiligter(ZeitstempelModell):
    """Intermediate model for Akte-Drittbeteiligter relationship with role"""
    akte = models.ForeignKey('Akte', on_delete=models.CASCADE, related_name='akte_drittbeteiligte')
    drittbeteiligter = models.ForeignKey(Drittbeteiligter, on_delete=models.CASCADE, related_name='akte_verknuepfungen')
    rolle = models.CharField(max_length=100, blank=True, help_text="Rolle des Drittbeteiligten in dieser Akte")

    class Meta:
        unique_together = ('akte', 'drittbeteiligter')
        ordering = ['erstellt_am']

    def __str__(self):
        return f"{self.drittbeteiligter.name} - {self.rolle or 'Keine Rolle'} (Akte: {self.akte.aktenzeichen})"


class Akte(ZeitstempelModell):
    aktenzeichen = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="Offen")

    mandant = models.ForeignKey(Mandant, on_delete=models.PROTECT, related_name="akten")
    gegner = models.ForeignKey(Gegner, on_delete=models.PROTECT, related_name="gegner_akten")

    info_zusatz = models.JSONField(default=dict, blank=True)
    mandant_historie = models.JSONField(default=dict, blank=True)
    gegner_historie = models.JSONField(default=dict, blank=True)
    drittbeteiligte_historie = models.JSONField(default=dict, blank=True)

    dokumenten_pfad_root = models.CharField(max_length=255, blank=True)
    
    modus_operandi = models.CharField(max_length=255, blank=True)
    drittbeteiligte = models.ManyToManyField(
        Drittbeteiligter, 
        through='AkteDrittbeteiligter',
        blank=True, 
        related_name="akten"
    )

    class Meta:
        ordering = ["-aktualisiert_am"]
        # Meta-Klasse erbt automatisch von der abstrakten Klasse

    def __str__(self):
        return self.aktenzeichen

    def freeze_stammdaten(self):
        from .utils.export import export_stammdaten, export_verlauf, export_stammdaten_pdf
        
        self.mandant_historie = {
            "name": self.mandant.name,
            "adresse": self.mandant.adresse,
            "bankverbindung": self.mandant.bankverbindung,
            "telefon": self.mandant.telefon,
            "email": self.mandant.email,
            "typ": self.mandant.typ,
        }
        self.gegner_historie = {
            "name": self.gegner.name,
            "adresse": self.gegner.adresse,
            "bankverbindung": self.gegner.bankverbindung,
            "telefon": self.gegner.telefon,
            "email": self.gegner.email,
            "typ": self.gegner.typ,
        } if self.gegner else {}

        # Drittbeteiligte Historie
        drittbeteiligte_list = []
        for link in self.akte_drittbeteiligte.select_related('drittbeteiligter').all():
            drittbeteiligte_list.append({
                "name": link.drittbeteiligter.name,
                "rolle": link.rolle,
                "typ": link.drittbeteiligter.typ,
                "adresse": link.drittbeteiligter.adresse,
                "telefon": link.drittbeteiligter.telefon,
                "email": link.drittbeteiligter.email,
                "notizen": link.drittbeteiligter.notizen
            })
        self.drittbeteiligte_historie = {"drittbeteiligte": drittbeteiligte_list}
        
        # Export to files
        export_stammdaten(self)
        export_verlauf(self)
        export_stammdaten_pdf(self)


class Dokument(ZeitstempelModell):
    akte = models.ForeignKey(Akte, on_delete=models.CASCADE, related_name="dokumente")
    titel = models.CharField(max_length=255)
    dateiname = models.CharField(max_length=255)
    pfad_auf_server = models.CharField(max_length=512)
    datum = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.akte.aktenzeichen} - {self.titel}"


# Signal für Historien-Logik
@receiver(pre_save, sender=Akte)
def akte_pre_save(sender, instance, **kwargs):
    # Wenn der Status von nicht "Geschlossen" auf "Geschlossen" geändert wird
    if instance.status == "Geschlossen":
        # Nur wenn es sich um eine bereits existierende Akte handelt und der Status sich ändert
        if instance.pk:
            try:
                old_instance = Akte.objects.get(pk=instance.pk)
                if old_instance.status != "Geschlossen":
                    instance.freeze_stammdaten()
            except Akte.DoesNotExist:
                # Wenn die Akte neu ist, keine Historie erfassen
                pass
