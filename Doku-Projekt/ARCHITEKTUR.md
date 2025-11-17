# ARCHITEKTUR.md: Komponenten-Karte und Datenfluss

## 1. Schichtenarchitektur
Das System folgt einer **lose gekoppelten 3-Schicht-Architektur** (Client/Server/Datenbank).

### A. Frontend (React/SPA)
- **Zuständigkeit:** Darstellung, Validierung der Eingaben, Auslösen von API-Calls.
- **Beispiel-Fluss:** Benutzer klickt auf "Akte Anlegen" -> `FRONTEND_CLICK_HANDLER.js` sendet POST an den Backend-Endpunkt `/api/akten/`.

### B. Backend (Django / DRF)
- **Zuständigkeit:** Geschäftslogik, Autorisierung, Datenbank-CRUD, Konfliktprüfung (Harte Regeln).
- **Beispiel-Fluss:** Endpunkt `/api/akten/` (aus `AKTE_ROUTES.py`) erhält Daten -> `DB_CONNECTOR.py` wird aufgerufen -> ORM-Logik (`DATENMODELLE.py`) wird ausgeführt.

### C. Datenbank (PostgreSQL)
- **Zuständigkeit:** Datenpersistenz, Indizierung, JSONB-Speicherung.

## 2. Modul-Trennung (Django Apps)
- **`aktenverwaltung`:** Kernmodelle (Akte, Mandant, Dokument, Konfliktprüfung).
- **`organizer`:** Lose gekoppelte Logik (Aufgaben, Fristen, Notizen).
- **`finanzen`:** Soll/Haben-Tracking, Zahlungspositionen.
- **`security`:** JWT, Rollen (Admin, User, Betrachter), Permission Classes.