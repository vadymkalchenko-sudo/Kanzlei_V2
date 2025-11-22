import React, { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const AkteForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for IDs (what we send to backend)
  const [mandantId, setMandantId] = useState<number | null>(null);
  const [gegnerId, setGegnerId] = useState<number | null>(null);

  // Form Data State
  const [formData, setFormData] = useState({
    aktenzeichen: '',
    titel: '',
    beschreibung: '',
    status: 'Offen',
    mandant: {
      ansprache: 'Herr',
      vorname: '',
      nachname: '',
      strasse: '',
      hausnummer: '',
      plz: '',
      stadt: '',
      land: 'Deutschland',
      telefon: '',
      email: '',
      typ: 'Person'
    },
    gegner: {
      name: '',
      strasse: '',
      hausnummer: '',
      plz: '',
      stadt: '',
      land: 'Deutschland',
      telefon: '',
      email: '',
      typ: 'Versicherung'
    },
    drittbeteiligte: [] as any[]
  });

  // Load selected Mandant/Gegner IDs from localStorage and fetch their data
  useEffect(() => {
    const selectedMandantId = localStorage.getItem('selectedMandantId');
    const selectedGegnerId = localStorage.getItem('selectedGegnerId');

    if (selectedMandantId) {
      const id = parseInt(selectedMandantId);
      setMandantId(id);
      fetchMandantData(id);
    }

    if (selectedGegnerId) {
      const id = parseInt(selectedGegnerId);
      setGegnerId(id);
      fetchGegnerData(id);
    }
  }, []);

  const fetchMandantData = async (id: number) => {
    try {
      const response = await api.get(`mandanten/${id}/`);
      setFormData(prev => ({
        ...prev,
        mandant: {
          ansprache: response.data.ansprache || 'Herr',
          vorname: response.data.vorname || '',
          nachname: response.data.nachname || '',
          strasse: response.data.strasse || '',
          hausnummer: response.data.hausnummer || '',
          plz: response.data.plz || '',
          stadt: response.data.stadt || '',
          land: response.data.land || 'Deutschland',
          telefon: response.data.telefon || '',
          email: response.data.email || '',
          typ: response.data.typ || 'Person'
        }
      }));
    } catch (err) {
      console.error('Error fetching Mandant data:', err);
    }
  };

  const fetchGegnerData = async (id: number) => {
    try {
      const response = await api.get(`gegner/${id}/`);
      setFormData(prev => ({
        ...prev,
        gegner: {
          name: response.data.name || '',
          strasse: response.data.strasse || '',
          hausnummer: response.data.hausnummer || '',
          plz: response.data.plz || '',
          stadt: response.data.stadt || '',
          land: response.data.land || 'Deutschland',
          telefon: response.data.telefon || '',
          email: response.data.email || '',
          typ: response.data.typ || 'Versicherung'
        }
      }));
    } catch (err) {
      console.error('Error fetching Gegner data:', err);
    }
  };

  const handleMandantChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setMandantId(null); // Clear ID on manual change
    setFormData(prev => ({
      ...prev,
      mandant: { ...prev.mandant, [name]: value }
    }));
  };

  const handleGegnerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setGegnerId(null); // Clear ID on manual change
    setFormData(prev => ({
      ...prev,
      gegner: { ...prev.gegner, [name]: value }
    }));
  };

  const handleSelectFromStammdaten = (type: 'mandant' | 'gegner') => {
    // Save current form state to localStorage to restore it later if needed
    // For now, we just navigate to Stammdaten with returnTo param
    const returnUrl = window.location.pathname;
    window.location.href = `/stammdaten?tab=${type}&returnTo=${encodeURIComponent(returnUrl)}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!formData.mandant.vorname && !formData.mandant.nachname) {
      setError('Bitte geben Sie einen Namen für den Mandanten an.');
      setLoading(false);
      return;
    }

    try {
      let finalMandantId = mandantId;
      let finalGegnerId = gegnerId;

      // 1. Handle Mandant (Create if no ID)
      if (!finalMandantId) {
        const mandantResponse = await api.post(`mandanten/`, formData.mandant);
        finalMandantId = mandantResponse.data.id;
      }

      // 2. Handle Gegner (Create if no ID)
      if (!finalGegnerId && formData.gegner.name) {
        // First check if a Gegner with this name already exists
        try {
          const searchName = formData.gegner.name.trim();
          const searchRes = await api.get(`gegner/search/?q=${encodeURIComponent(searchName)}`);

          // Find exact match (case-insensitive)
          const existingGegner = searchRes.data.find((g: any) =>
            g.name.trim().toLowerCase() === searchName.toLowerCase()
          );

          if (existingGegner) {
            console.log("Found existing Gegner:", existingGegner);
            finalGegnerId = existingGegner.id;
          } else {
            console.log("Creating new Gegner:", formData.gegner);
            const gegnerResponse = await api.post(`gegner/`, formData.gegner);
            finalGegnerId = gegnerResponse.data.id;
          }
        } catch (err) {
          // If search fails, proceed with creation attempt or handle error
          console.error("Error searching for existing Gegner:", err);
          const gegnerResponse = await api.post(`gegner/`, formData.gegner);
          finalGegnerId = gegnerResponse.data.id;
        }
      }

      const payload = {
        mandant_id: finalMandantId,
        gegner_id: finalGegnerId,
        aktenzeichen: formData.aktenzeichen || `AZ-${Date.now()}`,
        status: formData.status,
      };

      await api.post(`akten/`, payload);

      // SUCCESS: Reset Form and LocalStorage
      localStorage.removeItem('selectedMandantId');
      localStorage.removeItem('selectedGegnerId');

      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data) {
        if (err.response.data.konflikt) {
          setError(`Konflikt: ${err.response.data.konflikt}`);
        } else {
          setError(`Fehler: ${JSON.stringify(err.response.data)}`);
        }
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten.');
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
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <UserIcon />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Mandant</h2>
                    <p className="text-sm text-slate-500">Auftraggeber / Klient</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/stammdaten?tab=mandant&returnTo=/akten/neu')}
                  className="btn btn-secondary text-sm"
                >
                  Stammdaten
                </button>
              </div>

              <div className="space-y-5">
                {/* Ansprache */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Ansprache <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-4">
                    {['Herr', 'Frau', 'Firma'].map((option) => (
                      <label key={option} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="ansprache"
                          value={option}
                          checked={formData.mandant.ansprache === option}
                          onChange={handleMandantChange}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {formData.mandant.ansprache === 'Firma' ? 'Firmenname' : 'Vorname'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="vorname"
                      value={formData.mandant.vorname}
                      onChange={handleMandantChange}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      {formData.mandant.ansprache === 'Firma' ? 'Ansprechpartner' : 'Nachname'} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nachname"
                      value={formData.mandant.nachname}
                      onChange={handleMandantChange}
                      className="input"
                      required
                    />
                  </div>
                </div>

                {/* Address Fields */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Straße</label>
                    <input
                      type="text"
                      name="strasse"
                      value={formData.mandant.strasse}
                      onChange={handleMandantChange}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nr.</label>
                    <input
                      type="text"
                      name="hausnummer"
                      value={formData.mandant.hausnummer}
                      onChange={handleMandantChange}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">PLZ</label>
                    <input
                      type="text"
                      name="plz"
                      value={formData.mandant.plz}
                      onChange={handleMandantChange}
                      className="input"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Stadt</label>
                    <input
                      type="text"
                      name="stadt"
                      value={formData.mandant.stadt}
                      onChange={handleMandantChange}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Land</label>
                  <input
                    type="text"
                    name="land"
                    value={formData.mandant.land}
                    onChange={handleMandantChange}
                    className="input"
                  />
                </div>

                {/* Contact Fields */}
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
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <ShieldIcon />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Gegner</h2>
                    <p className="text-sm text-slate-500">Gegenpartei</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/stammdaten?tab=gegner&returnTo=/akten/neu')}
                  className="btn btn-secondary text-sm"
                >
                  Stammdaten
                </button>
              </div>

              <div className="space-y-5">
                {/* New Gegner fields */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-slate-900">Gegner (Versicherung)</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name / Versicherung</label>
                      <input
                        type="text"
                        value={formData.gegner.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          gegner: { ...formData.gegner, name: e.target.value }
                        })}
                        className="input"
                        placeholder="Name der Versicherung"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Straße</label>
                        <input
                          type="text"
                          value={formData.gegner.strasse || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            gegner: { ...formData.gegner, strasse: e.target.value }
                          })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nr.</label>
                        <input
                          type="text"
                          value={formData.gegner.hausnummer || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            gegner: { ...formData.gegner, hausnummer: e.target.value }
                          })}
                          className="input"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">PLZ</label>
                        <input
                          type="text"
                          value={formData.gegner.plz || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            gegner: { ...formData.gegner, plz: e.target.value }
                          })}
                          className="input"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Stadt</label>
                        <input
                          type="text"
                          value={formData.gegner.stadt || ''}
                          onChange={(e) => setFormData({
                            ...formData,
                            gegner: { ...formData.gegner, stadt: e.target.value }
                          })}
                          className="input"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Land</label>
                      <input
                        type="text"
                        value={formData.gegner.land || 'Deutschland'}
                        onChange={(e) => setFormData({
                          ...formData,
                          gegner: { ...formData.gegner, land: e.target.value }
                        })}
                        className="input"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefon</label>
                        <input
                          type="text"
                          value={formData.gegner.telefon}
                          onChange={(e) => setFormData({
                            ...formData,
                            gegner: { ...formData.gegner, telefon: e.target.value }
                          })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.gegner.email}
                          onChange={(e) => setFormData({
                            ...formData,
                            gegner: { ...formData.gegner, email: e.target.value }
                          })}
                          className="input"
                        />
                      </div>
                    </div>
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
