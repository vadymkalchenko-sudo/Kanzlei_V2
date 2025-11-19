import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Dokument {
  id: number;
  titel: string;
  dateiname: string;
  pfad_auf_server: string;
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
  akteId: string | number;
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

  const fetchEintraege = async () => {
    try {
      setLoading(true);
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";

      const response = await axios.get(`${API_BASE_URL}finanzen/positionen/?akte=${akteId}`);
      setEintraege(response.data);

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

  useEffect(() => {
    fetchEintraege();
  }, [akteId]);

  const handleAddEintrag = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
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

  const handleDeleteEintrag = async (id: number) => {
    if (!window.confirm('Sind Sie sicher, dass Sie diesen Eintrag löschen möchten?')) {
      return;
    }

    try {
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";

      await axios.delete(`${API_BASE_URL}finanzen/positionen/${id}/`);
      fetchEintraege();
    } catch (err) {
      setError('Fehler beim Löschen des Eintrags');
      console.error(err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEintrag({
      ...newEintrag,
      [name]: value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const saldo = (habenSumme || 0) - (sollSumme || 0);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
          {error}
        </div>
      )}

      {/* Eingabeformular */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h5 className="font-bold text-sm uppercase tracking-wide text-text-muted mb-3">Neuer Eintrag</h5>
        <form onSubmit={handleAddEintrag} className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-1 block">Dokument</label>
            <select
              name="dokument_id"
              value={newEintrag.dokument_id || ''}
              onChange={(e) => setNewEintrag({
                ...newEintrag,
                dokument_id: e.target.value ? parseInt(e.target.value) : null
              })}
              className="input"
            >
              <option value="">Kein Dokument</option>
            </select>
          </div>

          <div className="w-32">
            <label className="text-sm font-medium mb-1 block">SOLL (€)</label>
            <input
              type="number"
              name="soll_betrag"
              step="0.01"
              value={newEintrag.soll_betrag}
              onChange={handleInputChange}
              className="input"
              placeholder="0.00"
            />
          </div>

          <div className="w-32">
            <label className="text-sm font-medium mb-1 block">HABEN (€)</label>
            <input
              type="number"
              name="haben_betrag"
              step="0.01"
              value={newEintrag.haben_betrag}
              onChange={handleInputChange}
              className="input"
              placeholder="0.00"
            />
          </div>

          <button type="submit" className="btn btn-primary">
            Hinzufügen
          </button>
        </form>
      </div>

      {/* Tabelle */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Bezeichnung</th>
              <th>Format</th>
              <th className="text-right">SOLL</th>
              <th className="text-right">HABEN</th>
              <th className="text-right">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {eintraege.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-text-muted italic">
                  Keine Einträge vorhanden.
                </td>
              </tr>
            ) : (
              eintraege.map(eintrag => (
                <tr key={eintrag.id} className="hover:bg-gray-50 transition-colors">
                  <td>{eintrag.dokument ? new Date(eintrag.dokument.erstellt_am).toLocaleDateString() : new Date(eintrag.erstellt_am).toLocaleDateString()}</td>
                  <td className="font-medium">{eintrag.dokument ? eintrag.dokument.titel : 'Manuelle Buchung'}</td>
                  <td>
                    {eintrag.dokument ? (
                      <span className="badge bg-blue-100 text-blue-800">
                        {eintrag.dokument.dateiname.split('.').pop()?.toUpperCase()}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="text-right text-red-600 font-medium">
                    {eintrag.soll_betrag ? `${Number(eintrag.soll_betrag).toFixed(2)} €` : '-'}
                  </td>
                  <td className="text-right text-green-600 font-medium">
                    {eintrag.haben_betrag ? `${Number(eintrag.haben_betrag).toFixed(2)} €` : '-'}
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleDeleteEintrag(eintrag.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Löschen
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot className="bg-gray-50 font-bold">
            <tr>
              <td colSpan={3} className="text-right">Summen:</td>
              <td className="text-right text-red-700">{Number(sollSumme || 0).toFixed(2)} €</td>
              <td className="text-right text-green-700">{Number(habenSumme || 0).toFixed(2)} €</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Zusammenfassung */}
      <div className="flex justify-end">
        <div className={`p-4 rounded-lg border ${saldo >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-text-muted uppercase tracking-wide">Aktueller Saldo:</span>
            <span className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {Number(saldo).toFixed(2)} €
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanzTabelle;