import { FormEvent, useState } from "react";

import { updateAkteZusatzinfo } from "../services/api";

const initialJson = JSON.stringify(
  {
    prioritaet: "hoch",
    notizen: "Neuer Fristablauf prüfen",
  },
  null,
  2,
);

type Zusatzdaten = Record<string, unknown>;

function parseJsonInput(input: string): Zusatzdaten {
  const parsed = JSON.parse(input) as unknown;
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("JSON muss ein Objekt sein.");
  }
  return parsed as Zusatzdaten;
}

function AkteForm() {
  const [akteId, setAkteId] = useState("");
  const [jsonInput, setJsonInput] = useState(initialJson);
  const [statusText, setStatusText] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusText("Sende Anfrage...");

    const submit = async () => {
      try {
        const payload = parseJsonInput(jsonInput);
        await updateAkteZusatzinfo(akteId, payload);
        setStatusText("Zusatzinformationen erfolgreich gespeichert.");
      } catch (error) {
        if (error instanceof SyntaxError) {
          setStatusText("JSON-Format ungültig.");
        } else if (error instanceof Error) {
          setStatusText(error.message);
        } else {
          setStatusText("Unbekannter Fehler.");
        }
      }
    };

    void submit();
  };

  return (
    <form onSubmit={handleSubmit} className="akte-form">
      <label>
        Akten-ID
        <input
          value={akteId}
          onChange={(event) => setAkteId(event.target.value)}
          placeholder="z.B. 42"
          required
        />
      </label>

      <label>
        JSONB-Zusatzdaten
        <textarea
          value={jsonInput}
          onChange={(event) => setJsonInput(event.target.value)}
          rows={10}
        />
      </label>

      <button type="submit">Zusatzinfo speichern</button>

      {statusText && <p className="status">{statusText}</p>}
    </form>
  );
}

export default AkteForm;

