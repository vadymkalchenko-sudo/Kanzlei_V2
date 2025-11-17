# Architekturübersicht Kanzlei-Software

Diese Dokumentation beschreibt die Architektur und die Verantwortlichkeiten der einzelnen Django-Apps im Backend der Kanzlei-Software.

## 1. Überblick

Das Backend ist modular aufgebaut und besteht aus mehreren unabhängigen Django-Anwendungen, die über definierte Schnittstellen miteinander interagieren. Dies ermöglicht eine klare Trennung der Zuständigkeiten, eine bessere Wartbarkeit und eine einfachere Skalierbarkeit des Systems.

## 2. Django Apps und deren Verantwortlichkeiten

### 2.1. [`aktenverwaltung`](backend/aktenverwaltung/)
*   **Zuständigkeit:** Kernmodul zur Verwaltung aller Mandantenakten.
*   **Funktionen:**
    *   Erstellung, Abruf, Aktualisierung und Löschen von Akten.
    *   Verwaltung von Aktenstammdaten.
    *   Schnittstelle zur `storage`-App für die Dateiverwaltung innerhalb einer Akte.
    *   Definition der flexiblen JSONB-Datenstruktur für Akteninhalte.

### 2.2. [`security`](backend/security/)
*   **Zuständigkeit:** Authentifizierung, Autorisierung und Benutzerverwaltung.
*   **Funktionen:**
    *   JWT-basierte Authentifizierung.
    *   Verwaltung von Benutzerkonten (Admin, Sachbearbeiter, Mandant).
    *   Rollenbasierte Zugriffskontrolle und Berechtigungen für verschiedene Aktionen und Daten.
    *   Passwort-Hashing und sichere Speicherung von Benutzerdaten.

### 2.3. [`finanzen`](backend/finanzen/)
*   **Zuständigkeit:** Finanzielle Transaktionen und Rechnungsverwaltung.
*   **Funktionen:**
    *   Erfassung und Verwaltung von Einnahmen und Ausgaben.
    *   Generierung und Verwaltung von Rechnungen.
    *   Verwaltung von Zahlungspositionen und Zahlungsstatus.
    *   Berichtsfunktionen für Finanzübersichten.

### 2.4. [`storage`](backend/aktenverwaltung/storage.py)
*   **Zuständigkeit:** Sichere Speicherung und Verwaltung von Dokumenten und Dateien.
*   **Funktionen:**
    *   Hochladen, Herunterladen und Löschen von Dateien.
    *   Verknüpfung von Dateien mit spezifischen Akten.
    *   Metadatenverwaltung für gespeicherte Dokumente.
    *   Sicherstellung der Datenintegrität und des Zugriffsmanagements.
    *   *Hinweis:* Aktuell ist die `storage`-Logik in der `aktenverwaltung`-App integriert, soll aber perspektivisch als eigenständige App ausgelagert werden.

### 2.5. [`organizer`](backend/organizer/)
*   **Zuständigkeit:** Termin- und Aufgabenverwaltung.
*   **Funktionen:**
    *   Erstellung und Verwaltung von Terminen und Fristen.
    *   Zuweisung von Aufgaben zu Benutzern.
    *   Erinnerungsfunktionen.
    *   Kalenderintegration (zukünftig).

## 3. JSONB-Akte-Struktur

Die `aktenverwaltung`-App nutzt eine flexible JSONB-Datenstruktur in der PostgreSQL-Datenbank, um die Inhalte von Akten zu speichern. Dies ermöglicht es, schemalose oder semi-strukturierte Daten effizient zu verwalten und auf Änderungen in den Aktenanforderungen schnell zu reagieren, ohne dass aufwendige Datenmigrationen oder Schemaänderungen erforderlich sind.

**Beispiel einer JSONB-Struktur für eine Akte:**

```json
{
  "mandant_details": {
    "name": "Max Mustermann",
    "adresse": "Musterstraße 1, 12345 Musterstadt",
    "kontakt": {
      "email": "max.mustermann@example.com",
      "telefon": "0123-456789"
    }
  },
  "fall_details": {
    "fall_nummer": "F-2023-001",
    "fall_typ": "Familienrecht",
    "beschreibung": "Scheidungsverfahren mit Vermögensauseinandersetzung.",
    "status": "In Bearbeitung",
    "bearbeiter": "sachbearbeiter"
  },
  "dokumente": [
    {
      "dokument_id": "DOC-001",
      "titel": "Ehevertrag",
      "datum": "2022-01-15",
      "typ": "Vertrag",
      "ablageort": "storage/F-2023-001/ehevertrag.pdf"
    },
    {
      "dokument_id": "DOC-002",
      "titel": "Gerichtsbescheid",
      "datum": "2023-03-10",
      "typ": "Bescheid",
      "ablageort": "storage/F-2023-001/gerichtsbescheid.pdf"
    }
  ],
  "kommunikation": [
    {
      "typ": "E-Mail",
      "datum": "2023-01-20",
      "betreff": "Erste Kontaktaufnahme",
      "absender": "max.mustermann@example.com",
      "inhalt": "Sehr geehrte Kanzlei, ich benötige rechtliche Unterstützung..."
    },
    {
      "typ": "Telefonat",
      "datum": "2023-01-22",
      "beteiligte": ["Sachbearbeiter", "Mandant"],
      "notizen": "Besprechung der Fall Details und nächster Schritte."
    }
  ]
}
```

Diese Struktur ermöglicht es, beliebige Schlüssel-Wert-Paare und verschachtelte Objekte zu speichern, was die Flexibilität bei der Darstellung komplexer Akteninformationen erheblich erhöht.