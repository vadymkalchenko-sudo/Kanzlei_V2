# Kanzlei-Management-System

## Projektübersicht
Diese Software ist eine umfassende Lösung für die Verwaltung einer Anwaltskanzlei. Sie digitalisiert und optimiert zentrale Geschäftsprozesse wie die Aktenverwaltung, Finanzübersichten, Sicherheitsmanagement und Terminplanung. Das System ist modular aufgebaut, um Flexibilität und Skalierbarkeit zu gewährleisten.

## Technologie-Stack
- **Backend**: Django 5.1 + Django REST Framework
- **Frontend**: React 18 + TypeScript + Vite
- **Datenbank**: PostgreSQL 16
- **Deployment**: Docker + Docker Compose
- **Authentifizierung**: JWT (JSON Web Tokens)

## Architektur
Das Backend der Kanzlei-Software basiert auf Django und ist in mehrere Apps unterteilt, die jeweils spezifische Funktionalitäten bereitstellen:

*   [`aktenverwaltung`](backend/aktenverwaltung/): Verwaltet alle relevanten Informationen zu den Mandantenakten, inkl. Dokumenten-Management
*   [`security`](backend/security/): Verantwortlich für Authentifizierung, Autorisierung und Benutzerverwaltung
*   [`finanzen`](backend/finanzen/): Behandelt alle finanziellen Aspekte, Rechnungen und Zahlungseingänge
*   [`storage`](backend/aktenverwaltung/storage.py): Ermöglicht die sichere Speicherung und den Abruf von Dokumenten und Dateien
*   [`organizer`](backend/organizer/): Bietet Funktionen zur Terminplanung, Aufgabenverwaltung und Dashboard

## Implementierte Features

### Backend
*   **JSONB-Datenstruktur:** Flexible und erweiterbare Speicherung von Akteninformationen
*   **JWT-Authentifizierung:** Sichere Benutzerauthentifizierung mittels JSON Web Tokens
*   **Rollenbasierte Berechtigungen:** Admin, Sachbearbeiter, Mandant mit entsprechenden Zugriffsrechten
*   **Finanz-CRUD:** Vollständige Verwaltung von Finanzdaten
*   **Dokumenten-Management:** Upload, Download, Bearbeitung und Löschung von Dokumenten
*   **Dashboard-API:** Priorisierte Fristen mit Aktenzeichen und Tage-bis-Frist-Berechnung

### Frontend
*   **Moderne React-UI:** Responsives Design mit Tailwind CSS
*   **Dokumenten-Verwaltung:**
    - Drag & Drop Upload
    - Inline-Bearbeitung (Titel & Datum)
    - Direktes Öffnen von PDFs im Browser
    - Löschen-Funktion mit Bestätigung
    - Automatische Listen-Aktualisierung
*   **Dashboard:** Übersicht über offene Aufgaben und Fristen
*   **Benachrichtigungen:** Echtzeit-Anzeige priorisierter Fristen
*   **Organizer:** Aufgaben, Fristen und Notizen pro Akte

## Setup-Anleitung

### Voraussetzungen
*   Docker Desktop (Windows/macOS) oder Docker Engine + Docker Compose (Linux)
*   Git

### Installation und Start mit Docker

1.  **Repository klonen:**
    ```bash
    git clone <repository-url>
    cd Kanzlei_V2
    ```

2.  **Umgebungsvariablen konfigurieren:**
    ```bash
    # .env Datei im Hauptverzeichnis erstellen (falls nicht vorhanden)
    # Beispiel-Konfiguration:
    POSTGRES_DB=kanzlei_db
    POSTGRES_USER=kanzlei_user
    POSTGRES_PASSWORD=secure_password
    DJANGO_SECRET_KEY=your-secret-key-here
    KANZELEI_DOCS_ROOT=/app/kanzlei_docs
    ```

3.  **Container starten:**
    ```bash
    docker-compose up -d
    ```

4.  **Datenbankmigrationen durchführen:**
    ```bash
    docker-compose exec backend python manage.py migrate
    ```

5.  **Testbenutzer erstellen:**
    ```bash
    docker-compose exec backend python manage.py create_test_users
    ```

6.  **Anwendung öffnen:**
    - Frontend: http://localhost:3003
    - Backend API: http://localhost:8000/api/

### Container-Verwaltung
```bash
# Container stoppen
docker-compose stop

# Container neu starten
docker-compose restart

# Logs anzeigen
docker-compose logs -f

# Container entfernen
docker-compose down
```

### Entwicklung ohne Docker (Optional)
Für lokale Entwicklung ohne Docker siehe [DEVELOPMENT.md](DEVELOPMENT.md)

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
