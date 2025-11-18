import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Typdefinitionen
interface Mandant {
  id: number;
  name: string;
  adresse: string;
  bankverbindung: string;
  telefon: string;
  email: string;
  typ: string;
}

interface Gegner {
  id: number;
  name: string;
  adresse: string;
  bankverbindung: string;
  telefon: string;
  email: string;
  typ: string;
}

interface Akte {
  id: number;
  aktenzeichen: string;
  status: string;
  mandant: Mandant;
  gegner: Gegner;
  erstellt_am: string;
  aktualisiert_am: string;
}

const Dashboard: React.FC = () => {
  const [akten, setAkten] = useState<Akte[]>([]);
  const [filteredAkten, setFilteredAkten] = useState<Akte[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Funktion zum Abrufen der Akten
  const fetchAkten = async () => {
    try {
      setLoading(true);
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      const response = await axios.get(`${API_BASE_URL}akten/`);
      // Sortiere nach Erstellungsdatum (neueste zuerst)
      const sortedAkten = response.data.sort((a: Akte, b: Akte) => 
        new Date(b.erstellt_am).getTime() - new Date(a.erstellt_am).getTime()
      );
      setAkten(sortedAkten);
      setFilteredAkten(sortedAkten);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Akten');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lade Akten beim Mounten der Komponente
  useEffect(() => {
    fetchAkten();
  }, []);

  // Filtere Akten basierend auf Suchbegriff
  useEffect(() => {
    if (!searchTerm) {
      setFilteredAkten(akten);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = akten.filter(akte => 
        akte.aktenzeichen.toLowerCase().includes(term) ||
        akte.mandant.name.toLowerCase().includes(term) ||
        akte.gegner.name.toLowerCase().includes(term) ||
        akte.status.toLowerCase().includes(term)
      );
      setFilteredAkten(filtered);
    }
  }, [searchTerm, akten]);

  // Behandelt den Doppelklick auf eine Akte
  const handleAkteDoubleClick = (akteId: number) => {
    navigate(`/akte/${akteId}`);
  };

  // Behandelt den Klick auf den Bearbeiten-Button
  const handleEditClick = (akteId: number) => {
    navigate(`/akte/${akteId}`);
  };

  // Löscht eine Akte nach Bestätigung
  const handleDeleteClick = async (akteId: number, aktenzeichen: string) => {
    if (window.confirm(`Sind Sie sicher, dass Sie die Akte ${aktenzeichen} löschen möchten?`)) {
      try {
        // Verwende die korrekte API-Basis-URL
        const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
        const API_BASE_URL: string =
          typeof envBaseUrl === "string" && envBaseUrl.length > 0
            ? envBaseUrl
            : "http://localhost:8000/api/";
            
        await axios.delete(`${API_BASE_URL}akten/${akteId}/`);
        // Entferne die gelöschte Akte aus der Liste
        setAkten(prev => prev.filter(akte => akte.id !== akteId));
        setFilteredAkten(prev => prev.filter(akte => akte.id !== akteId));
      } catch (err) {
        setError('Fehler beim Löschen der Akte');
        console.error(err);
      }
    }
  };

  if (loading) {
    return <div className="dashboard">Lade Akten...</div>;
  }

  if (error) {
    return <div className="dashboard">Fehler: {error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Aktenübersicht</h2>
        <div className="search-container">
          <input
            type="text"
            placeholder="Akten suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <table className="akten-table">
        <thead>
          <tr>
            <th>Datum</th>
            <th>Nummer</th>
            <th>Mandant</th>
            <th>Gegner</th>
            <th>Status</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {filteredAkten.map(akte => (
            <tr 
              key={akte.id} 
              onDoubleClick={() => handleAkteDoubleClick(akte.id)}
              className="akte-row"
            >
              <td>{new Date(akte.erstellt_am).toLocaleDateString()}</td>
              <td>{akte.aktenzeichen}</td>
              <td>{akte.mandant.name}</td>
              <td>{akte.gegner.name}</td>
              <td>
                <span className={`status ${akte.status.toLowerCase()}`}>
                  {akte.status}
                </span>
              </td>
              <td>
                <button 
                  onClick={() => handleEditClick(akte.id)}
                  className="btn btn-primary"
                >
                  Bearbeiten
                </button>
                <button 
                  onClick={() => handleDeleteClick(akte.id, akte.aktenzeichen)}
                  className="btn btn-danger"
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredAkten.length === 0 && (
        <p>Keine Akten gefunden</p>
      )}
    </div>
  );
};

export default Dashboard;