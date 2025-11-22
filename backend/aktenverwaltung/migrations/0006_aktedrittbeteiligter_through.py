# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('aktenverwaltung', '0005_akte_drittbeteiligte_akte_modus_operandi'),
    ]

    operations = [
        # Remove old M2M field
        migrations.RemoveField(
            model_name='akte',
            name='drittbeteiligte',
        ),
        # Create intermediate model
        migrations.CreateModel(
            name='AkteDrittbeteiligter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('erstellt_am', models.DateTimeField(auto_now_add=True)),
                ('aktualisiert_am', models.DateTimeField(auto_now=True)),
                ('rolle', models.CharField(blank=True, help_text='Rolle des Drittbeteiligten in dieser Akte', max_length=100)),
                ('akte', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='akte_drittbeteiligte', to='aktenverwaltung.akte')),
                ('drittbeteiligter', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='akte_verknuepfungen', to='aktenverwaltung.drittbeteiligter')),
            ],
            options={
                'ordering': ['erstellt_am'],
                'unique_together': {('akte', 'drittbeteiligter')},
            },
        ),
        # Add new M2M field with through
        migrations.AddField(
            model_name='akte',
            name='drittbeteiligte',
            field=models.ManyToManyField(blank=True, related_name='akten', through='aktenverwaltung.AkteDrittbeteiligter', to='aktenverwaltung.drittbeteiligter'),
        ),
    ]
