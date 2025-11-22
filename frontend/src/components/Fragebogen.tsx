import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

interface FragebogenProps {
    akteId: string;
}

interface FragebogenData {
    unfallort?: string;
    datum_zeit?: string;
    polizei?: boolean;
    polizei_vev?: string;
    polizei_dienststelle?: string;
    polizei_vorgangs_nr?: string;
    schadenshergang?: string;
    zeugen?: boolean;
    lichtbilder_unfallort?: boolean;
    kfz_finanziert?: boolean;
    kfz_finanziert_bei?: string;
    kfz_finanziert_vertrag_nr?: string;
    kfz_geleast?: boolean;
    kfz_geleast_bei?: string;
    kfz_geleast_vertrag_nr?: string;
    kennzeichen?: string;
    kfz_typ?: string;
    kfz_kw_ps?: string;
    kfz_ez?: string;
    vollkasko?: boolean;
    vollkasko_bei?: string;
    vers_gegner?: string;
    gegner_kennzeichen?: string;
    schaden_nr?: string;
    sv_beauftragt?: boolean;
    sv_beauftragt_details?: string;
    sv_nicht_beauftragt_grund?: string;
    mietwagen_nutzungsausfall?: 'nein' | 'mietwagen' | 'nutzungsausfall';
    mietwagen_von?: string;
    kfz_verkehrssicher?: boolean;
    personenschaden?: boolean;
    personenschaden_details?: string;
    referat?: string;
    servicemitarbeiter?: string;
    aufnahme_datum_zeit?: string;
}

