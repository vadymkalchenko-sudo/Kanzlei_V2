import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface OrganizerItem {
  id?: number;
  titel: string;
  beschreibung: string;
  datum?: string;
  status?: string;
  prioritaet?: string;
  typ?: 'Aufgabe' | 'Frist' | 'Notiz';
  faellig_am?: string;
}

interface OrganizerTabsProps {
  akteId: number;
}

const OrganizerTabs: React.FC<OrganizerTabsProps> = ({ akteId }) => {
  const [activeTab, setActiveTab] = useState<'Aufgabe' | 'Frist' | 'Notiz'>('Aufgabe');
  const [items, setItems] = useState<OrganizerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState<OrganizerItem>({ titel: '', beschreibung: '', status: 'Offen' });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";

      // In a real app, you might have separate endpoints or filter by type on the backend
      // For now, we'll simulate fetching all and filtering client-side or assuming the endpoint handles it
      const response = await axios.get(`${API_BASE_URL}akten/${akteId}/organizer/`);
      setItems(response.data);
    } catch (err) {
      console.error("Fehler beim Laden der Organizer-Daten", err);
      // Mock data for demonstration if backend fails or is empty
      setItems([
        { id: 1, typ: 'Aufgabe', titel: 'Test Aufgabe', beschreibung: 'Details...', status: 'Offen' },
        { id: 2, typ: 'Frist', titel: 'Klageerwiderung', datum: '2023-12-01', beschreibung: 'Wichtig!', status: 'Offen' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [akteId]);

  const handleAddItem = async () => {
    console.log("Adding item:", { ...newItem, typ: activeTab, akte: akteId });
    // Placeholder for API call
    alert(`${activeTab} hinzugefügt! (Simulation)`);
    setNewItem({ titel: '', beschreibung: '', datum: '', status: 'Offen' });
  };

  const filteredItems = items.filter(item => item.typ === activeTab);

  return (
    <div>
      {/* Sub-Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {(['Aufgabe', 'Frist', 'Notiz'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab
                ? 'bg-white text-primary shadow-sm'
                : 'text-muted hover:text-primary hover:bg-gray-200'
              }`}
          >
            {tab === 'Aufgabe' ? 'Aufgaben' : tab === 'Frist' ? 'Fristen' : 'Notizen'}
          </button>
        ))}
      </div>

      {/* Add New Item Form */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
        <h4 className="text-sm font-bold text-primary mb-3">Neue {activeTab} erstellen</h4>
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-grow w-full md:w-auto">
            <label className="block text-xs font-medium text-muted mb-1">Titel</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Titel eingeben..."
              value={newItem.titel}
              onChange={(e) => setNewItem({ ...newItem, titel: e.target.value })}
            />
          </div>

          {activeTab === 'Frist' && (
            <div className="w-full md:w-40">
              <label className="block text-xs font-medium text-muted mb-1">Datum</label>
              <input
                type="date"
                className="input w-full"
                value={newItem.datum || ''}
                onChange={(e) => setNewItem({ ...newItem, datum: e.target.value })}
              />
            </div>
          )}

          <div className="flex-grow w-full md:w-auto">
            <label className="block text-xs font-medium text-muted mb-1">Beschreibung</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Details..."
              value={newItem.beschreibung}
              onChange={(e) => setNewItem({ ...newItem, beschreibung: e.target.value })}
            />
          </div>

          <div className="w-full md:w-32">
            <label className="block text-xs font-medium text-muted mb-1">Status</label>
            <select
              className="input w-full"
              value={newItem.status || 'Offen'}
              onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
            >
              <option value="Offen">Offen</option>
              <option value="Erledigt">Erledigt</option>
            </select>
          </div>

          <button onClick={handleAddItem} className="btn btn-primary whitespace-nowrap h-[38px]">
            Hinzufügen
          </button>
        </div>
      </div>

      {/* List */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '25%' }}>Titel</th>
              {activeTab === 'Frist' && <th style={{ width: '15%' }}>Datum</th>}
              <th>Beschreibung</th>
              <th style={{ width: '10%' }}>Status</th>
              <th style={{ width: '15%', textAlign: 'right' }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <tr key={item.id}>
                  <td className="font-medium">{item.titel}</td>
                  {activeTab === 'Frist' && <td>{item.datum || '-'}</td>}
                  <td className="text-muted text-sm truncate max-w-xs">{item.beschreibung}</td>
                  <td>
                    <span className={`badge ${item.status === 'Offen' ? 'badge-warning' : 'badge-success'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-xs text-primary hover:underline">Bearbeiten</button>
                      <button className="text-xs text-danger hover:underline">Löschen</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-8 text-muted">
                  Keine {activeTab === 'Aufgabe' ? 'Aufgaben' : activeTab === 'Frist' ? 'Fristen' : 'Notizen'} vorhanden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrganizerTabs;