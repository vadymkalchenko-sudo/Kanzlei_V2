import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Settings = () => {
    const ADMIN_URL = "http://localhost:8000/admin/";
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        navigate('/login');
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
