from django.db import models
from django.utils import timezone
from aktenverwaltung.models import Akte, ZeitstempelModell

class Zahlungsposition(ZeitstempelModell):
    STATUS_CHOICES = (
        ('OFFEN', 'Offen'),
        ('ABGLEICH', 'Abgleich'),
        ('BEZAHLT', 'Bezahlt'),
        ('STORNO', 'Storno'),
    )

    akte = models.ForeignKey(Akte, on_delete=models.CASCADE, related_name='zahlungspositionen')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='OFFEN')
    betrag = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    beschreibung = models.CharField(max_length=255, blank=True)
    datum = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.akte.aktenzeichen} - {self.beschreibung} ({self.status})"
