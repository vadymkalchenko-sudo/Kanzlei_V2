from django.db import models

from aktenverwaltung.models import Akte

ZAHLUNGS_STATUS_CHOICES = (
    ("Anstehend", "Anstehend"),
    ("Ausstehend_Abgleich", "Ausstehend_Abgleich"),
    ("Abgeschlossen", "Abgeschlossen"),
)


class Zahlungsposition(models.Model):
    akte = models.ForeignKey(Akte, on_delete=models.CASCADE, related_name="zahlungen")
    betrag_soll = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    betrag_haben = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    status = models.CharField(max_length=50, choices=ZAHLUNGS_STATUS_CHOICES, default="Anstehend")
    beschreibung = models.CharField(max_length=255, blank=True)
    faellig_am = models.DateField(null=True, blank=True)
    erstellt_am = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["status", "faellig_am"]

    def __str__(self):
        return f"{self.akte.aktenzeichen} - {self.status}"
