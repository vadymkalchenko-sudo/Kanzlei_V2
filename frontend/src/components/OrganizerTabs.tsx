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
  zugewiesen_an?: number | null;
}

interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
}

interface OrganizerTabsProps {
  akteId: number | string;
}

const OrganizerTabs: React.FC<OrganizerTabsProps> = ({ akteId }) => {
  const [activeTab, setActiveTab] = useState<'Aufgabe' | 'Frist' | 'Notiz'>('Aufgabe');
  const [items, setItems] = useState<OrganizerItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState<OrganizerItem>({ titel: '', beschreibung: '', status: 'offen', zugewiesen_an: null });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<OrganizerItem | null>(null);
  const [editFormData, setEditFormData] = useState<OrganizerItem>({ titel: '', beschreibung: '' });

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

  const fetchUsers = async () => {
    try {
      const response = await api.get('users/');
      setUsers(response.data);
    } catch (err) {
      console.error("Fehler beim Laden der Benutzer", err);
    }
  };

  useEffect(() => {
    if (akteId) {
      fetchItems();
      fetchUsers();
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
        if (newItem.datum) {
          payload.faellig_am = newItem.datum;
        }
        if (newItem.zugewiesen_an) {
          payload.zugewiesen_an = newItem.zugewiesen_an;
        }
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
      setNewItem({ titel: '', beschreibung: '', datum: '', status: 'offen', zugewiesen_an: null });
      fetchItems();
    } catch (err: any) {
      console.error(`Fehler beim Erstellen von ${activeTab}`, err);
      // Show more detailed error
      const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
      alert(`Fehler beim Erstellen: ${errorMsg}`);
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      let endpoint = '';
      if (activeTab === 'Aufgabe') {
        endpoint = `organizer/aufgaben/${itemId}/`;
      } else if (activeTab === 'Frist') {
        endpoint = `organizer/fristen/${itemId}/`;
      } else if (activeTab === 'Notiz') {
        endpoint = `organizer/notizen/${itemId}/`;
      }

      console.log(`Deleting ${activeTab} ${itemId}`);
      await api.delete(endpoint);
      console.log(`${activeTab} ${itemId} deleted successfully`);
      fetchItems();
    } catch (err) {
      console.error(`Fehler beim Löschen von ${activeTab}`, err);
      alert(`Fehler beim Löschen.`);
    }
  };

  const handleEdit = (item: OrganizerItem) => {
    setEditingItem(item);
    setEditFormData({
      ...item,
      datum: item.datum || item.faellig_am || '', // Normalize date
    });
    setShowEditModal(true);
  };

  const saveEdit = async () => {
    if (!editingItem) return;

    try {
      let endpoint = '';
      let payload: any = {};

      if (activeTab === 'Aufgabe') {
        endpoint = `organizer/aufgaben/${editingItem.id}/`;
        payload = {
          akte: akteId,
          titel: editFormData.titel,
          beschreibung: editFormData.beschreibung,
          status: editFormData.status?.toLowerCase() || 'offen',
          faellig_am: editFormData.datum,
          zugewiesen_an: editFormData.zugewiesen_an,
        };
      } else if (activeTab === 'Frist') {
        endpoint = `organizer/fristen/${editingItem.id}/`;
        payload = {
          akte: akteId,
          bezeichnung: editFormData.titel,
          beschreibung: editFormData.beschreibung,
          frist_datum: editFormData.datum || new Date().toISOString().split('T')[0],
          prioritaet: 'mittel',
          erledigt: false,
        };
      } else if (activeTab === 'Notiz') {
        endpoint = `organizer/notizen/${editingItem.id}/`;
        payload = {
          akte: akteId,
          titel: editFormData.titel,
          inhalt: editFormData.beschreibung,
        };
      }

      await api.put(endpoint, payload);
      fetchItems();
      setShowEditModal(false);
      setEditingItem(null);
    } catch (err) {
      console.error(`Fehler beim Bearbeiten von ${activeTab}`, err);
      alert(`Fehler beim Bearbeiten.`);
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

          {(activeTab === 'Frist' || activeTab === 'Aufgabe') && (
            <div className="w-full md:w-40">
              <label className="block text-xs font-medium text-slate-500 mb-1">
                {activeTab === 'Frist' ? 'Frist-Datum' : 'Fällig am'}
              </label>
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
            <>
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
              <div className="w-full md:w-40">
                <label className="block text-xs font-medium text-slate-500 mb-1">Zugewiesen an</label>
                <select
                  className="input w-full"
                  value={newItem.zugewiesen_an || ''}
                  onChange={(e) => setNewItem({ ...newItem, zugewiesen_an: e.target.value ? parseInt(e.target.value) : null })}
                >
                  <option value="">Nicht zugewiesen</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                    </option>
                  ))}
                </select>
              </div>
            </>
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
              {(activeTab === 'Frist' || activeTab === 'Aufgabe') && (
                <th style={{ width: '15%' }}>
                  {activeTab === 'Frist' ? 'Frist-Datum' : 'Fällig am'}
                </th>
              )}
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
                  {(activeTab === 'Frist' || activeTab === 'Aufgabe') && <td>{item.datum || item.faellig_am || '-'}</td>}
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
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-xs text-primary hover:underline"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(item.id!)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Löschen
                      </button>
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

      {/* Edit Modal */}
      {
        showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-slate-900 mb-4">{activeTab} bearbeiten</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Titel</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={editFormData.titel}
                    onChange={(e) => setEditFormData({ ...editFormData, titel: e.target.value })}
                  />
                </div>

                {(activeTab === 'Frist' || activeTab === 'Aufgabe') && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      {activeTab === 'Frist' ? 'Frist-Datum' : 'Fällig am'}
                    </label>
                    <input
                      type="date"
                      className="input w-full"
                      value={editFormData.datum || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, datum: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Beschreibung</label>
                  <textarea
                    className="input w-full min-h-[100px]"
                    value={editFormData.beschreibung}
                    onChange={(e) => setEditFormData({ ...editFormData, beschreibung: e.target.value })}
                  />
                </div>

                {activeTab === 'Aufgabe' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                      <select
                        className="input w-full"
                        value={editFormData.status || 'offen'}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      >
                        <option value="offen">Offen</option>
                        <option value="erledigt">Erledigt</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Zugewiesen an</label>
                      <select
                        className="input w-full"
                        value={editFormData.zugewiesen_an || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, zugewiesen_an: e.target.value ? parseInt(e.target.value) : null })}
                      >
                        <option value="">Nicht zugewiesen</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="btn btn-secondary"
                >
                  Abbrechen
                </button>
                <button
                  onClick={saveEdit}
                  className="btn btn-primary"
                >
                  Speichern
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default OrganizerTabs;