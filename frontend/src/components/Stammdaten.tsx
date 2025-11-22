import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

type BeteiligterTyp = 'mandant' | 'gegner' | 'drittbeteiligter';

interface Beteiligter {
    id: number;
    // Mandant-specific fields
    ansprache?: string;
    vorname?: string;
    nachname?: string;
    // Gegner-specific fields (now similar to Mandant address)
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    stadt?: string;
    land?: string;

    rechtsschutz?: boolean;
    rechtsschutz_bei?: string;
    vst_berechtigt?: boolean;
    notizen?: string;

    // Common fields
    name?: string; // Used for Gegner name / Mandant full name display
    telefon: string;
    email: string;
    typ: string;
    rolle?: string;
    bankverbindung?: string; // Only for Mandant now (if needed) or legacy
    adresse?: string; // Legacy field for Drittbeteiligter or fallback
}

const Stammdaten: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<BeteiligterTyp>('mandant');
    const [searchQuery, setSearchQuery] = useState('');
    const [mandanten, setMandanten] = useState<Beteiligter[]>([]);
    const [gegner, setGegner] = useState<Beteiligter[]>([]);
    const [drittbeteiligte, setDrittbeteiligte] = useState<Beteiligter[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal State
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

    const editId = searchParams.get('editId');

    useEffect(() => {
        fetchAll();
    }, []);

    useEffect(() => {
        if (editId && !loading) {
            const id = parseInt(editId);
            let item: Beteiligter | undefined;

            if (activeTab === 'mandant') item = mandanten.find(m => m.id === id);
            else if (activeTab === 'gegner') item = gegner.find(g => g.id === id);
            else if (activeTab === 'drittbeteiligter') item = drittbeteiligte.find(d => d.id === id);

            if (item) {
                handleEdit(item);
            }
        }
    }, [editId, loading, mandanten, gegner, drittbeteiligte, activeTab]);

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

            if (returnTo) {
                window.location.href = returnTo;
                return;
            }

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

    const handleDoubleClick = (item: Beteiligter) => {
        // If we are in selection mode (returnTo is present), select and return
        if (returnTo) {
            if (activeTab === 'mandant') {
                localStorage.setItem('selectedMandantId', item.id.toString());
            } else if (activeTab === 'gegner') {
                localStorage.setItem('selectedGegnerId', item.id.toString());
            }
            // Navigate back
            navigate(returnTo);
        } else {
            // Otherwise open edit modal
            handleEdit(item);
        }
    };

    return (
        <div className="h-full flex flex-col bg-slate-50">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 px-8 py-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Stammdaten</h1>
                        <p className="text-slate-500">Verwaltung von Mandanten, Gegnern und Drittbeteiligten</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingItem(null);
                            setFormData(activeTab === 'mandant' ? { ansprache: 'Herr', land: 'Deutschland' } : { land: 'Deutschland', typ: 'Versicherung' });
                            setShowModal(true);
                        }}
                        className="btn btn-primary"
                    >
                        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Neu anlegen
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 p-1 rounded-lg w-fit">
                    {(['mandant', 'gegner', 'drittbeteiligter'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => {
                                setActiveTab(tab);
                                // Update URL without reloading
                                const url = new URL(window.location.href);
                                url.searchParams.set('tab', tab);
                                window.history.pushState({}, '', url);
                            }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === tab
                                ? 'bg-white text-slate-900 shadow-sm'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                                }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}en
                        </button>
                    ))}
                </div>
            </div>

            {/* Search & Content */}
            <div className="flex-1 p-8 overflow-hidden flex flex-col">
                <div className="mb-6">
                    <div className="relative max-w-md">
                        <input
                            type="text"
                            placeholder="Suchen..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="input pl-10"
                        />
                        <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {returnTo && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
                        <span>
                            <strong>Auswahl-Modus:</strong> Doppelklicken Sie auf einen Eintrag, um ihn auszuwählen.
                        </span>
                        <button
                            onClick={() => window.location.href = returnTo}
                            className="text-sm underline hover:no-underline"
                        >
                            Abbrechen
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Name</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Straße</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">PLZ</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Stadt</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Kontakt</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200">Typ</th>
                                <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-200 text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {getCurrentData().map((item) => (
                                <tr
                                    key={item.id}
                                    onDoubleClick={() => handleDoubleClick(item)}
                                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">
                                            {activeTab === 'mandant' ? (
                                                item.ansprache === 'Firma' ? item.vorname : `${item.vorname} ${item.nachname}`
                                            ) : (
                                                item.name
                                            )}
                                        </div>
                                        {activeTab === 'mandant' && item.ansprache === 'Firma' && (
                                            <div className="text-xs text-slate-500">AP: {item.nachname}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {item.strasse ? (
                                            <div>{item.strasse} {item.hausnummer}</div>
                                        ) : (
                                            <div>{item.adresse?.split('\n')[0] || '-'}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {item.plz || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {item.stadt || (item.adresse?.split('\n')[1]?.split(' ')[1] || '-')}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {item.telefon && <div className="flex items-center gap-2"><span className="text-xs text-slate-400">Tel:</span> {item.telefon}</div>}
                                        {item.email && <div className="flex items-center gap-2"><span className="text-xs text-slate-400">Mail:</span> {item.email}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${item.typ === 'Person' || item.ansprache === 'Herr' || item.ansprache === 'Frau' ? 'bg-blue-100 text-blue-800' :
                                                item.typ === 'Unternehmen' || item.ansprache === 'Firma' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-amber-100 text-amber-800'}`}>
                                            {item.typ || item.ansprache}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                                title="Bearbeiten"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id, activeTab); }}
                                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                title="Löschen"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-900">
                                {editingItem ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto">
                            <div className="grid grid-cols-1 gap-6">
                                {/* Mandant Specific Fields */}
                                {activeTab === 'mandant' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">Ansprache</label>
                                            <div className="flex gap-4">
                                                {['Herr', 'Frau', 'Firma'].map((option) => (
                                                    <label key={option} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            name="ansprache"
                                                            value={option}
                                                            checked={formData.ansprache === option}
                                                            onChange={(e) => setFormData({ ...formData, ansprache: e.target.value })}
                                                            className="text-primary focus:ring-primary"
                                                        />
                                                        <span className="text-sm text-slate-700">{option}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                                    {formData.ansprache === 'Firma' ? 'Firmenname' : 'Vorname'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.vorname || ''}
                                                    onChange={(e) => setFormData({ ...formData, vorname: e.target.value })}
                                                    className="input"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">
                                                    {formData.ansprache === 'Firma' ? 'Ansprechpartner' : 'Nachname'}
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.nachname || ''}
                                                    onChange={(e) => setFormData({ ...formData, nachname: e.target.value })}
                                                    className="input"
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Gegner Specific Fields */}
                                {activeTab === 'gegner' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Name / Firma</label>
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Common Address Fields (Mandant & Gegner) */}
                                {(activeTab === 'mandant' || activeTab === 'gegner') && (
                                    <>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Straße</label>
                                                <input
                                                    type="text"
                                                    value={formData.strasse || ''}
                                                    onChange={(e) => setFormData({ ...formData, strasse: e.target.value })}
                                                    className="input"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Nr.</label>
                                                <input
                                                    type="text"
                                                    value={formData.hausnummer || ''}
                                                    onChange={(e) => setFormData({ ...formData, hausnummer: e.target.value })}
                                                    className="input"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">PLZ</label>
                                                <input
                                                    type="text"
                                                    value={formData.plz || ''}
                                                    onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                                                    className="input"
                                                />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Stadt</label>
                                                <input
                                                    type="text"
                                                    value={formData.stadt || ''}
                                                    onChange={(e) => setFormData({ ...formData, stadt: e.target.value })}
                                                    className="input"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Land</label>
                                            <input
                                                type="text"
                                                value={formData.land || ''}
                                                onChange={(e) => setFormData({ ...formData, land: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Drittbeteiligter Legacy Fields */}
                                {activeTab === 'drittbeteiligter' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                                            <input
                                                type="text"
                                                value={formData.name || ''}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Adresse</label>
                                            <textarea
                                                rows={3}
                                                value={formData.adresse || ''}
                                                onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                                className="input"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-1">Rolle</label>
                                            <input
                                                type="text"
                                                value={formData.rolle || ''}
                                                onChange={(e) => setFormData({ ...formData, rolle: e.target.value })}
                                                className="input"
                                                placeholder="z.B. Zeuge, Gutachter"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Contact Fields (Common) */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Telefon</label>
                                        <input
                                            type="tel"
                                            value={formData.telefon || ''}
                                            onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">E-Mail</label>
                                        <input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="input"
                                        />
                                    </div>
                                </div>

                                {/* Mandant Extra Fields */}
                                {activeTab === 'mandant' && (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Bankverbindung</label>
                                                <textarea
                                                    rows={1}
                                                    value={formData.bankverbindung || ''}
                                                    onChange={(e) => setFormData({ ...formData, bankverbindung: e.target.value })}
                                                    className="input resize-none"
                                                    placeholder="IBAN / BIC"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-1">Notizen</label>
                                                <textarea
                                                    rows={1}
                                                    value={formData.notizen || ''}
                                                    onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
                                                    className="input resize-none"
                                                    placeholder="Interne Notizen"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-3 pt-2">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.rechtsschutz || false}
                                                    onChange={(e) => setFormData({ ...formData, rechtsschutz: e.target.checked })}
                                                    className="rounded text-primary focus:ring-primary"
                                                />
                                                <span className="text-sm font-medium text-slate-700">Rechtsschutzversicherung vorhanden</span>
                                            </label>

                                            {formData.rechtsschutz && (
                                                <div className="pl-6">
                                                    <input
                                                        type="text"
                                                        value={formData.rechtsschutz_bei || ''}
                                                        onChange={(e) => setFormData({ ...formData, rechtsschutz_bei: e.target.value })}
                                                        className="input text-sm"
                                                        placeholder="Versicherungsgesellschaft / Nummer"
                                                    />
                                                </div>
                                            )}

                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.vst_berechtigt || false}
                                                    onChange={(e) => setFormData({ ...formData, vst_berechtigt: e.target.checked })}
                                                    className="rounded text-primary focus:ring-primary"
                                                />
                                                <span className="text-sm font-medium text-slate-700">Vorsteuerabzugsberechtigt</span>
                                            </label>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
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
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Eintrag löschen?</h3>
                        <p className="text-slate-600 mb-6">
                            Möchten Sie diesen Eintrag wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                        </p>

                        {deleteError && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
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
                                className="btn bg-red-600 text-white hover:bg-red-700"
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
