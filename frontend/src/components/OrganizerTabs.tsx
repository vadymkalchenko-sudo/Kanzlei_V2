import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface OrganizerItem {
  id?: number;
  titel: string;
  beschreibung: string;
  erstellt_am?: string;
 aktualisiert_am?: string;
  // Spezifische Felder für verschiedene Typen
  faellig_am?: string; // Für Fristen
  status?: string; // Für Aufgaben
  prioritaet?: string; // Für Fristen
}

interface OrganizerTabsProps {
  akteId: number;
}

const OrganizerTabs: React.FC<OrganizerTabsProps> = ({ akteId }) => {
  const [activeTab, setActiveTab] = useState<'aufgaben' | 'fristen' | 'notizen'>('aufgaben');
  const [items, setItems] = useState<OrganizerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<OrganizerItem>({ titel: '', beschreibung: '' });
  const [editingId, setEditingId] = useState<number | null>(null);

  // Funktion zum Abrufen der Organizer-Items
 const fetchItems = async () => {
    try {
      setLoading(true);
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      let endpoint = '';
      switch (activeTab) {
        case 'aufgaben':
          endpoint = `organizer/aufgaben/?akte=${akteId}`;
          break;
        case 'fristen':
          endpoint = `organizer/fristen/?akte=${akteId}`;
          break;
        case 'notizen':
          endpoint = `organizer/notizen/?akte=${akteId}`;
          break;
        default:
          endpoint = `organizer/aufgaben/?akte=${akteId}`;
      }
      
      const response = await axios.get(`${API_BASE_URL}${endpoint}`);
      setItems(response.data);
      setError(null);
    } catch (err) {
      setError(`Fehler beim Laden der ${activeTab}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lade Items, wenn sich der aktive Tab ändert
  useEffect(() => {
    fetchItems();
  }, [activeTab, akteId]);

  // Behandelt das Hinzufügen oder Aktualisieren eines Items
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      let endpoint = '';
      switch (activeTab) {
        case 'aufgaben':
          endpoint = editingId 
            ? `${API_BASE_URL}organizer/aufgaben/${editingId}/` 
            : `${API_BASE_URL}organizer/aufgaben/`;
          break;
        case 'fristen':
          endpoint = editingId 
            ? `${API_BASE_URL}organizer/fristen/${editingId}/` 
            : `${API_BASE_URL}organizer/fristen/`;
          break;
        case 'notizen':
          endpoint = editingId 
            ? `${API_BASE_URL}organizer/notizen/${editingId}/` 
            : `${API_BASE_URL}organizer/notizen/`;
          break;
        default:
          endpoint = editingId 
            ? `${API_BASE_URL}organizer/aufgaben/${editingId}/` 
            : `${API_BASE_URL}organizer/aufgaben/`;
      }
      
      const method = editingId ? 'put' : 'post';
      const payload = {
        ...newItem,
        akte: akteId
      };
      
      await axios[method](endpoint, payload);
      
      // Zurücksetzen und neu laden
      setNewItem({ titel: '', beschreibung: '' });
      setEditingId(null);
      fetchItems();
    } catch (err) {
      setError(`Fehler beim Speichern der ${activeTab.slice(0, -1)}`);
      console.error(err);
    }
 };

  // Behandelt das Löschen eines Items
 const handleDelete = async (id: number) => {
    if (!window.confirm('Sind Sie sicher, dass Sie dieses Element löschen möchten?')) {
      return;
    }
    
    try {
      // Verwende die korrekte API-Basis-URL
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";
      
      let endpoint = '';
      switch (activeTab) {
        case 'aufgaben':
          endpoint = `${API_BASE_URL}organizer/aufgaben/${id}/`;
          break;
        case 'fristen':
          endpoint = `${API_BASE_URL}organizer/fristen/${id}/`;
          break;
        case 'notizen':
          endpoint = `${API_BASE_URL}organizer/notizen/${id}/`;
          break;
        default:
          endpoint = `${API_BASE_URL}organizer/aufgaben/${id}/`;
      }
      
      await axios.delete(endpoint);
      fetchItems(); // Neu laden nach dem Löschen
    } catch (err) {
      setError(`Fehler beim Löschen der ${activeTab.slice(0, -1)}`);
      console.error(err);
    }
  };

  // Behandelt das Bearbeiten eines Items
 const handleEdit = (item: OrganizerItem) => {
    setNewItem({
      titel: item.titel,
      beschreibung: item.beschreibung,
      ...(activeTab === 'fristen' && item.faellig_am ? { faellig_am: item.faellig_am } : {}),
      ...(activeTab === 'aufgaben' && item.status ? { status: item.status } : {}),
      ...(activeTab === 'fristen' && item.prioritaet ? { prioritaet: item.prioritaet } : {})
    });
    setEditingId(item.id || null);
  };

  // Behandelt das Abbrechen des Bearbeitens
  const handleCancelEdit = () => {
    setNewItem({ titel: '', beschreibung: '' });
    setEditingId(null);
  };

  // Behandelt Änderungen im Formular
 const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewItem({
      ...newItem,
      [name]: value
    });
 };

  if (loading) {
    return <div className="organizer-tabs">Lade {activeTab}...</div>;
  }

 return (
    <div className="organizer-tabs">
      <div className="tab-navigation">
        <button 
          className={activeTab === 'aufgaben' ? 'active' : ''}
          onClick={() => setActiveTab('aufgaben')}
        >
          Aufgaben
        </button>
        <button 
          className={activeTab === 'fristen' ? 'active' : ''}
          onClick={() => setActiveTab('fristen')}
        >
          Fristen
        </button>
        <button 
          className={activeTab === 'notizen' ? 'active' : ''}
          onClick={() => setActiveTab('notizen')}
        >
          Notizen
        </button>
      </div>

      {error && <div className="error">Fehler: {error}</div>}

      <div className="organizer-content">
        <form onSubmit={handleSubmit} className="organizer-form">
          <div className="form-group">
            <label htmlFor="titel">Titel:</label>
            <input
              type="text"
              id="titel"
              name="titel"
              value={newItem.titel}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="beschreibung">Beschreibung:</label>
            <textarea
              id="beschreibung"
              name="beschreibung"
              value={newItem.beschreibung}
              onChange={handleInputChange}
            />
          </div>
          
          {activeTab === 'fristen' && (
            <>
              <div className="form-group">
                <label htmlFor="faellig_am">Fällig am:</label>
                <input
                  type="date"
                  id="faellig_am"
                  name="faellig_am"
                  value={newItem.faellig_am || ''}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="prioritaet">Priorität:</label>
                <select
                  id="prioritaet"
                  name="prioritaet"
                  value={newItem.prioritaet || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Bitte wählen</option>
                  <option value="niedrig">Niedrig</option>
                  <option value="mittel">Mittel</option>
                  <option value="hoch">Hoch</option>
                </select>
              </div>
            </>
          )}
          
          {activeTab === 'aufgaben' && (
            <div className="form-group">
              <label htmlFor="status">Status:</label>
              <select
                id="status"
                name="status"
                value={newItem.status || ''}
                onChange={handleInputChange}
              >
                <option value="">Bitte wählen</option>
                <option value="offen">Offen</option>
                <option value="in Bearbeitung">In Bearbeitung</option>
                <option value="erledigt">Erledigt</option>
              </select>
            </div>
          )}
          
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Aktualisieren' : 'Hinzufügen'}
          </button>
          {editingId && (
            <button type="button" onClick={handleCancelEdit} className="btn btn-secondary">
              Abbrechen
            </button>
          )}
        </form>

        <div className="organizer-list">
          <h4>{activeTab === 'aufgaben' ? 'Aufgaben' : activeTab === 'fristen' ? 'Fristen' : 'Notizen'}</h4>
          {items.length === 0 ? (
            <p>Keine {activeTab} vorhanden</p>
          ) : (
            <ul>
              {items.map(item => (
                <li key={item.id} className="organizer-item">
                  <div className="item-header">
                    <h5>{item.titel}</h5>
                    <div className="item-actions">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="btn btn-small btn-primary"
                      >
                        Bearbeiten
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id!)}
                        className="btn btn-small btn-danger"
                      >
                        Löschen
                      </button>
                    </div>
                  </div>
                  <p>{item.beschreibung}</p>
                  {activeTab === 'fristen' && item.faellig_am && (
                    <p><strong>Fällig am:</strong> {new Date(item.faellig_am).toLocaleDateString()}</p>
                  )}
                  {activeTab === 'fristen' && item.prioritaet && (
                    <p><strong>Priorität:</strong> {item.prioritaet}</p>
                  )}
                  {activeTab === 'aufgaben' && item.status && (
                    <p><strong>Status:</strong> {item.status}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerTabs;