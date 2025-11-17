# Kanzlei-Software

## Projektübersicht
Diese Software ist eine umfassende Lösung für die Verwaltung einer Anwaltskanzlei. Sie digitalisiert und optimiert zentrale Geschäftsprozesse wie die Aktenverwaltung, Finanzübersichten, Sicherheitsmanagement und Terminplanung. Das System ist modular aufgebaut, um Flexibilität und Skalierbarkeit zu gewährleisten.

## Architektur
Das Backend der Kanzlei-Software basiert auf Django und ist in mehrere Apps unterteilt, die jeweils spezifische Funktionalitäten bereitstellen:

*   [`aktenverwaltung`](backend/aktenverwaltung/): Verwaltet alle relevanten Informationen zu den Mandantenakten.
*   [`security`](backend/security/): Verantwortlich für Authentifizierung, Autorisierung und Benutzerverwaltung.
*   [`finanzen`](backend/finanzen/): Behandelt alle finanziellen Aspekte, Rechnungen und Zahlungseingänge.
*   [`storage`](backend/aktenverwaltung/storage.py): Ermöglicht die sichere Speicherung und den Abruf von Dokumenten und Dateien.
*   [`organizer`](backend/organizer/): Bietet Funktionen zur Terminplanung und Aufgabenverwaltung.

## Implementierte Features (Backend Core)
*   **JSONB-Datenstruktur:** Flexible und erweiterbare Speicherung von Akteninformationen in einer JSONB-Spalte.
*   **JWT-Authentifizierung:** Sichere Benutzerauthentifizierung mittels JSON Web Tokens.
*   **Rollenbasierte Berechtigungen:** Implementierung von Benutzerrollen (Admin, Sachbearbeiter, Mandant) mit entsprechenden Zugriffsrechten.
*   **Finanz-CRUD:** Vollständige Funktionen zum Erstellen, Lesen, Aktualisieren und Löschen von Finanzdaten.
*   **Storage-CRUD:** Vollständige Funktionen zum Verwalten von gespeicherten Dokumenten und Dateien.

## Setup-Anleitung

### Voraussetzungen
*   Python 3.11 oder 3.12
*   `venv` (virtuelle Umgebung)

### Installation und Start
1.  **Virtuelle Umgebung erstellen und aktivieren:**
    ```bash
    python -m venv venv
    # Unter Windows:
    .\venv\Scripts\activate
    # Unter macOS/Linux:
    source venv/bin/activate
    ```

2.  **Abhängigkeiten installieren:**
    ```bash
    pip install -r backend/requirements.txt
    ```

3.  **Datenbankmigrationen durchführen:**
    ```bash
    python backend/manage.py migrate
    ```

4.  **Testbenutzer erstellen:**
    ```bash
    python backend/manage.py create_test_users
    ```

5.  **Django-Server starten:**
    ```bash
    python backend/manage.py runserver
    ```

### Tests ausführen
Um die Tests auszuführen, stellen Sie sicher, dass die virtuelle Umgebung aktiviert ist und führen Sie folgenden Befehl aus:
```bash
pytest backend/
```

## Test-Zugangsdaten

Für Testzwecke stehen folgende Benutzer zur Verfügung:

*   **Admin:**
    *   `Username`: `admin`
    *   `Password`: `adminpassword`
*   **Sachbearbeiter:**
    *   `Username`: `sachbearbeiter`
    *   `Password`: `sachbearbeiterpassword`
*   **Mandant:**
    *   `Username`: `mandant`
    *   `Password`: `mandantpassword`