const Fragebogen: React.FC<FragebogenProps> = ({ akteId }) => {
    const [formData, setFormData] = useState<FragebogenData>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [saveTimeout, setSaveTimeout] = useState<number | null>(null);

    useEffect(() => {
        fetchFragebogenData();
    }, [akteId]);

    const fetchFragebogenData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`akten/${akteId}/`);
            if (response.data.fragebogen_data) {
                setFormData(response.data.fragebogen_data);
            }
        } catch (error) {
            console.error('Fehler beim Laden der Fragebogen-Daten:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveFragebogen = useCallback(async (data: FragebogenData) => {
        try {
            setSaving(true);
            await api.post(`akten/${akteId}/update_fragebogen/`, data);
        } catch (error) {
            console.error('Fehler beim Speichern:', error);
            alert('Fehler beim Speichern der Fragebogen-Daten.');
        } finally {
            setSaving(false);
        }
    }, [akteId]);

    const handleChange = (field: keyof FragebogenData, value: any) => {
        const newData = { ...formData, [field]: value };
        setFormData(newData);

        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        const timeout = setTimeout(() => {
            saveFragebogen(newData);
        }, 2000);
        setSaveTimeout(timeout);
    };

    const handleSaveNow = () => {
        if (saveTimeout) {
            clearTimeout(saveTimeout);
        }
        saveFragebogen(formData);
    };

    const handleGeneratePDF = async () => {
        try {
            setPdfGenerating(true);
            const response = await api.get(`akten/${akteId}/export_fragebogen_pdf/`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `fragebogen_${akteId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Fehler beim Generieren der PDF:', error);
            alert('Fehler beim Generieren der PDF.');
        } finally {
            setPdfGenerating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex justify-between items-center bg-white rounded-lg shadow-sm p-3 border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900">Fragebogen</h2>
                <div className="flex gap-2">
                    {saving && <span className="text-xs text-slate-500 self-center">Speichert...</span>}
                    <button onClick={handleSaveNow} className="btn btn-secondary btn-sm" disabled={saving}>
                        Speichern
                    </button>
                    <button onClick={handleGeneratePDF} className="btn btn-primary btn-sm" disabled={pdfGenerating}>
                        {pdfGenerating ? 'Generiere PDF...' : 'PDF generieren'}
                    </button>
                </div>
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-2 gap-3">
                {/* LEFT COLUMN */}
                <div className="space-y-2">
                    {/* Unfalldaten */}
                    <div className="card p-3">
                        <h3 className="text-sm font-bold text-secondary mb-2">Unfalldaten</h3>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Unfallort:</label>
                                <input type="text" value={formData.unfallort || ''} onChange={(e) => handleChange('unfallort', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Datum/Zeit:</label>
                                <input type="datetime-local" value={formData.datum_zeit || ''} onChange={(e) => handleChange('datum_zeit', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Polizei:</label>
                                <div className="flex-1 flex gap-3 text-sm">
                                    <label className="flex items-center"><input type="radio" checked={formData.polizei === true} onChange={() => handleChange('polizei', true)} className="mr-1" />Ja</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.polizei === false} onChange={() => handleChange('polizei', false)} className="mr-1" />Nein</label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">VEV:</label>
                                <input type="text" value={formData.polizei_vev || ''} onChange={(e) => handleChange('polizei_vev', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Dienststelle:</label>
                                <input type="text" value={formData.polizei_dienststelle || ''} onChange={(e) => handleChange('polizei_dienststelle', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Vorgangs-Nr.:</label>
                                <input type="text" value={formData.polizei_vorgangs_nr || ''} onChange={(e) => handleChange('polizei_vorgangs_nr', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Schadenshergang */}
                    <div className="card p-3">
                        <h3 className="text-sm font-bold text-secondary mb-2">Schadenshergang</h3>
                        <div className="space-y-1.5">
                            <div className="flex gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0 pt-1">Hergang:</label>
                                <textarea value={formData.schadenshergang || ''} onChange={(e) => handleChange('schadenshergang', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary min-h-[50px]" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Zeugen:</label>
                                <div className="flex-1 flex gap-3 text-sm">
                                    <label className="flex items-center"><input type="radio" checked={formData.zeugen === true} onChange={() => handleChange('zeugen', true)} className="mr-1" />Ja</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.zeugen === false} onChange={() => handleChange('zeugen', false)} className="mr-1" />Nein</label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Lichtbilder:</label>
                                <div className="flex-1 flex gap-3 text-sm">
                                    <label className="flex items-center"><input type="radio" checked={formData.lichtbilder_unfallort === true} onChange={() => handleChange('lichtbilder_unfallort', true)} className="mr-1" />Ja</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.lichtbilder_unfallort === false} onChange={() => handleChange('lichtbilder_unfallort', false)} className="mr-1" />Nein</label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* KFZ-Daten */}
                    <div className="card p-3">
                        <h3 className="text-sm font-bold text-secondary mb-2">KFZ-Daten</h3>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Finanziert:</label>
                                <div className="flex-1 flex gap-3 text-sm">
                                    <label className="flex items-center"><input type="radio" checked={formData.kfz_finanziert === true} onChange={() => handleChange('kfz_finanziert', true)} className="mr-1" />Ja</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.kfz_finanziert === false} onChange={() => handleChange('kfz_finanziert', false)} className="mr-1" />Nein</label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">bei der:</label>
                                <input type="text" value={formData.kfz_finanziert_bei || ''} onChange={(e) => handleChange('kfz_finanziert_bei', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Vertrags-Nr.:</label>
                                <input type="text" value={formData.kfz_finanziert_vertrag_nr || ''} onChange={(e) => handleChange('kfz_finanziert_vertrag_nr', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Geleast:</label>
                                <div className="flex-1 flex gap-3 text-sm">
                                    <label className="flex items-center"><input type="radio" checked={formData.kfz_geleast === true} onChange={() => handleChange('kfz_geleast', true)} className="mr-1" />Ja</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.kfz_geleast === false} onChange={() => handleChange('kfz_geleast', false)} className="mr-1" />Nein</label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">bei der:</label>
                                <input type="text" value={formData.kfz_geleast_bei || ''} onChange={(e) => handleChange('kfz_geleast_bei', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Vertrags-Nr.:</label>
                                <input type="text" value={formData.kfz_geleast_vertrag_nr || ''} onChange={(e) => handleChange('kfz_geleast_vertrag_nr', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Kennzeichen:</label>
                                <input type="text" value={formData.kennzeichen || ''} onChange={(e) => handleChange('kennzeichen', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Typ/KW/EZ:</label>
                                <div className="flex-1 flex gap-1">
                                    <input type="text" value={formData.kfz_typ || ''} onChange={(e) => handleChange('kfz_typ', e.target.value)} placeholder="Typ" className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                                    <input type="text" value={formData.kfz_kw_ps || ''} onChange={(e) => handleChange('kfz_kw_ps', e.target.value)} placeholder="KW/PS" className="w-20 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                                    <input type="date" value={formData.kfz_ez || ''} onChange={(e) => handleChange('kfz_ez', e.target.value)} className="w-32 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Vollkasko:</label>
                                <div className="flex-1 flex gap-3 text-sm">
                                    <label className="flex items-center"><input type="radio" checked={formData.vollkasko === true} onChange={() => handleChange('vollkasko', true)} className="mr-1" />Ja</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.vollkasko === false} onChange={() => handleChange('vollkasko', false)} className="mr-1" />Nein</label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">bei:</label>
                                <input type="text" value={formData.vollkasko_bei || ''} onChange={(e) => handleChange('vollkasko_bei', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="space-y-2">
                    {/* Versicherung & SV */}
                    <div className="card p-3">
                        <h3 className="text-sm font-bold text-secondary mb-2">Versicherung & SV</h3>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Vers. Gegner:</label>
                                <input type="text" value={formData.vers_gegner || ''} onChange={(e) => handleChange('vers_gegner', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Gegner KFZ:</label>
                                <input type="text" value={formData.gegner_kennzeichen || ''} onChange={(e) => handleChange('gegner_kennzeichen', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Schaden-Nr.:</label>
                                <input type="text" value={formData.schaden_nr || ''} onChange={(e) => handleChange('schaden_nr', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">SV beauftragt:</label>
                                <div className="flex-1 flex gap-3 text-sm">
                                    <label className="flex items-center"><input type="radio" checked={formData.sv_beauftragt === true} onChange={() => handleChange('sv_beauftragt', true)} className="mr-1" />Ja</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.sv_beauftragt === false} onChange={() => handleChange('sv_beauftragt', false)} className="mr-1" />Nein</label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Details (Ja):</label>
                                <input type="text" value={formData.sv_beauftragt_details || ''} onChange={(e) => handleChange('sv_beauftragt_details', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">weil (Nein):</label>
                                <input type="text" value={formData.sv_nicht_beauftragt_grund || ''} onChange={(e) => handleChange('sv_nicht_beauftragt_grund', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                        </div>
                    </div>

                    {/* Mietwagen & Schaden */}
                    <div className="card p-3">
                        <h3 className="text-sm font-bold text-secondary mb-2">Mietwagen & Schaden</h3>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">MW/NU:</label>
                                <div className="flex-1 flex gap-2 text-sm">
                                    <label className="flex items-center"><input type="radio" checked={formData.mietwagen_nutzungsausfall === 'mietwagen'} onChange={() => handleChange('mietwagen_nutzungsausfall', 'mietwagen')} className="mr-1" />MW</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.mietwagen_nutzungsausfall === 'nutzungsausfall'} onChange={() => handleChange('mietwagen_nutzungsausfall', 'nutzungsausfall')} className="mr-1" />NU</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.mietwagen_nutzungsausfall === 'nein'} onChange={() => handleChange('mietwagen_nutzungsausfall', 'nein')} className="mr-1" />Nein</label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">MW von:</label>
                                <input type="text" value={formData.mietwagen_von || ''} onChange={(e) => handleChange('mietwagen_von', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Verkehrssicher:</label>
                                <div className="flex-1 flex gap-3 text-sm">
                                    <label className="flex items-center"><input type="radio" checked={formData.kfz_verkehrssicher === true} onChange={() => handleChange('kfz_verkehrssicher', true)} className="mr-1" />Ja</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.kfz_verkehrssicher === false} onChange={() => handleChange('kfz_verkehrssicher', false)} className="mr-1" />Nein</label>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Personensch.:</label>
                                <div className="flex-1 flex gap-3 text-sm">
                                    <label className="flex items-center"><input type="radio" checked={formData.personenschaden === true} onChange={() => handleChange('personenschaden', true)} className="mr-1" />Ja</label>
                                    <label className="flex items-center"><input type="radio" checked={formData.personenschaden === false} onChange={() => handleChange('personenschaden', false)} className="mr-1" />Nein</label>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0 pt-1">Details:</label>
                                <textarea value={formData.personenschaden_details || ''} onChange={(e) => handleChange('personenschaden_details', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary min-h-[50px]" />
                            </div>
                        </div>
                    </div>

                    {/* Verwaltung */}
                    <div className="card p-3">
                        <h3 className="text-sm font-bold text-secondary mb-2">Verwaltung</h3>
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Referat:</label>
                                <input type="text" value={formData.referat || ''} onChange={(e) => handleChange('referat', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Servicemit.:</label>
                                <input type="text" value={formData.servicemitarbeiter || ''} onChange={(e) => handleChange('servicemitarbeiter', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-slate-700 w-24 flex-shrink-0">Aufnahme:</label>
                                <input type="datetime-local" value={formData.aufnahme_datum_zeit || ''} onChange={(e) => handleChange('aufnahme_datum_zeit', e.target.value)} className="flex-1 px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Fragebogen;
