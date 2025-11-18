import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SystemStatus {
  database_connected: boolean;
  dokumenten_pfad_accessible: boolean;
}

const AdminDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funktion zum Abrufen des Systemstatus
  const fetchSystemStatus = async () => {
    try {
      setLoading(true);
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      const response = await axios.get(`${API_BASE_URL}admin/status/`);
      setSystemStatus(response.data);
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden des Systemstatus');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Funktion für DB-Export
  const handleDbExport = async () => {
    try {
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      await axios.post(`${API_BASE_URL}admin/export/`);
      alert('Datenbank-Export erfolgreich gestartet');
    } catch (err) {
      setError('Fehler beim DB-Export');
      console.error(err);
    }
  };

  // Funktion für DB-Import
  const handleDbImport = async () => {
    try {
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      await axios.post(`${API_BASE_URL}admin/import/`);
      alert('Datenbank-Import erfolgreich gestartet');
    } catch (err) {
      setError('Fehler beim DB-Import');
      console.error(err);
    }
  };

  // Lade Systemstatus beim Mounten der Komponente
 useEffect(() => {
    fetchSystemStatus();
  }, []);

  if (loading) {
    return <div className="admin-dashboard">Lade Systemstatus...</div>;
  }

  if (error) {
    return <div className="admin-dashboard">Fehler: {error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>
      
      <div className="status-section">
        <h3>Systemstatus</h3>
        {systemStatus && (
          <div className="status-grid">
            <div className={`status-item ${systemStatus.database_connected ? 'status-ok' : 'status-error'}`}>
              <span className="status-label">Datenbank-Anbindung:</span>
              <span className={`status-value ${systemStatus.database_connected ? 'ok' : 'error'}`}>
                {systemStatus.database_connected ? 'Verbunden' : 'Nicht verbunden'}
              </span>
            </div>
            <div className={`status-item ${systemStatus.dokumenten_pfad_accessible ? 'status-ok' : 'status-error'}`}>
              <span className="status-label">Dokumenten-Speicherpfad:</span>
              <span className={`status-value ${systemStatus.dokumenten_pfad_accessible ? 'ok' : 'error'}`}>
                {systemStatus.dokumenten_pfad_accessible ? 'Zugriff möglich' : 'Kein Zugriff'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      <div className="tools-section">
        <h3>Werkzeuge</h3>
        <div className="tools-buttons">
          <button 
            onClick={handleDbExport}
            className="btn btn-secondary"
          >
            DB-Export
          </button>
          <button 
            onClick={handleDbImport}
            className="btn btn-secondary"
          >
            DB-Import
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;