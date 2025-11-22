import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

interface VerlaufItem {
    id: number;
    type: 'dokument' | 'notiz';
    titel: string;
    inhalt?: string; // For notes
    dateiname?: string; // For docs
    datum?: string; // Display date
    erstellt_am: string; // Sort date
    pfad_auf_server?: string; // For docs
}

interface VerlaufSectionProps {
    akteId: string | number;
}

const VerlaufSection: React.FC<VerlaufSectionProps> = ({ akteId }) => {
    const [items, setItems] = useState<VerlaufItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sort State
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    // New Note State
    const [newNoteTitle, setNewNoteTitle] = useState("");
    const [newNoteContent, setNewNoteContent] = useState("");
    const [showNoteForm, setShowNoteForm] = useState(false);

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingType, setEditingType] = useState<'dokument' | 'notiz' | null>(null);
    const [editTitel, setEditTitel] = useState("");
    const [editInhalt, setEditInhalt] = useState("");
    const [editDatum, setEditDatum] = useState("");

    const fetchItems = async () => {
        try {
            setLoading(true);
            // Fetch Documents
            const docResponse = await api.get(`akten/${akteId}/`);
            const docs = (docResponse.data.dokumente || []).map((d: any) => ({
                ...d,
                type: 'dokument'
            }));

            // Fetch Notes (via Organizer endpoint for convenience)
            const orgResponse = await api.get(`akten/${akteId}/organizer/`);
            const notes = (orgResponse.data.filter((i: any) => i.typ === 'Notiz') || []).map((n: any) => ({
                id: n.id,
                type: 'notiz',
                titel: n.titel,
                inhalt: n.beschreibung, // Organizer endpoint maps 'inhalt' to 'beschreibung'
                erstellt_am: n.erstellt_am,
                datum: n.erstellt_am
            }));

            // Merge
            const combined = [...docs, ...notes];
            setItems(combined);
        } catch (err) {
            console.error("Fehler beim Laden des Verlaufs", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (akteId) fetchItems();
    }, [akteId]);

    // --- Sort Logic ---
    const sortedItems = [...items].sort((a, b) => {
        const dateA = new Date(a.erstellt_am).getTime();
        const dateB = new Date(b.erstellt_am).getTime();
        return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // --- Upload Logic ---
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            await handleUpload(event.target.files[0]);
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleUpload(e.dataTransfer.files[0]);
        }
    };

    const handleUpload = async (file: File) => {
        setUploading(true);
        const formData = new FormData();
        formData.append('datei', file);
        formData.append('titel', file.name);

        try {
            const response = await api.post(`akten/${akteId}/dokumente/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Add to list locally
            const newDoc = { ...response.data, type: 'dokument' };
            setItems(prev => [newDoc, ...prev]);
        } catch (err) {
            console.error("Fehler beim Upload", err);
            alert("Fehler beim Upload der Datei.");
        } finally {
            setUploading(false);
        }
    };

    // --- Note Logic ---
    const handleAddNote = async () => {
        if (!newNoteTitle.trim()) return;
        try {
            const payload = {
                akte: akteId,
                titel: newNoteTitle,
                inhalt: newNoteContent
            };
            await api.post('organizer/notizen/', payload);
            setNewNoteTitle("");
            setNewNoteContent("");
            setShowNoteForm(false);
            fetchItems(); // Refresh to get correct ID and timestamp
        } catch (err) {
            console.error("Fehler beim Erstellen der Notiz", err);
            alert("Fehler beim Erstellen der Notiz.");
        }
    };

    // --- Download Logic ---
    const handleDownload = async (docId: number, fileName: string) => {
        try {
            const downloadUrl = `akten/${akteId}/dokumente/${docId}/download/`;
            const response = await api.get(downloadUrl, { responseType: 'blob' });

            let mimeType = response.headers['content-type'];
            const ext = fileName.split('.').pop()?.toLowerCase();
            if (ext === 'docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            else if (ext === 'doc') mimeType = 'application/msword';

            const file = new Blob([response.data], { type: mimeType });
            const fileURL = URL.createObjectURL(file);

            if (mimeType === 'application/pdf' || mimeType?.startsWith('image/')) {
                window.open(fileURL, '_blank');
            } else {
                const link = document.createElement('a');
                link.href = fileURL;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
            setTimeout(() => URL.revokeObjectURL(fileURL), 1000);
        } catch (err) {
            console.error("Fehler beim Download", err);
            alert("Fehler beim Herunterladen.");
        }
    };

    // --- Delete Logic ---
    const handleDelete = async (id: number, type: 'dokument' | 'notiz') => {
        if (!window.confirm("Sind Sie sicher?")) return; // Simple confirm for now, can be upgraded
        try {
            const endpoint = type === 'dokument' ? `dokumente/${id}/` : `organizer/notizen/${id}/`;
            await api.delete(endpoint);
            setItems(prev => prev.filter(i => !(i.id === id && i.type === type)));
        } catch (err) {
            console.error("Fehler beim Löschen", err);
            alert("Fehler beim Löschen.");
        }
    };

    // --- Edit Logic ---
    const startEditing = (item: VerlaufItem) => {
        setEditingId(item.id);
        setEditingType(item.type);
        setEditTitel(item.titel);
        if (item.type === 'notiz') {
            setEditInhalt(item.inhalt || "");
        } else {
            setEditDatum(item.datum || "");
        }
    };

    const saveEditing = async () => {
        if (!editingId || !editingType) return;
        try {
            if (editingType === 'dokument') {
                await api.patch(`dokumente/${editingId}/`, { titel: editTitel, datum: editDatum });
            } else {
                await api.put(`organizer/notizen/${editingId}/`, {
                    akte: akteId,
                    titel: editTitel,
                    inhalt: editInhalt
                });
            }
            setEditingId(null);
            setEditingType(null);
            fetchItems();
        } catch (err) {
            console.error("Fehler beim Speichern", err);
            alert("Fehler beim Speichern.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Action Bar: Upload & New Note */}
            <div className="flex flex-col gap-4">
                {/* Upload Area Split */}
                <div className="flex flex-col md:flex-row gap-4 h-32">
                    {/* Drag & Drop Zone */}
                    <div
                        className={`flex-1 border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center transition-colors cursor-pointer ${dragActive ? "border-primary bg-primary/5" : "border-slate-300 hover:border-primary/50"}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <p className="text-sm text-slate-600 font-medium text-center">
                            {uploading ? "Wird hochgeladen..." : "Dateien hierher ziehen (Drag & Drop)"}
                        </p>
                    </div>

                    {/* Button Zone */}
                    <div className="flex-1 border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center justify-center p-4">
                        <p className="text-xs text-slate-500 mb-2">Oder klassisch auswählen</p>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="btn btn-primary btn-sm"
                            disabled={uploading}
                        >
                            Datei hochladen
                        </button>
                        <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} disabled={uploading} />
                    </div>
                </div>

                {/* New Note Toggle */}
                {!showNoteForm ? (
                    <button
                        onClick={() => setShowNoteForm(true)}
                        className="btn btn-secondary w-full text-sm"
                    >
                        + Neue Notiz erstellen
                    </button>
                ) : (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <h4 className="text-sm font-bold text-yellow-800 mb-2">Neue Notiz</h4>
                        <input
                            type="text"
                            className="input w-full mb-2 bg-white"
                            placeholder="Titel"
                            value={newNoteTitle}
                            onChange={e => setNewNoteTitle(e.target.value)}
                        />
                        <textarea
                            className="input w-full min-h-[80px] mb-2 bg-white"
                            placeholder="Inhalt..."
                            value={newNoteContent}
                            onChange={e => setNewNoteContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowNoteForm(false)} className="btn btn-ghost btn-sm">Abbrechen</button>
                            <button onClick={handleAddNote} className="btn btn-primary btn-sm">Speichern</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Stream List */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Verlauf</h3>
                    <select
                        className="select select-sm select-bordered text-xs"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                    >
                        <option value="newest">Neueste zuerst</option>
                        <option value="oldest">Älteste zuerst</option>
                    </select>
                </div>

                {sortedItems.length === 0 && !loading && (
                    <p className="text-slate-500 text-center py-4">Noch keine Einträge.</p>
                )}

                {sortedItems.map(item => (
                    <div key={`${item.type}-${item.id}`} className={`p-4 rounded-lg border ${item.type === 'notiz' ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-slate-200'} shadow-sm hover:shadow-md transition-shadow`}>
                        {editingId === item.id && editingType === item.type ? (
                            // Edit Mode
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    className="input w-full"
                                    value={editTitel}
                                    onChange={e => setEditTitel(e.target.value)}
                                />
                                {item.type === 'notiz' ? (
                                    <textarea
                                        className="input w-full min-h-[80px]"
                                        value={editInhalt}
                                        onChange={e => setEditInhalt(e.target.value)}
                                    />
                                ) : (
                                    <input
                                        type="date"
                                        className="input w-full"
                                        value={editDatum}
                                        onChange={e => setEditDatum(e.target.value)}
                                    />
                                )}
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setEditingId(null)} className="text-sm text-slate-500">Abbrechen</button>
                                    <button onClick={saveEditing} className="text-sm text-emerald-600 font-bold">Speichern</button>
                                </div>
                            </div>
                        ) : (
                            // View Mode
                            <div>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        {item.type === 'dokument' ? (
                                            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-bold">DOKUMENT</span>
                                        ) : (
                                            <span className="bg-yellow-200 text-yellow-800 text-xs px-2 py-0.5 rounded font-bold">NOTIZ</span>
                                        )}
                                        <span className="text-xs text-slate-400">
                                            {new Date(item.erstellt_am).toLocaleString('de-DE')}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => startEditing(item)} className="text-slate-400 hover:text-primary">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                        <button onClick={() => handleDelete(item.id, item.type)} className="text-slate-400 hover:text-red-600">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <h4 className="font-bold text-slate-900 mb-1">{item.titel}</h4>

                                {item.type === 'notiz' && (
                                    <p className="text-slate-700 text-sm whitespace-pre-wrap">{item.inhalt}</p>
                                )}

                                {item.type === 'dokument' && (
                                    <div className="flex items-center gap-2 mt-2">
                                        <button
                                            onClick={() => handleDownload(item.id, item.dateiname || item.titel)}
                                            className="text-sm text-primary hover:underline flex items-center gap-1"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            {item.dateiname}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VerlaufSection;
