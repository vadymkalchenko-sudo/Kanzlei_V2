# Kanzlei V2 – Entwicklungsumgebung

## Services starten
- `.env` auf Basis von `backend/env.example` erstellen (mindestens `DJANGO_SECRET_KEY`, `POSTGRES_*`, `KANZELEI_DOCS_ROOT` setzen).
- Docker Stack: `docker compose up -d` (Ports 5433, 8000, 3003).
- Migrationen (falls nötig): `docker compose run --rm backend python manage.py migrate`.

## Tests & Linting
| Kontext | Befehl | Beschreibung |
| --- | --- | --- |
| Backend Tests | `cd backend && python -m pip install -r requirements-dev.txt && pytest` | Django/pytest Suite |
| Backend Lint | `ruff check backend` | Einfache PEP8/Imports-Prüfung |
| Frontend Lint | `cd frontend && npm run lint` | ESLint + TS |
| Frontend Format | `npm run format` | Prettier |

## Secrets & Pfade
- Credentials niemals einchecken; Environment-Dateien lokal oder per Secret-Store verteilen.
- `KANZELEI_DOCS_ROOT` muss auf ein persistent gemountetes Volume zeigen (Docker Compose nutzt `docs_storage`). Uploads laufen via `POST /api/akten/{id}/dokumente/` (multipart Feld `datei`, optional `titel`).
- JWT/Token Keys getrennt verwalten (z.B. `DJANGO_SECRET_KEY`, zukünftige `JWT_SECRET`).

## API Endpunkte

### /api/zahlungen/

*   **GET /api/zahlungen/**: Ruft eine Liste von Zahlungspositionen ab.
    *   **Filter:**
        *   `status`: Filtert nach dem Status der Zahlungsposition. Mögliche Werte sind: `OFFEN`, `ABGLEICH`, `BEZAHLT`, `STORNO`.
        *   Beispiel: `/api/zahlungen/?status=ABGLEICH`
*   **POST /api/zahlungen/**: Erstellt eine neue Zahlungsposition.
*   **GET /api/zahlungen/{id}/**: Ruft eine bestimmte Zahlungsposition ab.
*   **PUT /api/zahlungen/{id}/**: Aktualisiert eine Zahlungsposition.
*   **DELETE /api/zahlungen/{id}/**: Löscht eine Zahlungsposition.
