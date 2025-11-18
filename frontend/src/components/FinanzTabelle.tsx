import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Dokument {
  id: number;
  titel: string;
  dateiname: string;
  pfad_auf_server: string;
  erstellt_am: string;
}

interface Zahlungsposition {
  id: number;
  soll_betrag: number | null;
  haben_betrag: number | null;
  dokument_id: number | null;
  erstellt_am: string;
}

interface FinanzEintrag {
  id: number;
  dokument: Dokument | null;
  soll_betrag: number | null;
  haben_betrag: number | null;
  erstellt_am: string;
}

interface FinanzTabelleProps {
  akteId: number;
}

const FinanzTabelle: React.FC<FinanzTabelleProps> = ({ akteId }) => {
  const [eintraege, setEintraege] = useState<FinanzEintrag[]>([]);
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
  const [sollSumme, setSollSumme] = useState<number>(0);
  const [habenSumme, setHabenSumme] = useState<number>(0);
  const [newEintrag, setNewEintrag] = useState({
    dokument_id: null as number | null,
    soll_betrag: '',
    haben_betrag: ''
 });

  // Funktion zum Abrufen der Finanzeinträge
  const fetchEintraege = async () => {
    try {
      setLoading(true);
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      // Hole Finanzeinträge für die Akte
      const response = await axios.get(`${API_BASE_URL}finanzen/positionen/?akte=${akteId}`);
      setEintraege(response.data);
      
      // Berechne Summen
      const gesamtSoll = response.data
        .filter((e: FinanzEintrag) => e.soll_betrag !== null)
        .reduce((sum: number, e: FinanzEintrag) => sum + (e.soll_betrag || 0), 0);
      
      const gesamtHaben = response.data
        .filter((e: FinanzEintrag) => e.haben_betrag !== null)
        .reduce((sum: number, e: FinanzEintrag) => sum + (e.haben_betrag || 0), 0);
      
      setSollSumme(gesamtSoll);
      setHabenSumme(gesamtHaben);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Finanzdaten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lade Einträge beim Mounten der Komponente
  useEffect(() => {
    fetchEintraege();
  }, [akteId]);

  // Behandelt das Hinzufügen eines neuen Eintrags
  const handleAddEintrag = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      const payload = {
        akte: akteId,
        dokument: newEintrag.dokument_id,
        soll_betrag: newEintrag.soll_betrag ? parseFloat(newEintrag.soll_betrag) : null,
        haben_betrag: newEintrag.haben_betrag ? parseFloat(newEintrag.haben_betrag) : null
      };
      
      await axios.post(`${API_BASE_URL}finanzen/positionen/`, payload);
      
      // Zurücksetzen und neu laden
      setNewEintrag({
        dokument_id: null,
        soll_betrag: '',
        haben_betrag: ''
      });
      fetchEintraege();
    } catch (err) {
      setError('Fehler beim Hinzufügen des Eintrags');
      console.error(err);
    }
  };

  // Behandelt das Löschen eines Eintrags
  const handleDeleteEintrag = async (id: number) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?')) {
      return;
    }
    
    try {
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      await axios.delete(`${API_BASE_URL}finanzen/positionen/${id}/`);
      fetchEintraege(); // Neu laden nach dem Löschen
    } catch (err) {
      setError('Fehler beim Löschen des Eintrags');
      console.error(err);
    }
  };

  // Behandelt Änderungen im Formular
 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEintrag({
      ...newEintrag,
      [name]: value
    });
  };

  if (loading) {
    return <div className="finanz-tabelle">Lade Finanzdaten...</div>;
  }

  return (
    <div className="finanz-tabelle">
      <h4>Dokumenten- und Finanz-Übersicht</h4>
      
      {error && <div className="error">Fehler: {error}</div>}
      
      <form onSubmit={handleAddEintrag} className="finanz-form">
        <div className="form-group">
          <label htmlFor="dokument_id">Dokument:</label>
          <select
            id="dokument_id"
            name="dokument_id"
            value={newEintrag.dokument_id || ''}
            onChange={(e) => setNewEintrag({
              ...newEintrag,
              dokument_id: e.target.value ? parseInt(e.target.value) : null
            })}
          >
            <option value="">Kein Dokument</option>
            {/* Hier würden Dokumente aus der Akte geladen werden */}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="soll_betrag">SOLL-Betrag:</label>
          <input
            type="number"
            id="soll_betrag"
            name="soll_betrag"
            step="0.01"
            value={newEintrag.soll_betrag}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="haben_betrag">HABEN-Betrag:</label>
          <input
            type="number"
            id="haben_betrag"
            name="haben_betrag"
            step="0.01"
            value={newEintrag.haben_betrag}
            onChange={handleInputChange}
          />
        </div>
        
        <button type="submit" className="btn btn-primary">Hinzufügen</button>
      </form>

      <table className="finanz-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Bezeichnung</th>
            <th>Format</th>
            <th>SOLL</th>
            <th>HABEN</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {eintraege.map(eintrag => (
            <tr key={eintrag.id}>
              <td>{eintrag.dokument ? new Date(eintrag.dokument.erstellt_am).toLocaleDateString() : new Date(eintrag.erstellt_am).toLocaleDateString()}</td>
              <td>{eintrag.dokument ? eintrag.dokument.titel : 'Kein Dokument'}</td>
              <td>{eintrag.dokument ? eintrag.dokument.dateiname.split('.').pop()?.toUpperCase() : '-'}</td>
              <td>{eintrag.soll_betrag !== null ? `${eintrag.soll_betrag.toFixed(2)} €` : '-'}</td>
              <td>{eintrag.haben_betrag !== null ? `${eintrag.haben_betrag.toFixed(2)} €` : '-'}</td>
              <td>
                <button 
                  onClick={() => handleDeleteEintrag(eintrag.id)}
                  className="btn btn-small btn-danger"
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="finanz-summen">
        <p><strong>Gesamt SOLL: {sollSumme.toFixed(2)} €</strong></p>
        <p><strong>Gesamt HABEN: {habenSumme.toFixed(2)} €</strong></p>
        <p><strong>Saldo: {(habenSumme - sollSumme).toFixed(2)} €</strong></p>
      </div>
    </div>
  );
};

export default FinanzTabelle;