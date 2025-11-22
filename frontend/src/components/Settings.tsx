import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

const Settings = () => {
    const ADMIN_URL = "http://localhost:8000/admin/";
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleExport = async () => {
        setLoading(true);
        setMessage(null);
        try {
            const response = await api.get('backup/export_db/', {
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `kanzlei_backup_${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);

            setMessage({ type: 'success', text: 'Backup erfolgreich heruntergeladen.' });
        } catch (error) {
            console.error('Export failed:', error);
            setMessage({ type: 'error', text: 'Fehler beim Exportieren der Datenbank.' });
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!window.confirm('WARNUNG: Dies wird die aktuelle Datenbank mit dem Backup überschreiben. Fortfahren?')) {
            event.target.value = ''; // Reset input
            return;
        }

        setLoading(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.post('backup/import_db/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setMessage({ type: 'success', text: 'Datenbank erfolgreich wiederhergestellt.' });
            // Optional: Reload page to reflect changes
            setTimeout(() => window.location.reload(), 2000);
        } catch (error) {
            console.error('Import failed:', error);
            setMessage({ type: 'error', text: 'Fehler beim Importieren der Datenbank.' });
        } finally {
            setLoading(false);
            event.target.value = ''; // Reset input
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-secondary">Einstellungen</h2>
                <Link to="/dashboard" className="btn btn-secondary">
                    ← Zurück zum Dashboard
                </Link>
            </div>

            <div className="grid gap-6">
                <div className="card">
                    <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                        <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                            <ShieldIcon />
                            Administration
                        </h3>
                    </div>

                    <div className="space-y-4">
                        <p className="text-text-muted text-sm">
                            Zugriff auf das Backend-Administrationspanel für Benutzerverwaltung, Datenbank-Inspektion und Systemkonfiguration.
                        </p>

                        <a
                            href={ADMIN_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary inline-flex items-center gap-2"
                        >
                            <ExternalLinkIcon />
                            Zum Admin-Dashboard öffnen
                        </a>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                        <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                            <DatabaseIcon />
                            Datenbankverwaltung
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <p className="text-text-muted text-sm">
                            Sichern Sie die gesamte Datenbank oder stellen Sie eine Sicherung wieder her.
                            <br />
                            <span className="text-red-500 font-bold">Warnung:</span> Beim Import werden vorhandene Daten überschrieben!
                        </p>

                        <div className="flex gap-4">
                            <button
                                onClick={handleExport}
                                disabled={loading}
                                className="btn btn-secondary flex items-center gap-2"
                            >
                                <DownloadIcon />
                                {loading ? 'Exportiere...' : 'Backup erstellen (Export)'}
                            </button>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    disabled={loading}
                                />
                                <button
                                    className="btn btn-outline-danger flex items-center gap-2"
                                    disabled={loading}
                                >
                                    <UploadIcon />
                                    {loading ? 'Importiere...' : 'Backup wiederherstellen (Import)'}
                                </button>
                            </div>
                        </div>
                        {message && (
                            <div className={`p-3 rounded text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-4 border-b border-border pb-3">
                        <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                            <UserIcon />
                            Benutzerprofil
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <p className="text-text-muted text-sm">
                            Sie sind aktuell angemeldet.
                        </p>
                        <button
                            onClick={handleLogout}
                            className="btn bg-red-50 text-red-600 hover:bg-red-100 border-red-200 flex items-center gap-2"
                        >
                            <LogOutIcon />
                            Abmelden
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Icons ---
const DatabaseIcon = () => (
    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
);

const DownloadIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const UploadIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
);


const ShieldIcon = () => (
    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const LogOutIcon = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

export default Settings;
