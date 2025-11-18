import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import OrganizerTabs from './OrganizerTabs';
import FinanzTabelle from './FinanzTabelle';

// Typdefinitionen
interface Ansprechpartner {
  id?: number;
  name: string;
 funktion: string;
  telefon: string;
  email: string;
}

interface Mandant {
  id: number;
  name: string;
  adresse: string;
  bankverbindung: string;
  telefon: string;
  email: string;
  typ: string;
  ansprechpartner?: Ansprechpartner[];
}

interface Gegner {
  id: number;
  name: string;
 adresse: string;
  bankverbindung: string;
  telefon: string;
  email: string;
  typ: string;
  schadensnummer?: string; // Für Versicherungstyp
}

interface Akte {
  id: number;
  aktenzeichen: string;
  status: string;
  mandant: Mandant;
  gegner: Gegner;
  info_zusatz: Record<string, unknown>;
  erstellt_am: string;
  aktualisiert_am: string;
}

const AktenView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [akte, setAkte] = useState<Akte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAkte, setEditedAkte] = useState<Akte | null>(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAddAPModal, setShowAddAPModal] = useState(false);
  const [newAP, setNewAP] = useState<Ansprechpartner>({ name: '', funktion: '', telefon: '', email: '' });

 // Funktion zum Abrufen der Akte
  const fetchAkte = async () => {
    try {
      setLoading(true);
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      const response = await axios.get(`${API_BASE_URL}akten/${id}/`);
      setAkte(response.data);
      setEditedAkte({ ...response.data });
      setError(null);
    } catch (err) {
      setError('Fehler beim Laden der Akte');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lade Akte beim Mounten der Komponente
 useEffect(() => {
    if (id) {
      fetchAkte();
    }
  }, [id]);

 // Prüft, ob ein Pflichtfeld fehlt (für Status-Icons)
  const hasMissingRequiredField = (entity: Mandant | Gegner) => {
    return !entity.adresse || !entity.bankverbindung || !entity.email || !entity.telefon;
  };

  // Behandelt das Schließen der Akte
  const handleCloseAkte = async () => {
    if (!id) return;
    
    try {
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      await axios.post(`${API_BASE_URL}akten/${id}/schliessen/`);
      // Aktualisiere die Akte nach dem Schließen
      fetchAkte();
      setShowCloseModal(false);
      alert('Akte erfolgreich geschlossen');
    } catch (err) {
      setError('Fehler beim Schließen der Akte');
      console.error(err);
    }
  };

  // Fügt einen neuen Ansprechpartner hinzu
  const handleAddAnsprechpartner = () => {
    if (!editedAkte || !editedAkte.mandant) return;
    
    const updatedMandant = {
      ...editedAkte.mandant,
      ansprechpartner: [
        ...(editedAkte.mandant.ansprechpartner || []),
        { ...newAP, id: Date.now() } // Verwende temporäre ID
      ]
    };
    
    setEditedAkte({
      ...editedAkte,
      mandant: updatedMandant
    });
    
    setNewAP({ name: '', funktion: '', telefon: '', email: '' });
    setShowAddAPModal(false);
  };

  // Behandelt Änderungen im Formular
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!editedAkte) return;
    
    const { name, value } = e.target;
    const [entityType, field] = name.split('.');
    
    if (entityType === 'mandant' && editedAkte.mandant) {
      setEditedAkte({
        ...editedAkte,
        mandant: {
          ...editedAkte.mandant,
          [field]: value
        }
      });
    } else if (entityType === 'gegner' && editedAkte.gegner) {
      setEditedAkte({
        ...editedAkte,
        gegner: {
          ...editedAkte.gegner,
          [field]: value
        }
      });
    }
  };

  // Speichert die Änderungen
  const handleSave = async () => {
    if (!id || !editedAkte) return;
    
    try {
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      await axios.put(`${API_BASE_URL}akten/${id}/`, editedAkte);
      setAkte({ ...editedAkte });
      setIsEditing(false);
      alert('Änderungen erfolgreich gespeichert');
    } catch (err) {
      setError('Fehler beim Speichern der Änderungen');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="akten-view">Lade Akte...</div>;
  }

  if (error) {
    return <div className="akten-view">Fehler: {error}</div>;
  }

  if (!akte || !editedAkte) {
    return <div className="akten-view">Akte nicht gefunden</div>;
  }

  return (
    <div className="akten-view">
      <div className="akten-header">
        <h2>Akte: {akte.aktenzeichen}</h2>
        <div className="akte-status">
          <span className={`status ${akte.status.toLowerCase()}`}>
            Status: {akte.status}
          </span>
        </div>
      </div>

      <div className="akten-actions">
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="btn btn-primary"
          >
            Bearbeiten
          </button>
        ) : (
          <>
            <button 
              onClick={handleSave}
              className="btn btn-success"
            >
              Speichern
            </button>
            <button 
              onClick={() => {
                setIsEditing(false);
                setEditedAkte({ ...akte });
              }}
              className="btn btn-secondary"
            >
              Abbrechen
            </button>
          </>
        )}
        
        {akte.status !== 'Geschlossen' && (
          <button 
            onClick={() => setShowCloseModal(true)}
            className="btn btn-warning"
          >
            Akte schließen
          </button>
        )}
        
        <button 
          onClick={() => navigate('/dashboard')}
          className="btn btn-default"
        >
          Zurück zur Übersicht
        </button>
      </div>

      <div className="akten-content">
        <div className="stammdaten-section">
          <h3>Stammdaten</h3>
          
          <div className="mandant-block">
            <h4>Mandant 
              <span className={`status-icon ${!hasMissingRequiredField(akte.mandant) ? 'status-ok' : 'status-error'}`}>
                {hasMissingRequiredField(akte.mandant) ? '⚠️' : '✅'}
              </span>
            </h4>
            
            {isEditing ? (
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="mandant.name"
                  value={editedAkte.mandant.name}
                  onChange={handleInputChange}
                />
                
                <label>Typ:</label>
                <select
                  name="mandant.typ"
                  value={editedAkte.mandant.typ}
                  onChange={handleInputChange}
                >
                  <option value="Person">Person</option>
                  <option value="Firma">Firma</option>
                  <option value="Versicherung">Versicherung</option>
                </select>
                
                <label>Adresse:</label>
                <textarea
                  name="mandant.adresse"
                  value={editedAkte.mandant.adresse}
                  onChange={handleInputChange}
                />
                
                <label>Bankverbindung:</label>
                <input
                  type="text"
                  name="mandant.bankverbindung"
                  value={editedAkte.mandant.bankverbindung}
                  onChange={handleInputChange}
                />
                
                <label>Telefon:</label>
                <input
                  type="text"
                  name="mandant.telefon"
                  value={editedAkte.mandant.telefon}
                  onChange={handleInputChange}
                />
                
                <label>E-Mail:</label>
                <input
                  type="email"
                  name="mandant.email"
                  value={editedAkte.mandant.email}
                  onChange={handleInputChange}
                />
                
                {editedAkte.mandant.typ === 'Firma' && (
                  <div className="ansprechpartner-section">
                    <h5>Ansprechpartner</h5>
                    {editedAkte.mandant.ansprechpartner && editedAkte.mandant.ansprechpartner.map((ap, index) => (
                      <div key={ap.id || index} className="ansprechpartner-item">
                        <p>{ap.name} ({ap.funktion}) - {ap.telefon} - {ap.email}</p>
                      </div>
                    ))}
                    <button 
                      onClick={() => setShowAddAPModal(true)}
                      className="btn btn-primary btn-small"
                    >
                      + AP
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mandant-details">
                <p><strong>Name:</strong> {akte.mandant.name}</p>
                <p><strong>Typ:</strong> {akte.mandant.typ}</p>
                <p><strong>Adresse:</strong> {akte.mandant.adresse}</p>
                <p><strong>Bankverbindung:</strong> {akte.mandant.bankverbindung}</p>
                <p><strong>Telefon:</strong> {akte.mandant.telefon}</p>
                <p><strong>E-Mail:</strong> {akte.mandant.email}</p>
                
                {akte.mandant.typ === 'Firma' && (
                  <div className="ansprechpartner-section">
                    <h5>Ansprechpartner</h5>
                    {akte.mandant.ansprechpartner && akte.mandant.ansprechpartner.map((ap, index) => (
                      <div key={ap.id || index} className="ansprechpartner-item">
                        <p>{ap.name} ({ap.funktion}) - {ap.telefon} - {ap.email}</p>
                      </div>
                    ))}
                    <button 
                      onClick={() => setShowAddAPModal(true)}
                      className="btn btn-primary btn-small"
                    >
                      + AP
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="gegner-block">
            <h4>Gegner
              <span className={`status-icon ${!hasMissingRequiredField(akte.gegner) ? 'status-ok' : 'status-error'}`}>
                {hasMissingRequiredField(akte.gegner) ? '⚠️' : '✅'}
              </span>
            </h4>
            
            {isEditing ? (
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  name="gegner.name"
                  value={editedAkte.gegner.name}
                  onChange={handleInputChange}
                />
                
                <label>Typ:</label>
                <select
                  name="gegner.typ"
                  value={editedAkte.gegner.typ}
                  onChange={handleInputChange}
                >
                  <option value="Person">Person</option>
                  <option value="Firma">Firma</option>
                  <option value="Versicherung">Versicherung</option>
                </select>
                
                <label>Adresse:</label>
                <textarea
                  name="gegner.adresse"
                  value={editedAkte.gegner.adresse}
                  onChange={handleInputChange}
                />
                
                <label>Bankverbindung:</label>
                <input
                  type="text"
                  name="gegner.bankverbindung"
                  value={editedAkte.gegner.bankverbindung}
                  onChange={handleInputChange}
                />
                
                <label>Telefon:</label>
                <input
                  type="text"
                  name="gegner.telefon"
                  value={editedAkte.gegner.telefon}
                  onChange={handleInputChange}
                />
                
                <label>E-Mail:</label>
                <input
                  type="email"
                  name="gegner.email"
                  value={editedAkte.gegner.email}
                  onChange={handleInputChange}
                />
                
                {editedAkte.gegner.typ === 'Versicherung' && (
                  <>
                    <label>Schadensnummer:</label>
                    <input
                      type="text"
                      name="gegner.schadensnummer"
                      value={editedAkte.gegner.schadensnummer || ''}
                      onChange={(e) => {
                        if (!editedAkte.gegner) return;
                        setEditedAkte({
                          ...editedAkte,
                          gegner: {
                            ...editedAkte.gegner,
                            schadensnummer: e.target.value
                          }
                        });
                      }}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="gegner-details">
                <p><strong>Name:</strong> {akte.gegner.name}</p>
                <p><strong>Typ:</strong> {akte.gegner.typ}</p>
                <p><strong>Adresse:</strong> {akte.gegner.adresse}</p>
                <p><strong>Bankverbindung:</strong> {akte.gegner.bankverbindung}</p>
                <p><strong>Telefon:</strong> {akte.gegner.telefon}</p>
                <p><strong>E-Mail:</strong> {akte.gegner.email}</p>
                
                {akte.gegner.typ === 'Versicherung' && (
                  <p><strong>Schadensnummer:</strong> {akte.gegner.schadensnummer}</p>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Organizer-Tabs (Aufgaben, Fristen, Notizen) */}
        <div className="organizer-section">
          <h3>Organizer</h3>
          <OrganizerTabs akteId={akte.id} />
        </div>
        
        {/* Finanz-Tabelle (Dokumenten- und Finanz-Übersicht) */}
        <div className="finanzen-section">
          <h3>Finanzen</h3>
          <FinanzTabelle akteId={akte.id} />
        </div>
      </div>

      {/* Modal zum Schließen der Akte */}
      {showCloseModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Akte schließen</h3>
            <p>Sind Sie sicher, dass Sie diese Akte schließen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.</p>
            <div className="modal-actions">
              <button 
                onClick={handleCloseAkte}
                className="btn btn-danger"
              >
                Ja, Akte schließen
              </button>
              <button 
                onClick={() => setShowCloseModal(false)}
                className="btn btn-secondary"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal zum Hinzufügen eines Ansprechpartners */}
      {showAddAPModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Ansprechpartner hinzufügen</h3>
            <div className="form-group">
              <label>Name:</label>
              <input
                type="text"
                value={newAP.name}
                onChange={(e) => setNewAP({...newAP, name: e.target.value})}
              />
              
              <label>Funktion:</label>
              <input
                type="text"
                value={newAP.funktion}
                onChange={(e) => setNewAP({...newAP, funktion: e.target.value})}
              />
              
              <label>Telefon:</label>
              <input
                type="text"
                value={newAP.telefon}
                onChange={(e) => setNewAP({...newAP, telefon: e.target.value})}
              />
              
              <label>E-Mail:</label>
              <input
                type="email"
                value={newAP.email}
                onChange={(e) => setNewAP({...newAP, email: e.target.value})}
              />
            </div>
            <div className="modal-actions">
              <button 
                onClick={handleAddAnsprechpartner}
                className="btn btn-primary"
              >
                Hinzufügen
              </button>
              <button 
                onClick={() => setShowAddAPModal(false)}
                className="btn btn-secondary"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AktenView;