import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

interface Beteiligter {
    id: number;
    name: string;
    adresse: string;
    telefon: string;
    email: string;
    typ: string;
    rolle?: string;
    notizen?: string;
    bankverbindung?: string;
}

type BeteiligterTyp = 'mandant' | 'gegner' | 'drittbeteiligter';

const Stammdaten: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [mandanten, setMandanten] = useState<Beteiligter[]>([]);
    const [gegner, setGegner] = useState<Beteiligter[]>([]);
    const [drittbeteiligte, setDrittbeteiligte] = useState<Beteiligter[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Initialize activeTab from URL parameter
    const [activeTab, setActiveTab] = useState<BeteiligterTyp>(
        (searchParams.get('tab') as BeteiligterTyp) || 'mandant'
    );

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Beteiligter | null>(null);
    const [formData, setFormData] = useState<Partial<Beteiligter>>({});

    // Role Selection Modal State
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedForRole, setSelectedForRole] = useState<Beteiligter | null>(null);
    const [roleInput, setRoleInput] = useState('');

    // Check URL parameters for tab and returnTo
    const tabParam = searchParams.get('tab') as BeteiligterTyp | null;
    const returnTo = searchParams.get('returnTo');
    const mode = searchParams.get('mode');

    useEffect(() => {
        // Set tab from URL parameter if present (updates if URL changes)
        if (tabParam && ['mandant', 'gegner', 'drittbeteiligter'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
    }, [tabParam]);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            setLoading(true);
            const [mandantenRes, gegnerRes, drittbeteiligteRes] = await Promise.all([
                api.get('mandanten/'),
                api.get('gegner/'),
                api.get('drittbeteiligte/'),
            ]);
            setMandanten(mandantenRes.data);
            setGegner(gegnerRes.data);
            setDrittbeteiligte(drittbeteiligteRes.data);
        } catch (error) {
            console.error('Fehler beim Laden der Stammdaten:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchAll();
            return;
        }

        try {
            const [mandantenRes, gegnerRes, drittbeteiligteRes] = await Promise.all([
                api.get(`mandanten/search/?q=${searchQuery}`),
                api.get(`gegner/search/?q=${searchQuery}`),
                api.get(`drittbeteiligte/search/?q=${searchQuery}`),
            ]);
            setMandanten(mandantenRes.data);
            setGegner(gegnerRes.data);
            setDrittbeteiligte(drittbeteiligteRes.data);
        } catch (error) {
            console.error('Fehler bei der Suche:', error);
        }
    };

    const handleEdit = (item: Beteiligter) => {
        setEditingItem(item);
        setFormData(item);
        setShowModal(true);
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number, typ: BeteiligterTyp } | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    const handleDelete = (id: number, typ: BeteiligterTyp) => {
        setItemToDelete({ id, typ });
        setDeleteError(null);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        const { id, typ } = itemToDelete;
        let endpoint = '';
        switch (typ) {
            case 'mandant':
                endpoint = `mandanten/${id}/`;
                break;
            case 'gegner':
                endpoint = `gegner/${id}/`;
                break;
            case 'drittbeteiligter':
                endpoint = `drittbeteiligte/${id}/`;
                break;
        }

        try {
            await api.delete(endpoint);
            fetchAll();
            setShowDeleteModal(false);
            setItemToDelete(null);
        } catch (error: any) {
            console.error('Fehler beim Löschen:', error);
            if (error.response && error.response.status === 409) {
                setDeleteError(error.response.data.error);
            } else {
                setDeleteError('Fehler beim Löschen des Eintrags.');
            }
        }
    };

    const handleSave = async () => {
        try {
            const endpoint = activeTab === 'mandant' ? 'mandanten' :
                activeTab === 'gegner' ? 'gegner' : 'drittbeteiligte';

            if (editingItem) {
                await api.put(`${endpoint}/${editingItem.id}/`, formData);
            } else {
                await api.post(`${endpoint}/`, formData);
            }

            setShowModal(false);
            setEditingItem(null);
            setFormData({});
            fetchAll();
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern.');
        }
    };

    const getCurrentData = () => {
        switch (activeTab) {
            case 'mandant': return mandanten;
            case 'gegner': return gegner;
            case 'drittbeteiligter': return drittbeteiligte;
        }
    };

    const getTabLabel = (typ: BeteiligterTyp) => {
        switch (typ) {
            case 'mandant': return 'Mandanten';
            case 'gegner': return 'Gegner';
            case 'drittbeteiligter': return 'Drittbeteiligte';
        }
    };

    const handleDoubleClick = (item: Beteiligter) => {
        console.log("Double Click:", item.name, "Mode:", mode, "ActiveTab:", activeTab);

        // Handle selection mode for Drittbeteiligte
        if (mode === 'select' && activeTab === 'drittbeteiligter') {
            setSelectedForRole(item);
            setRoleInput('');
            setShowRoleModal(true);
            return;
        }

        // Original logic for Mandant/Gegner
        if (returnTo) {
            // Selection mode for Mandant/Gegner (New Akte flow)
            if (activeTab === 'mandant') {
                localStorage.setItem('selectedMandantId', item.id.toString());
            } else if (activeTab === 'gegner') {
                localStorage.setItem('selectedGegnerId', item.id.toString());
            }

            // Force full page reload to trigger useEffect in AkteForm
            setTimeout(() => {
                window.location.href = returnTo;
            }, 200);
        } else if (!mode) {
            // Edit mode (only if not in selection mode)
            handleEdit(item);
        }
    };

    const handleRoleSubmit = () => {
        if (!selectedForRole) return;

        // Store selection in localStorage
        localStorage.setItem('selected_drittbeteiligter_id', selectedForRole.id.toString());
        if (roleInput) {
            localStorage.setItem('selected_drittbeteiligter_rolle', roleInput);
        }

        // Navigate back to Akte
        const akteId = localStorage.getItem('return_to_akte_id');
        if (akteId) {
            localStorage.removeItem('return_to_akte_id');
            window.location.href = `/akte/${akteId}?tab=drittbeteiligte`;
        }
        setShowRoleModal(false);
    };

    return (
        <div className="space-y-6">
            {/* Selection Mode Banner */}
            {(returnTo || (mode === 'select' && activeTab === 'drittbeteiligter')) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-semibold">
                        {activeTab === 'drittbeteiligter'
                            ? "Auswahl-Modus: Doppelklicken Sie auf einen Drittbeteiligten, um ihn auszuwählen"
                            : `Auswahl-Modus: Doppelklicken Sie auf den Namen eines ${activeTab === 'mandant' ? 'Mandanten' : 'Gegners'}, um ihn auszuwählen`
                        }
                    </p>
                </div>
            )}

            {/* Header */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">Stammdaten-Verwaltung</h2>

                {/* Search Bar */}
                <div className="flex gap-3">
                    <input
                        type="text"
                        placeholder="Suche nach Name, Email, Telefon..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button onClick={handleSearch} className="btn btn-secondary">
                        Suchen
                    </button>
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setFormData({ typ: 'Person' });
                            setShowModal(true);
                        }}
                        className="btn btn-accent"
                    >
                        + Neu anlegen
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
                <div className="flex gap-4">
                    {(['mandant', 'gegner', 'drittbeteiligter'] as BeteiligterTyp[]).map((typ) => (
                        <button
                            key={typ}
                            onClick={() => setActiveTab(typ)}
                            className={`px-4 py-3 font-semibold border-b-2 transition-colors ${activeTab === typ
                                ? 'border-primary text-primary'
                                : 'border-transparent text-slate-600 hover:text-slate-900'
                                }`}
                        >
                            {getTabLabel(typ)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className="card">
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Typ</th>
                                {activeTab === 'drittbeteiligter' && <th>Rolle</th>}
                                <th>Telefon</th>
                                <th>Email</th>
                                <th>Adresse</th>
                                <th className="text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={activeTab === 'drittbeteiligter' ? 7 : 6} className="text-center py-8">
                                        Lade Daten...
                                    </td>
                                </tr>
                            ) : getCurrentData().length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === 'drittbeteiligter' ? 7 : 6} className="text-center py-8 text-slate-500">
                                        Keine Einträge vorhanden
                                    </td>
                                </tr>
                            ) : (
                                getCurrentData().map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`hover:bg-slate-50 transition-colors ${returnTo || (mode === 'select' && activeTab === 'drittbeteiligter') ? 'cursor-pointer' : ''}`}
                                        onDoubleClick={() => handleDoubleClick(item)}
                                    >
                                        <td className="font-semibold">
                                            {item.name}
                                        </td>
                                        <td>{item.typ}</td>
                                        {activeTab === 'drittbeteiligter' && <td>{item.rolle || '-'}</td>}
                                        <td>{item.telefon || '-'}</td>
                                        <td>{item.email || '-'}</td>
                                        <td className="text-sm text-slate-600">{item.adresse || '-'}</td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-primary hover:text-primary-dark font-semibold text-sm mr-3"
                                            >
                                                Bearbeiten
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id, activeTab)}
                                                className="text-red-600 hover:text-red-800 font-semibold text-sm"
                                            >
                                                Löschen
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">
                            {editingItem ? 'Bearbeiten' : 'Neu anlegen'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Name *</label>
                                <input
                                    type="text"
                                    value={formData.name || ''}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Typ</label>
                                <select
                                    value={formData.typ || 'Person'}
                                    onChange={(e) => setFormData({ ...formData, typ: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="Person">Natürliche Person</option>
                                    <option value="Firma">Firma</option>
                                    <option value="Versicherung">Versicherung</option>
                                </select>
                            </div>

                            {activeTab === 'drittbeteiligter' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Rolle</label>
                                    <input
                                        type="text"
                                        value={formData.rolle || ''}
                                        onChange={(e) => setFormData({ ...formData, rolle: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Adresse</label>
                                <textarea
                                    value={formData.adresse || ''}
                                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Telefon</label>
                                    <input
                                        type="text"
                                        value={formData.telefon || ''}
                                        onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email || ''}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            {activeTab === 'drittbeteiligter' ? (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Notizen</label>
                                    <textarea
                                        value={formData.notizen || ''}
                                        onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                                    />
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bankverbindung</label>
                                    <textarea
                                        value={formData.bankverbindung || ''}
                                        onChange={(e) => setFormData({ ...formData, bankverbindung: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px]"
                                    />
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn btn-primary"
                                >
                                    Speichern
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Role Selection Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Rolle festlegen</h3>
                        <p className="text-slate-600 mb-4">
                            Bitte geben Sie die Rolle für <strong>{selectedForRole?.name}</strong> in dieser Akte an.
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Rolle (optional)</label>
                            <input
                                type="text"
                                value={roleInput}
                                onChange={(e) => setRoleInput(e.target.value)}
                                placeholder="z.B. Zeuge, Gutachter..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleRoleSubmit()}
                            />
                        </div>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRoleModal(false)}
                                className="btn btn-secondary"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleRoleSubmit}
                                className="btn btn-primary"
                            >
                                Auswählen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Eintrag löschen</h3>
                        <p className="text-slate-600 mb-6">
                            Möchten Sie diesen Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                        </p>

                        {deleteError && (
                            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">
                                {deleteError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="btn btn-secondary"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="btn btn-error"
                            >
                                Löschen
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stammdaten;
