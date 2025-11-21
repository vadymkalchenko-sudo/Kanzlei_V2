import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.post('token/', {
                username,
                password
            });
            console.log("Login Success. Token:", response.data.access);

            login(response.data.access);
            navigate('/dashboard');
        } catch (err: any) {
            if (err.response) {
                if (err.response.status === 429) {
                    setError('Zu viele Anmeldeversuche. Bitte warten Sie einen Moment.');
                } else if (err.response.status === 401) {
                    setError('Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.');
                } else {
                    setError('Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.');
                }
            } else {
                setError('Verbindung zum Server fehlgeschlagen.');
            }
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Kanzlei Manager</h1>
                    <p className="text-slate-400">Professionelle Aktenverwaltung</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Anmelden</h2>

                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Benutzername</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="input"
                                required
                                autoFocus
                                placeholder="Ihr Benutzername"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Passwort</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input"
                                required
                                placeholder="Ihr Passwort"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full py-3 text-base font-semibold mt-6"
                        >
                            {loading ? 'Wird angemeldet...' : 'Anmelden'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-500">
                        &copy; {new Date().getFullYear()} Kanzlei Management System
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
