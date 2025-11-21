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
    const [activeTab, setActiveTab] = useState<BeteiligterTyp>('mandant');
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Beteiligter | null>(null);
    const [formData, setFormData] = useState<Partial<Beteiligter>>({});

    // Check URL parameters for tab and returnTo
    const tabParam = searchParams.get('tab') as BeteiligterTyp | null;
    const returnTo = searchParams.get('returnTo');

    useEffect(() => {
        // Set tab from URL parameter if present
        if (tabParam && ['mandant', 'gegner', 'drittbeteiligter'].includes(tabParam)) {
            setActiveTab(tabParam);
        }
        fetchAll();
    }, [tabParam]);

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

    const handleDelete = async (id: number, typ: BeteiligterTyp) => {
        if (!window.confirm('Möchten Sie diesen Eintrag wirklich löschen?')) return;

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
        } catch (error) {
            console.error('Fehler beim Löschen:', error);
            alert('Fehler beim Löschen des Eintrags.');
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
        if (!returnTo) return; // Only handle double-click in selection mode

        // Save ONLY the ID to localStorage
        if (activeTab === 'mandant') {
            localStorage.setItem('selectedMandantId', item.id.toString());
        } else if (activeTab === 'gegner') {
            localStorage.setItem('selectedGegnerId', item.id.toString());
        }

        // Force full page reload to trigger useEffect in AkteForm
        setTimeout(() => {
            window.location.href = returnTo;
        }, 200);
    };

    return (
        <div className="space-y-6">
            {/* Selection Mode Banner */}
            {returnTo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-blue-800 font-semibold">
                        Auswahl-Modus: Doppelklicken Sie auf den Namen eines {getTabLabel(activeTab).slice(0, -1)}, um ihn auszuwählen
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
                                        className={`hover:bg-slate-50 transition-colors ${returnTo ? 'cursor-pointer' : ''}`}
                                    >
                                        <td
                                            className="font-semibold"
                                            onDoubleClick={() => handleDoubleClick(item)}
                                        >
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
                                        placeholder="z.B. Zeuge, Sachverständiger"
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
                                    rows={2}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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

                            {activeTab !== 'drittbeteiligter' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Bankverbindung</label>
                                    <textarea
                                        value={formData.bankverbindung || ''}
                                        onChange={(e) => setFormData({ ...formData, bankverbindung: e.target.value })}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            )}

                            {activeTab === 'drittbeteiligter' && (
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Notizen</label>
                                    <textarea
                                        value={formData.notizen || ''}
                                        onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingItem(null);
                                    setFormData({});
                                }}
                                className="btn btn-secondary"
                            >
                                Abbrechen
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn btn-accent"
                                disabled={!formData.name}
                            >
                                Speichern
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stammdaten;
