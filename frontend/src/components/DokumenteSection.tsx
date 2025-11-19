import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Dokument {
    id: number;
    name: string;
    typ: string;
    datum: string;
    groesse: string;
}

const DokumenteSection = ({ akteId }: { akteId: string | number }) => {
    const [dokumente, setDokumente] = useState<Dokument[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDokumente = async () => {
        // Mock data for now
        setDokumente([
            { id: 1, name: 'Klageentwurf.pdf', typ: 'PDF', datum: '2023-11-15', groesse: '2.4 MB' },
            { id: 2, name: 'Korrespondenz_Versicherung.docx', typ: 'Word', datum: '2023-11-10', groesse: '1.1 MB' },
            { id: 3, name: 'Beweisfoto_01.jpg', typ: 'Image', datum: '2023-11-05', groesse: '4.5 MB' },
        ]);
        setLoading(false);
    };

    useEffect(() => {
        fetchDokumente();
    }, [akteId]);

    const handleUpload = () => {
        alert("Upload Funktion (Simulation)");
    };

    return (
        <div className="space-y-6">
            {/* Upload Area */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex-grow">
                    <h4 className="text-sm font-bold text-primary mb-1">Neues Dokument hochladen</h4>
                    <p className="text-xs text-text-muted">Ziehen Sie Dateien hierher oder klicken Sie auf den Button.</p>
                </div>
                <div className="flex gap-2">
                    <input type="file" className="hidden" id="file-upload" />
                    <label htmlFor="file-upload" className="btn btn-secondary cursor-pointer">
                        Datei auswählen
                    </label>
                    <button onClick={handleUpload} className="btn btn-primary">
                        Hochladen
                    </button>
                </div>
            </div>

            {/* Documents List (Table) */}
            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr>
                            <th className="w-2/5">Name</th>
                            <th className="w-1/6">Typ</th>
                            <th className="w-1/6">Datum</th>
                            <th className="w-1/6">Größe</th>
                            <th className="w-1/6 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dokumente.length > 0 ? (
                            dokumente.map((doc) => (
                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <FileIcon />
                                            {doc.name}
                                        </div>
                                    </td>
                                    <td><span className="badge badge-neutral">{doc.typ}</span></td>
                                    <td className="text-text-muted text-sm">{new Date(doc.datum).toLocaleDateString('de-DE')}</td>
                                    <td className="text-text-muted text-sm">{doc.groesse}</td>
                                    <td className="text-right">
                                        <div className="flex justify-end gap-3">
                                            <button className="text-sm text-primary hover:underline font-medium">Download</button>
                                            <button className="text-sm text-red-600 hover:underline font-medium">Löschen</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="text-center py-8 text-text-muted italic">
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
    <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
);

export default DokumenteSection;
