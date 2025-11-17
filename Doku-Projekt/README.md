# README.md: Kanzlei-Management-System (KMS)

## 1. Projektübersicht
Dies ist ein revisionssicheres KMS für das Verkehrsrecht. Fokus liegt auf historischer Datenintegrität, automatisierter Priorisierung und strikter Konfliktprüfung (Mandant vs. Gegner).

## 2. Technischer Stack
- Backend: Python (Django / DRF)
- Datenbank: PostgreSQL (mit JSONB)
- Frontend: React (TypeScript)
- Orchestrierung: Docker Compose

## 3. Kernfunktionen & Geschäftslogik
### Dashboard & Priorisierung
- Standard-Sortierung: Akten werden nach der **Dringlichkeit der nächsten Frist** sortiert.
- Zahlungsfilterung: Filtert auf **Zahlungspositionen** mit dem Status **"Ausstehend_Abgleich"**.

### Historische Datenintegrität (Freezing State)
Beim Statuswechsel der Akte auf 'Geschlossen' werden die relevanten Mandanten- und Gegnerdaten (Name, Adresse, Bank) aus den Stammdatentabellen in die **JSONB-Historienfelder** der Akte kopiert (Snapshot).

### Konfliktprüfung (Harte Regel)
Das System **verweigert** das Anlegen einer Akte, wenn der zugewiesene Mandant bereits als **Gegner** in einer **offenen Akte** existiert (409 Conflict).

## 4. Konfiguration & Start (KRITISCH)
- **Zugangsdateien:** Müssen separat in `./config/.env` als Environment Variables hinterlegt werden.
- **Dokumentenpfad:** Definiert durch die ENV-Variable `KANZELEI_DOCS_ROOT`. Ablage in Unterordnern, benannt nach dem Aktenzeichen.