import React, { useState } from 'react';
import axios from 'axios';

interface TestErgebnis {
  id: number;
  name: string;
 erfolgreich: boolean;
 nachricht: string;
  datum: string;
}

const KonfliktHistorienTests: React.FC = () => {
  const [ergebnisse, setErgebnisse] = useState<TestErgebnis[]>([]);
  const [loading, setLoading] = useState(false);

  // Testet das Konfliktprüfungs-Feature
 const testKonfliktPruefung = async () => {
    setLoading(true);
    const testErgebnis: TestErgebnis = {
      id: Date.now(),
      name: 'Konfliktprüfung: Mandant als Gegner in offener Akte',
      erfolgreich: false,
      nachricht: '',
      datum: new Date().toISOString()
    };

    try {
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";

      // Erstelle einen Mandanten
      const mandantResponse = await axios.post(`${API_BASE_URL}adressbuch/mandanten/`, {
        name: `TestMandant_${Date.now()}`,
        adresse: 'Testadresse',
        bankverbindung: 'Testbank',
        telefon: '123456789',
        email: 'test@example.com',
        typ: 'Person'
      });

      // Erstelle einen Gegner mit dem gleichen Namen
      const gegnerResponse = await axios.post(`${API_BASE_URL}adressbuch/gegner/`, {
        name: `TestMandant_${Date.now()}`, // Gleicher Name wie Mandant
        adresse: 'Testadresse',
        bankverbindung: 'Testbank',
        telefon: '123456789',
        email: 'test@example.com',
        typ: 'Person'
      });

      // Versuche, eine Akte mit diesem Mandanten und Gegner zu erstellen
      const akteResponse = await axios.post(`${API_BASE_URL}akten/`, {
        aktenzeichen: `TEST.${new Date().getFullYear()}.awr`,
        status: 'Offen',
        mandant: mandantResponse.data.id,
        gegner: gegnerResponse.data.id
      });

      // Wenn die Akte erfolgreich erstellt wurde, bedeutet das, dass die Konfliktprüfung fehlgeschlagen ist
      if (akteResponse.status === 201) {
        testErgebnis.nachricht = 'Fehler: Konfliktprüfung hat nicht funktioniert - Akte mit Mandant als Gegner wurde erstellt';
        testErgebnis.erfolgreich = false;
      } else {
        testErgebnis.nachricht = 'Erfolg: Konfliktprüfung hat funktioniert - Akte mit Mandant als Gegner wurde nicht erstellt';
        testErgebnis.erfolgreich = true;
      }
    } catch (error: any) {
      // Wenn ein Validierungsfehler auftritt, war die Konfliktprüfung erfolgreich
      if (error.response && error.response.data && error.response.data.konflikt) {
        testErgebnis.nachricht = 'Erfolg: Konfliktprüfung hat funktioniert - ' + error.response.data.konflikt;
        testErgebnis.erfolgreich = true;
      } else {
        testErgebnis.nachricht = 'Fehler: Unbekannter Fehler bei der Konfliktprüfung - ' + error.message;
        testErgebnis.erfolgreich = false;
      }
    }

    setErgebnisse(prev => [testErgebnis, ...prev]);
    setLoading(false);
  };

  // Testet die Historien-Logik
 const testHistorienLogik = async () => {
    setLoading(true);
    const testErgebnis: TestErgebnis = {
      id: Date.now(),
      name: 'Historien-Logik: Stammdaten-Einfrieren bei Status "Geschlossen"',
      erfolgreich: false,
      nachricht: '',
      datum: new Date().toISOString()
    };

    try {
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";

      // Erstelle einen Mandanten
      const mandantResponse = await axios.post(`${API_BASE_URL}adressbuch/mandanten/`, {
        name: `TestMandant_Historie_${Date.now()}`,
        adresse: 'Testadresse Historie',
        bankverbindung: 'Testbank Historie',
        telefon: '987654321',
        email: 'testhistorie@example.com',
        typ: 'Person'
      });

      // Erstelle einen Gegner
      const gegnerResponse = await axios.post(`${API_BASE_URL}adressbuch/gegner/`, {
        name: `TestGegner_Historie_${Date.now()}`,
        adresse: 'Testadresse Gegner',
        bankverbindung: 'Testbank Gegner',
        telefon: '987654321',
        email: 'testgegner@example.com',
        typ: 'Person'
      });

      // Erstelle eine Akte
      const akteResponse = await axios.post(`${API_BASE_URL}akten/`, {
        aktenzeichen: `TESTHIST.${new Date().getFullYear()}.awr`,
        status: 'Offen',
        mandant: mandantResponse.data.id,
        gegner: gegnerResponse.data.id
      });

      // Ändere die Stammdaten des Mandanten
      const updatedMandant = {
        ...mandantResponse.data,
        name: 'Geänderter Mandant Name',
        adresse: 'Geänderte Adresse'
      };
      await axios.put(`${API_BASE_URL}adressbuch/mandanten/${mandantResponse.data.id}/`, updatedMandant);

      // Schließe die Akte
      await axios.post(`${API_BASE_URL}akten/${akteResponse.data.id}/schliessen/`);

      // Lade die Akte erneut, um zu prüfen, ob die Historie gespeichert wurde
      const updatedAkte = await axios.get(`${API_BASE_URL}akten/${akteResponse.data.id}/`);

      if (updatedAkte.data.mandant_historie && updatedAkte.data.mandant_historie.name) {
        testErgebnis.nachricht = 'Erfolg: Historien-Logik funktioniert - Stammdaten wurden eingefroren';
        testErgebnis.erfolgreich = true;
      } else {
        testErgebnis.nachricht = 'Fehler: Historien-Logik funktioniert nicht - Stammdaten wurden nicht eingefroren';
        testErgebnis.erfolgreich = false;
      }
    } catch (error: any) {
      testErgebnis.nachricht = 'Fehler: Unbekannter Fehler bei der Historien-Logik - ' + error.message;
      testErgebnis.erfolgreich = false;
    }

    setErgebnisse(prev => [testErgebnis, ...prev]);
    setLoading(false);
  };

  return (
    <div className="konflikt-historien-tests">
      <h2>Tests für Konfliktprüfung und Historien-Logik</h2>
      
      <div className="test-buttons">
        <button 
          onClick={testKonfliktPruefung}
          disabled={loading}
          className="btn btn-primary"
        >
          Konfliktprüfung testen
        </button>
        <button 
          onClick={testHistorienLogik}
          disabled={loading}
          className="btn btn-primary"
        >
          Historien-Logik testen
        </button>
      </div>
      
      {loading && <p>Tests laufen...</p>}
      
      <div className="test-ergebnisse">
        <h3>Testergebnisse</h3>
        {ergebnisse.length === 0 ? (
          <p>Noch keine Tests durchgeführt</p>
        ) : (
          <table className="ergebnisse-table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Test</th>
                <th>Status</th>
                <th>Nachricht</th>
              </tr>
            </thead>
            <tbody>
              {ergebnisse.map(ergebnis => (
                <tr key={ergebnis.id}>
                  <td>{new Date(ergebnis.datum).toLocaleString()}</td>
                  <td>{ergebnis.name}</td>
                  <td>
                    <span className={ergebnis.erfolgreich ? 'status-ok' : 'status-error'}>
                      {ergebnis.erfolgreich ? 'Erfolgreich' : 'Fehlgeschlagen'}
                    </span>
                  </td>
                  <td>{ergebnis.nachricht}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default KonfliktHistorienTests;