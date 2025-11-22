import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

interface Drittbeteiligter {
    id: number;
    name: string;
    adresse: string;
    telefon: string;
    email: string;
    typ: string;
    notizen?: string;
}

interface AkteDrittbeteiligter {
    id: number;
    drittbeteiligter: Drittbeteiligter;
    rolle: string;
}

interface DrittbeteiligteListProps {
    akteId: number | string;
}

const DrittbeteiligteList: React.FC<DrittbeteiligteListProps> = ({ akteId }) => {
    const navigate = useNavigate();
    const [verknuepfungen, setVerknuepfungen] = useState<AkteDrittbeteiligter[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [editingLink, setEditingLink] = useState<AkteDrittbeteiligter | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        typ: 'Person',
        adresse: '',
        telefon: '',
        email: '',
        notizen: '',
        rolle: ''
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const akteResponse = await api.get(`akten/${akteId}/`);
            setVerknuepfungen(akteResponse.data.akte_drittbeteiligte || []);
        } catch (err) {
            console.error("Fehler beim Laden der Drittbeteiligten", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (akteId) {
            fetchData();
        }
    }, [akteId]);

    // Check for selection from Stammdaten (via URL params or localStorage)
    useEffect(() => {
        const selectedId = localStorage.getItem('selected_drittbeteiligter_id');
        const selectedRolle = localStorage.getItem('selected_drittbeteiligter_rolle');

        if (selectedId) {
            // Add selected drittbeteiligter to akte
            handleAddFromStammdaten(parseInt(selectedId), selectedRolle || '');
            localStorage.removeItem('selected_drittbeteiligter_id');
            localStorage.removeItem('selected_drittbeteiligter_rolle');
        }
    }, []);

    const handleAddFromStammdaten = async (drittbeteiligter_id: number, rolle: string) => {
        try {
            await api.post(`akten/${akteId}/add_drittbeteiligter/`, {
                drittbeteiligter_id,
                rolle
            });
            fetchData();
        } catch (err: any) {
            console.error("Fehler beim Hinzufügen", err);
            // Ignore "already exists" error silently or show toast, but don't block
            if (err.response?.status !== 400) {
                alert(err.response?.data?.detail || "Fehler beim Hinzufügen.");
            } else {
                alert("Dieser Drittbeteiligte ist bereits hinzugefügt.");
            }
        }
    };

    const handleOpenModal = () => {
        setFormData({
            name: '',
            typ: 'Person',
            adresse: '',
            telefon: '',
            email: '',
            notizen: '',
            rolle: ''
        });
        setModalMode('create');
        setEditingLink(null);
        setShowModal(true);
    };

    const handleEdit = (link: AkteDrittbeteiligter) => {
        setFormData({
            name: link.drittbeteiligter.name,
            typ: link.drittbeteiligter.typ,
            adresse: link.drittbeteiligter.adresse,
            telefon: link.drittbeteiligter.telefon,
            email: link.drittbeteiligter.email,
            notizen: link.drittbeteiligter.notizen || '',
            rolle: link.rolle
        });
        setEditingLink(link);
        setModalMode('edit');
        setShowModal(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        console.log("handleSave triggered", formData, "AkteID:", akteId);

        if (!formData.name.trim()) {
            alert("Name ist erforderlich.");
            return;
        }

        setSubmitting(true);

        try {
            if (modalMode === 'edit' && editingLink) {
                // 1. Update Drittbeteiligter Details
                console.log("Updating Drittbeteiligter...");
                await api.patch(`drittbeteiligte/${editingLink.drittbeteiligter.id}/`, {
                    name: formData.name,
                    typ: formData.typ,
                    adresse: formData.adresse,
                    telefon: formData.telefon,
                    email: formData.email,
                    notizen: formData.notizen
                });

                // 2. Update Role (Link)
                if (formData.rolle !== editingLink.rolle) {
                    console.log("Updating Role...");
                    await api.patch(`akten/${akteId}/update_drittbeteiligter_rolle/${editingLink.id}/`, {
                        rolle: formData.rolle
                    });
                }
            } else {
                // Create New
                console.log("Creating New...");
                await api.post(`akten/${akteId}/add_drittbeteiligter/`, formData);
            }

            console.log("Save successful");
            setShowModal(false);
            await fetchData();
        } catch (err: any) {
            console.error("Fehler beim Speichern", err);
            alert(err.response?.data?.detail || "Fehler beim Speichern.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async (linkId: number) => {
        if (!window.confirm("Wirklich entfernen?")) return;
        try {
            await api.delete(`akten/${akteId}/remove_drittbeteiligter/${linkId}/`);
            fetchData();
        } catch (err) {
            console.error("Fehler beim Entfernen", err);
            alert("Fehler beim Entfernen.");
        }
    };

    const handleNavigateToStammdaten = () => {
        // Store current akte ID for return
        localStorage.setItem('return_to_akte_id', akteId.toString());
        // Force reload to ensure Stammdaten component picks up the tab param
        window.location.href = '/stammdaten?tab=drittbeteiligte&mode=select';
    };

    return (
        <div className="p-6">
            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
                <button
                    onClick={handleOpenModal}
                    className="btn btn-primary"
                >
                    + Neu anlegen
                </button>
                <button
                    onClick={handleNavigateToStammdaten}
                    className="btn btn-secondary"
                >
                    Aus Stammdaten auswählen
                </button>
            </div>

            {/* Grid of Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {verknuepfungen.map(vk => (
                    <div key={vk.id} className="card">
                        <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                            <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {vk.rolle || 'Drittbeteiligter'}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(vk)}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Bearbeiten
                                </button>
                                <button
                                    onClick={() => handleRemove(vk.id)}
                                    className="text-sm text-red-500 hover:underline"
                                >
                                    Entfernen
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3 text-sm">
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-text-muted">Name:</span>
                                <span className="col-span-2 font-medium text-slate-900">{vk.drittbeteiligter.name}</span>
                            </div>
                            {vk.drittbeteiligter.typ && (
                                <div className="grid grid-cols-3 gap-2">
                                    <span className="text-text-muted">Typ:</span>
                                    <span className="col-span-2 text-slate-700">{vk.drittbeteiligter.typ}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-text-muted">Adresse:</span>
                                <span className="col-span-2 text-slate-700">{vk.drittbeteiligter.adresse || '-'}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <span className="text-text-muted">Kontakt:</span>
                                <div className="col-span-2 flex flex-col">
                                    {vk.drittbeteiligter.telefon ? (
                                        <a href={`tel:${vk.drittbeteiligter.telefon}`} className="text-primary hover:underline">{vk.drittbeteiligter.telefon}</a>
                                    ) : '-'}
                                    {vk.drittbeteiligter.email && (
                                        <a href={`mailto:${vk.drittbeteiligter.email}`} className="text-primary hover:underline">{vk.drittbeteiligter.email}</a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {verknuepfungen.length === 0 && !loading && (
                <p className="text-center text-slate-500 py-8">Noch keine Drittbeteiligten hinzugefügt.</p>
            )}

            {verknuepfungen.length >= 10 && (
                <p className="text-center text-amber-600 py-4 text-sm">Maximum von 10 Drittbeteiligten erreicht.</p>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">
                                {modalMode === 'create' ? 'Neuen Drittbeteiligten anlegen' : 'Drittbeteiligten bearbeiten'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            {/* Rolle Field */}
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Rolle (optional)</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    placeholder="z.B. Zeuge, Sachverständiger, Versicherung..."
                                    value={formData.rolle}
                                    onChange={(e) => setFormData({ ...formData, rolle: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Name *</label>
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Typ</label>
                                <select
                                    className="input w-full"
                                    value={formData.typ}
                                    onChange={(e) => setFormData({ ...formData, typ: e.target.value })}
                                >
                                    <option value="Person">Natürliche Person</option>
                                    <option value="Unternehmen">Unternehmen</option>
                                    <option value="Behörde">Behörde</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Adresse</label>
                                <textarea
                                    className="input w-full min-h-[60px]"
                                    value={formData.adresse}
                                    onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Telefon</label>
                                    <input
                                        type="text"
                                        className="input w-full"
                                        value={formData.telefon}
                                        onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="input w-full"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Notizen</label>
                                <textarea
                                    className="input w-full min-h-[60px]"
                                    value={formData.notizen}
                                    onChange={(e) => setFormData({ ...formData, notizen: e.target.value })}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Abbrechen</button>
                                <button type="submit" className="btn btn-primary px-6" disabled={submitting}>
                                    {submitting ? 'Speichert...' : 'Speichern'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DrittbeteiligteList;
