import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface OrganizerItem {
  id?: number;
  titel: string;
  beschreibung: string;
  datum?: string;
  status?: string;
  prioritaet?: string;
  typ?: 'Aufgabe' | 'Frist' | 'Notiz';
  faellig_am?: string;
  erstellt_am?: string;
}

interface OrganizerTabsProps {
  akteId: number | string;
}

const OrganizerTabs: React.FC<OrganizerTabsProps> = ({ akteId }) => {
  const [activeTab, setActiveTab] = useState<'Aufgabe' | 'Frist' | 'Notiz'>('Aufgabe');
  const [items, setItems] = useState<OrganizerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState<OrganizerItem>({ titel: '', beschreibung: '', status: 'offen' });

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await api.get(`akten/${akteId}/organizer/`);
      setItems(response.data);
    } catch (err) {
      console.error("Fehler beim Laden der Organizer-Daten", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (akteId) {
      fetchItems();
    }
  }, [akteId]);

  const handleAddItem = async () => {
    try {
      let endpoint = '';
      let payload: any = {
        akte: akteId,
        titel: newItem.titel,
        beschreibung: newItem.beschreibung,
      };

      if (activeTab === 'Aufgabe') {
        endpoint = 'organizer/aufgaben/';
        payload.status = newItem.status?.toLowerCase() || 'offen';
      } else if (activeTab === 'Frist') {
        endpoint = 'organizer/fristen/';
        payload.bezeichnung = newItem.titel;
        delete payload.titel;
        // Ensure date is not empty string
        payload.frist_datum = newItem.datum ? newItem.datum : new Date().toISOString().split('T')[0];
        payload.prioritaet = 'mittel';
        payload.erledigt = false;
      } else if (activeTab === 'Notiz') {
        endpoint = 'organizer/notizen/';
        payload.inhalt = newItem.beschreibung;
        delete payload.beschreibung;
      }

      console.log(`Sending payload to ${endpoint}:`, payload);
      await api.post(endpoint, payload);

      // Reset form and refresh list
      setNewItem({ titel: '', beschreibung: '', datum: '', status: 'offen' });
      fetchItems();
    } catch (err: any) {
      console.error(`Fehler beim Erstellen von ${activeTab}`, err);
      // Show more detailed error
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert(`Fehler beim Erstellen: ${errorMsg}`);
    }
  };

  const filteredItems = items.filter(item => item.typ === activeTab);

  return (
    <div>
      {/* Sub-Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {(['Aufgabe', 'Frist', 'Notiz'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === tab
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-primary hover:bg-slate-200'
              }`}
          >
            {tab === 'Aufgabe' ? 'Aufgaben' : tab === 'Frist' ? 'Fristen' : 'Notizen'}
          </button>
        ))}
      </div>

      {/* Add New Item Form */}
      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
        <h4 className="text-sm font-bold text-slate-900 mb-3">Neue {activeTab} erstellen</h4>
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-grow w-full md:w-auto">
            <label className="block text-xs font-medium text-slate-500 mb-1">Titel</label>
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
              <label className="block text-xs font-medium text-slate-500 mb-1">Datum</label>
              <input
                type="date"
                className="input w-full"
                value={newItem.datum || ''}
                onChange={(e) => setNewItem({ ...newItem, datum: e.target.value })}
              />
            </div>
          )}

          <div className="flex-grow w-full md:w-auto">
            <label className="block text-xs font-medium text-slate-500 mb-1">Beschreibung</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Details..."
              value={newItem.beschreibung}
              onChange={(e) => setNewItem({ ...newItem, beschreibung: e.target.value })}
            />
          </div>

          {activeTab === 'Aufgabe' && (
            <div className="w-full md:w-32">
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <select
                className="input w-full"
                value={newItem.status || 'offen'}
                onChange={(e) => setNewItem({ ...newItem, status: e.target.value })}
              >
                <option value="offen">Offen</option>
                <option value="erledigt">Erledigt</option>
              </select>
            </div>
          )}

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
                  <td className="text-slate-500 text-sm truncate max-w-xs">{item.beschreibung}</td>
                  <td>
                    {item.typ !== 'Notiz' && (
                      <span className={`badge ${item.status?.toLowerCase() === 'offen' ? 'badge-warning' : 'badge-success'}`}>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      <button className="text-xs text-primary hover:underline">Bearbeiten</button>
                      <button className="text-xs text-red-600 hover:underline">Löschen</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-8 text-slate-500">
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