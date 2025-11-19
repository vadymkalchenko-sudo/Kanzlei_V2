import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AkteForm: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    mandant: {
      name: '',
      adresse: '',
      telefon: '',
      email: '',
      typ: 'Person'
    },
    gegner: {
      name: '',
      adresse: '',
      telefon: '',
      email: '',
      typ: 'Person'
    },
    aktenzeichen: '',
    status: 'Offen'
  });

  const handleMandantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      mandant: { ...prev.mandant, [name]: value }
    }));
  };

  const handleGegnerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      gegner: { ...prev.gegner, [name]: value }
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
      const API_BASE_URL: string =
        typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";

      const payload = {
        ...formData,
        aktenzeichen: formData.aktenzeichen || `AZ-${Date.now()}`
      };

      await axios.post(`${API_BASE_URL}akten/`, payload);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data) {
        if (err.response.data.konflikt) {
          setError(`Konflikt: ${err.response.data.konflikt}`);
        } else {
          setError(JSON.stringify(err.response.data));
        }
      } else {
        setError('Fehler beim Anlegen der Akte');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Neue Akte anlegen</h1>
        <p className="text-slate-600">Erfassen Sie die Stammdaten für ein neues Mandat</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Mandant & Gegner Section - Horizontal Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-slate-200">

            {/* Mandant Section */}
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <UserIcon />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Mandant</h2>
                  <p className="text-sm text-slate-500">Auftraggeber / Klient</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Typ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="typ"
                    value={formData.mandant.typ}
                    onChange={handleMandantChange}
                    className="input"
                    required
                  >
                    <option value="Person">Natürliche Person</option>
                    <option value="Unternehmen">Unternehmen</option>
                    <option value="Versicherung">Versicherung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Name / Firma <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.mandant.name}
                    onChange={handleMandantChange}
                    className="input"
                    required
                    placeholder="z.B. Max Mustermann"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.mandant.adresse}
                    onChange={handleMandantChange}
                    className="input"
                    placeholder="Straße, PLZ, Ort"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="telefon"
                      value={formData.mandant.telefon}
                      onChange={handleMandantChange}
                      className="input"
                      placeholder="+49 123 456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.mandant.email}
                      onChange={handleMandantChange}
                      className="input"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Gegner Section */}
            <div className="p-8 bg-slate-50/50">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <ShieldIcon />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Gegner</h2>
                  <p className="text-sm text-slate-500">Gegenpartei</p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Typ <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="typ"
                    value={formData.gegner.typ}
                    onChange={handleGegnerChange}
                    className="input bg-white"
                    required
                  >
                    <option value="Person">Natürliche Person</option>
                    <option value="Unternehmen">Unternehmen</option>
                    <option value="Versicherung">Versicherung</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Name / Firma <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.gegner.name}
                    onChange={handleGegnerChange}
                    className="input bg-white"
                    required
                    placeholder="z.B. Gegner GmbH"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    name="adresse"
                    value={formData.gegner.adresse}
                    onChange={handleGegnerChange}
                    className="input bg-white"
                    placeholder="Straße, PLZ, Ort"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Telefon
                    </label>
                    <input
                      type="tel"
                      name="telefon"
                      value={formData.gegner.telefon}
                      onChange={handleGegnerChange}
                      className="input bg-white"
                      placeholder="+49 987 654321"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      E-Mail
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.gegner.email}
                      onChange={handleGegnerChange}
                      className="input bg-white"
                      placeholder="email@gegner.de"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Akteninformationen Section */}
          <div className="border-t border-slate-200 p-8 bg-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                <FolderIcon />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Akteninformationen</h2>
                <p className="text-sm text-slate-500">Aktenzeichen und Status</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Aktenzeichen
                </label>
                <input
                  type="text"
                  value={formData.aktenzeichen}
                  onChange={(e) => setFormData({ ...formData, aktenzeichen: e.target.value })}
                  className="input"
                  placeholder="Wird automatisch generiert"
                />
                <p className="text-xs text-slate-500 mt-1">Leer lassen für automatische Vergabe</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                  required
                >
                  <option value="Offen">Offen</option>
                  <option value="In Bearbeitung">In Bearbeitung</option>
                  <option value="Abgeschlossen">Abgeschlossen</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t border-slate-200 px-8 py-6 bg-slate-50 flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="btn btn-secondary"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-accent px-8"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Wird angelegt...
                </span>
              ) : (
                'Akte anlegen'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

const UserIcon = () => (
  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const FolderIcon = () => (
  <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

export default AkteForm;
