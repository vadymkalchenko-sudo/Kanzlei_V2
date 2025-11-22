import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

interface Akte {
    id: number;
    aktenzeichen: string;
    mandant: { name: string };
    gegner: { name: string };
    status: string;
    erstellt_am: string;
}

const AktenList = () => {
    const [akten, setAkten] = useState<Akte[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [akteToDelete, setAkteToDelete] = useState<number | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAkten = async () => {
            try {
                const response = await api.get('akten/');
                setAkten(response.data);
            } catch (error) {
                console.error('Fehler beim Laden der Akten:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAkten();
    }, []);

    const handleDelete = (id: number) => {
        setAkteToDelete(id);
        setDeleteError(null);
        setShowDeleteModal(true);
    };
    const confirmDelete = async () => {
        if (akteToDelete === null) return;
        try {
            await api.delete(`akten/${akteToDelete}/`);
            setAkten(akten.filter(akte => akte.id !== akteToDelete));
            setShowDeleteModal(false);
            setAkteToDelete(null);
        } catch (error) {
            console.error('Fehler beim Löschen der Akte:', error);
            setDeleteError('Fehler beim Löschen der Akte.');
        }
    };

    const filteredAkten = akten.filter(akte =>
        akte.aktenzeichen.toLowerCase().includes(searchQuery.toLowerCase()) ||
        akte.mandant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        akte.gegner?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );



    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'offen':
            case 'in bearbeitung':
                return 'badge-success';
            case 'warten':
                return 'badge-warning';
            case 'geschlossen':
            case 'abgeschlossen':
                return 'badge-neutral';
            default:
                return 'badge-neutral';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-slate-900">Aktenübersicht</h2>
                <Link to="/akten/neu" className="btn btn-accent">
                    <PlusIcon />
                    Neue Akte anlegen
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Suchen nach Aktenzeichen, Mandant, Gegner..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Aktenzeichen</th>
                                <th>Mandant</th>
                                <th>Gegner</th>
                                <th>Status</th>
                                <th>Anlagedatum</th>
                                <th className="text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-500">
                                        Lade Akten...
                                    </td>
                                </tr>
                            ) : filteredAkten.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-slate-500">
                                        Keine Akten gefunden
                                    </td>
                                </tr>
                            ) : (
                                filteredAkten.map((akte) => (
                                    <tr key={akte.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="font-mono font-medium text-slate-700">
                                            {akte.aktenzeichen}
                                        </td>
                                        <td className="font-medium text-slate-900">
                                            {akte.mandant?.name || '-'}
                                        </td>
                                        <td className="text-slate-600">
                                            {akte.gegner?.name || '-'}
                                        </td>
                                        <td>
                                            <span className={`badge ${getStatusBadgeClass(akte.status)}`}>
                                                {akte.status}
                                            </span>
                                        </td>
                                        <td className="text-slate-500">
                                            {new Date(akte.erstellt_am).toLocaleDateString('de-DE')}
                                        </td>
                                        <td className="text-right space-x-2">
                                            <Link
                                                to={`/akte/${akte.id}`}
                                                className="text-primary hover:text-primary-dark font-semibold text-sm"
                                            >
                                                Bearbeiten
                                            </Link>
                                            <button
                                                onClick={() => { console.log('Delete button clicked for Akte', akte.id); handleDelete(akte.id); }}
                                                className="text-red-500 hover:text-red-700 font-semibold text-sm"
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

            {/* Delete Confirmation Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-xl font-bold text-slate-900 mb-4">Akte löschen?</h3>
                            {deleteError ? (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                    {deleteError}
                                </div>
                            ) : (
                                <p className="text-slate-600 mb-6">Möchten Sie diese Akte wirklich unwiderruflich löschen?</p>
                            )}
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setAkteToDelete(null);
                                        setDeleteError(null);
                                    }}
                                    className="btn btn-secondary"
                                >
                                    {deleteError ? 'Schließen' : 'Abbrechen'}
                                </button>
                                {!deleteError && (
                                    <button
                                        onClick={confirmDelete}
                                        className="btn bg-red-600 text-white hover:bg-red-700"
                                    >
                                        Löschen
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

const PlusIcon = () => (
    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

export default AktenList;
