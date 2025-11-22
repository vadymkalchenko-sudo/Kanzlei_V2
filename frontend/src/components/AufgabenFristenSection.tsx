import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

interface OrganizerItem {
    id?: number;
    titel: string;
    beschreibung: string;
    datum?: string;
    status?: string;
    prioritaet?: string;
    typ?: 'Aufgabe' | 'Frist';
    faellig_am?: string;
    erstellt_am?: string;
    zugewiesen_an?: number | null;
    erledigt?: boolean;
}

interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
}

interface AufgabenFristenSectionProps {
    akteId: number | string;
}

const AufgabenFristenSection: React.FC<AufgabenFristenSectionProps> = ({ akteId }) => {
    const [activeTab, setActiveTab] = useState<'Aufgabe' | 'Frist' | 'History'>('Aufgabe');
    const [items, setItems] = useState<OrganizerItem[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentItem, setCurrentItem] = useState<OrganizerItem>({ titel: '', beschreibung: '', status: 'offen', zugewiesen_an: null });

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await api.get(`akten/${akteId}/organizer/`);
            setItems(response.data.filter((i: any) => i.typ !== 'Notiz'));
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

    const handleOpenCreate = () => {
        // Only allow creating Aufgabe or Frist, not from History tab
        if (activeTab === 'History') return;

        setModalMode('create');
        setCurrentItem({
            titel: '',
            beschreibung: '',
            status: 'offen',
            zugewiesen_an: null,
            datum: new Date().toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    const handleOpenEdit = (item: OrganizerItem) => {
        setModalMode('edit');
        setCurrentItem({
            ...item,
            datum: item.datum || item.faellig_am || '',
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            let endpoint = '';
            let payload: any = {};

            // Determine type based on current item or active tab
            const itemType = currentItem.typ || (activeTab === 'Frist' ? 'Frist' : 'Aufgabe');

            // Prepare Payload
            if (itemType === 'Aufgabe') {
                payload = {
                    akte: akteId,
                    titel: currentItem.titel,
                    beschreibung: currentItem.beschreibung,
                    status: currentItem.status?.toLowerCase() || 'offen',
                    faellig_am: currentItem.datum,
                    zugewiesen_an: currentItem.zugewiesen_an,
                };
            } else if (itemType === 'Frist') {
                payload = {
                    akte: akteId,
                    bezeichnung: currentItem.titel,
                    beschreibung: currentItem.beschreibung,
                    frist_datum: currentItem.datum || new Date().toISOString().split('T')[0],
                    prioritaet: 'mittel',
                    erledigt: currentItem.erledigt || false,
                };
            }

            if (modalMode === 'create') {
                endpoint = itemType === 'Aufgabe' ? 'organizer/aufgaben/' : 'organizer/fristen/';
                await api.post(endpoint, payload);
            } else {
                endpoint = itemType === 'Aufgabe' ? `organizer/aufgaben/${currentItem.id}/` : `organizer/fristen/${currentItem.id}/`;
                await api.put(endpoint, payload);
            }

            setShowModal(false);
            fetchItems();
        } catch (err: any) {
            console.error(`Fehler beim Speichern`, err);
            alert(`Fehler beim Speichern.`);
        }
    };

    const handleDelete = async (itemId: number, itemType: 'Aufgabe' | 'Frist') => {
        if (!window.confirm("Wirklich löschen?")) return;
        try {
            const endpoint = itemType === 'Aufgabe' ? `organizer/aufgaben/${itemId}/` : `organizer/fristen/${itemId}/`;
            await api.delete(endpoint);
            if (showModal) setShowModal(false);
            fetchItems();
        } catch (err) {
            console.error(`Fehler beim Löschen`, err);
            alert(`Fehler beim Löschen.`);
        }
    };

    const toggleStatus = async (item: OrganizerItem) => {
        try {
            let endpoint = '';
            let payload: any = {};

            if (item.typ === 'Aufgabe') {
                endpoint = `organizer/aufgaben/${item.id}/`;
                const newStatus = item.status?.toLowerCase() === 'erledigt' ? 'offen' : 'erledigt';
                payload = { status: newStatus };
            } else if (item.typ === 'Frist') {
                endpoint = `organizer/fristen/${item.id}/`;
                payload = { erledigt: !item.erledigt };
            }

            await api.patch(endpoint, payload);
            fetchItems();
        } catch (err) {
            console.error("Fehler beim Status-Update", err);
        }
    };

    // Filter items based on active tab
    const filteredItems = items.filter(item => {
        const isDone = item.status?.toLowerCase() === 'erledigt' || item.erledigt;

        if (activeTab === 'History') {
            return isDone; // Show all completed items
        } else {
            return item.typ === activeTab && !isDone; // Show only active items of this type
        }
    });

    return (
        <div className="flex flex-col h-full">
            {/* Header: Tabs & Add Button */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {(['Aufgabe', 'Frist', 'History'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === tab
                                ? 'bg-white text-primary shadow-sm'
                                : 'text-slate-500 hover:text-primary hover:bg-slate-200'
                                }`}
                        >
                            {tab === 'Aufgabe' ? 'Aufgaben' : tab === 'Frist' ? 'Fristen' : 'History'}
                        </button>
                    ))}
                </div>
                {activeTab !== 'History' && (
                    <button onClick={handleOpenCreate} className="btn btn-primary btn-sm text-xs">
                        + Neu
                    </button>
                )}
            </div>

            {/* List */}
            <div className="flex-grow overflow-y-auto space-y-2 min-h-[200px]">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => {
                        const isDone = item.status?.toLowerCase() === 'erledigt' || item.erledigt;
                        const isHistory = activeTab === 'History';

                        return (
                            <div
                                key={item.id}
                                className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${isHistory
                                    ? 'bg-green-50 border-green-200 hover:border-green-300'
                                    : isDone
                                        ? 'opacity-60 bg-slate-50 border-slate-100 hover:border-primary/30'
                                        : 'bg-white border-slate-100 hover:border-primary/30 hover:bg-slate-50'
                                    }`}
                            >
                                <div onClick={(e) => e.stopPropagation()}>
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary checkbox-xs rounded-full cursor-pointer"
                                        checked={isDone}
                                        onChange={() => toggleStatus(item)}
                                    />
                                </div>
                                <div className="flex-grow min-w-0 cursor-pointer" onClick={() => handleOpenEdit(item)}>
                                    <div className="flex items-center gap-2">
                                        <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                            {item.titel}
                                        </p>
                                        {isHistory && (
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.typ === 'Aufgabe' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                {item.typ}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <span>{(item.datum || item.faellig_am) ? new Date(item.datum || item.faellig_am || '').toLocaleDateString('de-DE') : 'Kein Datum'}</span>
                                        {item.zugewiesen_an && (
                                            <span className="bg-slate-100 px-1.5 rounded text-[10px]">
                                                {users.find(u => u.id === item.zugewiesen_an)?.username || 'User'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id!, item.typ!); }}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-8 text-slate-400 text-sm italic">
                        {activeTab === 'History' ? 'Keine erledigten Einträge.' : 'Keine Einträge.'}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">
                                {modalMode === 'create' ? `Neue ${activeTab === 'Frist' ? 'Frist' : 'Aufgabe'}` : `${currentItem.typ} bearbeiten`}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Titel</label>
                                <input
                                    type="text"
                                    className="input w-full font-medium"
                                    placeholder="Was ist zu tun?"
                                    value={currentItem.titel}
                                    onChange={(e) => setCurrentItem({ ...currentItem, titel: e.target.value })}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">
                                        {(currentItem.typ === 'Frist' || activeTab === 'Frist') ? 'Frist-Datum' : 'Fällig am'}
                                    </label>
                                    <input
                                        type="date"
                                        className="input w-full"
                                        value={currentItem.datum || ''}
                                        onChange={(e) => setCurrentItem({ ...currentItem, datum: e.target.value })}
                                    />
                                </div>
                                {(currentItem.typ === 'Aufgabe' || activeTab === 'Aufgabe') && (
                                    <div>
                                        <label className="block text-xs font-medium text-slate-500 mb-1">Zugewiesen an</label>
                                        <select
                                            className="input w-full"
                                            value={currentItem.zugewiesen_an || ''}
                                            onChange={(e) => setCurrentItem({ ...currentItem, zugewiesen_an: e.target.value ? parseInt(e.target.value) : null })}
                                        >
                                            <option value="">Niemand</option>
                                            {users.map(user => (<option key={user.id} value={user.id}>{user.first_name || user.username}</option>))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Beschreibung</label>
                                <textarea
                                    className="input w-full min-h-[100px]"
                                    placeholder="Details..."
                                    value={currentItem.beschreibung}
                                    onChange={(e) => setCurrentItem({ ...currentItem, beschreibung: e.target.value })}
                                />
                            </div>

                            {/* Erledigt Checkbox */}
                            {modalMode === 'edit' && (
                                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                                    <input
                                        type="checkbox"
                                        id="erledigt-checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={currentItem.typ === 'Aufgabe' ? currentItem.status?.toLowerCase() === 'erledigt' : currentItem.erledigt}
                                        onChange={(e) => {
                                            if (currentItem.typ === 'Aufgabe') {
                                                setCurrentItem({ ...currentItem, status: e.target.checked ? 'erledigt' : 'offen' });
                                            } else {
                                                setCurrentItem({ ...currentItem, erledigt: e.target.checked });
                                            }
                                        }}
                                    />
                                    <label htmlFor="erledigt-checkbox" className="text-sm font-medium text-slate-700 cursor-pointer">
                                        Erledigt
                                    </label>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end mt-8 pt-4 border-t border-slate-100">
                            {modalMode === 'edit' && (
                                <button onClick={() => handleDelete(currentItem.id!, currentItem.typ!)} className="btn btn-ghost text-red-600 mr-auto">
                                    Löschen
                                </button>
                            )}
                            <button onClick={() => setShowModal(false)} className="btn btn-secondary">Abbrechen</button>
                            <button onClick={handleSave} className="btn btn-primary px-6">Speichern</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AufgabenFristenSection;
