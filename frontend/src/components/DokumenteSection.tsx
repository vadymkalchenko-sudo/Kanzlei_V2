import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';

interface Dokument {
    id: number;
    titel: string;
    dateiname: string;
    erstellt_am: string;
    datum: string; // New field
    pfad_auf_server: string;
}

const DokumenteSection = ({ akteId }: { akteId: string | number }) => {
    const [dokumente, setDokumente] = useState<Dokument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editTitel, setEditTitel] = useState("");
    const [editDatum, setEditDatum] = useState("");

    const [error, setError] = useState<string | null>(null);

    const fetchDokumente = async () => {
        try {
            setError(null);
            console.log(`Fetching documents for Akte ${akteId}`);
            const response = await api.get(`akten/${akteId}/`);
            console.log("Akte response:", response.data);
            if (response.data.dokumente) {
                console.log("Documents found:", response.data.dokumente);
                setDokumente(response.data.dokumente);
            } else {
                console.warn("No 'dokumente' field in response");
                setError("Keine Dokumente im Antwort-Objekt gefunden.");
            }
        } catch (err: any) {
            console.error("Fehler beim Laden der Dokumente", err);
            setError(`Fehler: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (akteId) {
            fetchDokumente();
        } else {
            console.warn("No akteId provided to DokumenteSection");
        }
    }, [akteId]);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            await handleUpload(event.target.files[0]);
        }
    };

    // Drag & Drop Handlers
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
            await api.post(`akten/${akteId}/dokumente/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            fetchDokumente();
        } catch (err) {
            console.error("Fehler beim Upload", err);
            alert("Fehler beim Upload der Datei.");
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = async (docId: number, fileName: string) => {
        try {
            // Use window.open for direct browser handling (opens PDF in new tab, downloads others)
            const downloadUrl = `akten/${akteId}/dokumente/${docId}/download/`;

            // Check if we have a token to append or if we need to use fetch to get blob
            // Since window.open can't easily send headers, we might need a different approach if auth is strict.
            // However, for "direct open", usually a signed URL or cookie auth is best.
            // Given current setup uses Bearer token in header, window.open won't send auth.
            // We stick to the blob method but trigger it differently to "open" it.

            const response = await api.get(downloadUrl, {
                responseType: 'blob',
            });

            const file = new Blob([response.data], { type: response.headers['content-type'] });
            const fileURL = URL.createObjectURL(file);

            // Open in new tab if possible (PDF, images), otherwise download
            const type = response.headers['content-type'];
            if (type === 'application/pdf' || type.startsWith('image/')) {
                window.open(fileURL, '_blank');
            } else {
                const link = document.createElement('a');
                link.href = fileURL;
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        } catch (err) {
            console.error("Fehler beim Download", err);
            alert("Fehler beim Herunterladen der Datei.");
        }
    };

    const startEditing = (doc: Dokument) => {
        setEditingId(doc.id);
        setEditTitel(doc.titel);
        setEditDatum(doc.datum || new Date().toISOString().split('T')[0]);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditTitel("");
        setEditDatum("");
    };

    const saveEditing = async (docId: number) => {
        try {
            await api.patch(`dokumente/${docId}/`, {
                titel: editTitel,
                datum: editDatum
            });
            setEditingId(null);
            fetchDokumente();
        } catch (err) {
            console.error("Fehler beim Speichern", err);
            alert("Fehler beim Speichern der Änderungen.");
        }
    };

    const handleDelete = async (docId: number) => {
        if (!window.confirm("Möchten Sie dieses Dokument wirklich löschen?")) {
            return;
        }
        try {
            await api.delete(`dokumente/${docId}/`);
            fetchDokumente();
        } catch (err) {
            console.error("Fehler beim Löschen", err);
            alert("Fehler beim Löschen des Dokuments.");
        }
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Fehler!</strong>
                    <span className="block sm:inline"> {error}</span>
                </div>
            )}
            {/* Upload Area with Drag & Drop */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-grow">
                    <h4 className="text-sm font-bold text-slate-900 mb-1">Neues Dokument hochladen</h4>
                    <p className="text-xs text-slate-500">Wählen Sie eine Datei von Ihrem Computer aus.</p>
                </div>

                {/* Drag & Drop Zone */}
                <div
                    className={`flex-grow mx-4 border-2 border-dashed rounded-lg p-4 flex items-center justify-center transition-colors ${dragActive ? "border-primary bg-primary/10" : "border-slate-300 bg-white"
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <p className="text-sm text-slate-500 pointer-events-none">
                        {dragActive ? "Datei hier ablegen" : "Dateien hierher ziehen (Drag & Drop)"}
                    </p>
                </div>

                <div className="flex gap-2">
                    <input
                        type="file"
                        className="hidden"
                        id="file-upload"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        disabled={uploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`btn btn-primary cursor-pointer whitespace-nowrap ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {uploading ? 'Wird hochgeladen...' : 'Datei auswählen & Hochladen'}
                    </label>
                </div>
            </div>

            {/* Documents List (Table) */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="w-2/5">Name</th>
                            <th className="w-1/6">Datum</th>
                            <th className="w-1/3 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dokumente.length > 0 ? (
                            dokumente.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="font-medium">
                                        {editingId === doc.id ? (
                                            <input
                                                type="text"
                                                value={editTitel}
                                                onChange={(e) => setEditTitel(e.target.value)}
                                                className="input input-sm w-full"
                                            />
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <FileIcon />
                                                {doc.titel || doc.dateiname}
                                            </div>
                                        )}
                                    </td>
                                    <td className="text-slate-500 text-sm">
                                        {editingId === doc.id ? (
                                            <input
                                                type="date"
                                                value={editDatum}
                                                onChange={(e) => setEditDatum(e.target.value)}
                                                className="input input-sm w-full"
                                            />
                                        ) : (
                                            doc.datum ? new Date(doc.datum).toLocaleDateString('de-DE') :
                                                new Date(doc.erstellt_am).toLocaleDateString('de-DE')
                                        )}
                                    </td>
                                    <td className="text-right space-x-2">
                                        {editingId === doc.id ? (
                                            <>
                                                <button onClick={() => saveEditing(doc.id)} className="text-sm text-emerald-600 hover:underline font-medium">Speichern</button>
                                                <button onClick={cancelEditing} className="text-sm text-slate-500 hover:underline font-medium">Abbrechen</button>
                                            </>
                                        ) : (
                                            <>
                                                <button onClick={() => startEditing(doc)} className="text-sm text-slate-600 hover:underline font-medium">Bearbeiten</button>
                                                <button
                                                    onClick={() => handleDownload(doc.id, doc.dateiname)}
                                                    className="text-sm text-primary hover:underline font-medium"
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(doc.id)}
                                                    className="text-sm text-red-600 hover:underline font-medium"
                                                >
                                                    Löschen
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-slate-500 italic">
                                    Keine Dokumente vorhanden.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const FileIcon = () => (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

export default DokumenteSection;
