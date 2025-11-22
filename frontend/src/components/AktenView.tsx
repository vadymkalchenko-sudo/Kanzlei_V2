import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import FinanzTabelle from './FinanzTabelle';
import VerlaufSection from './VerlaufSection';
import AufgabenFristenSection from './AufgabenFristenSection';
import DrittbeteiligteList from './DrittbeteiligteList';
import Fragebogen from './Fragebogen';
import { api } from '../services/api';

interface Mandant {
  id?: number;
  name: string;
  adresse: string;
  telefon: string;
  email: string;
  // Add raw fields if needed for other logic, but for display we construct strings
}

interface Gegner {
  id?: number;
  name: string;
  adresse: string;
  telefon: string;
  email: string;
  vertreter?: string;
}

interface Akte {
  id: string | number;
  az: string;
  betreff: string;
  status: string;
  anlagedatum: string;
  modus_operandi: string;
  mandant: Mandant;
  gegner: Gegner;
}

const AktenView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [akte, setAkte] = useState<Akte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs: 'akte', 'drittbeteiligte', 'fragebogen', 'finanzen'
  const [activeTab, setActiveTab] = useState<'akte' | 'drittbeteiligte' | 'fragebogen' | 'finanzen'>(
    (searchParams.get('tab') as any) || 'akte'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['akte', 'drittbeteiligte', 'fragebogen', 'finanzen'].includes(tab)) {
      setActiveTab(tab as any);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'akte' | 'drittbeteiligte' | 'fragebogen' | 'finanzen') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Modus Operandi State
  const [modusOperandi, setModusOperandi] = useState("");

  useEffect(() => {
    const fetchAkte = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const response = await api.get(`akten/${id}/`);
        const data = response.data;

        // Helper to construct Mandant Name
        const getMandantName = (m: any) => {
          if (!m) return 'Unbekannt';
          if (m.ansprache === 'Firma') return m.vorname || 'Unbenannte Firma';
          return `${m.vorname} ${m.nachname}`.trim() || 'Unbenannter Mandant';
        };

        // Helper to construct Address
        const getAddress = (obj: any) => {
          if (!obj) return '';
          const parts = [
            `${obj.strasse || ''} ${obj.hausnummer || ''}`.trim(),
            `${obj.plz || ''} ${obj.stadt || ''}`.trim()
          ].filter(part => part !== '');
          return parts.join(', ');
        };

        const mandantName = getMandantName(data.mandant);
        const gegnerName = data.gegner?.name || 'Unbekannt';

        const mappedAkte: Akte = {
          id: data.id,
          az: data.aktenzeichen,
          betreff: `${mandantName} ./. ${gegnerName}`,
          status: data.status,
          anlagedatum: new Date(data.erstellt_am).toLocaleDateString('de-DE'),
          modus_operandi: data.modus_operandi || "",
          mandant: {
            id: data.mandant?.id,
            name: mandantName,
            adresse: getAddress(data.mandant),
            telefon: data.mandant?.telefon || '',
            email: data.mandant?.email || ''
          },
          gegner: {
            id: data.gegner?.id,
            name: gegnerName,
            adresse: getAddress(data.gegner),
            telefon: data.gegner?.telefon || '',
            email: data.gegner?.email || '',
            vertreter: ''
          }
        };

        setAkte(mappedAkte);
        setModusOperandi(mappedAkte.modus_operandi);
        setError(null);
      } catch (err) {
        console.error("Fehler beim Laden der Akte:", err);
        setError("Akte konnte nicht geladen werden.");
      } finally {
        setLoading(false);
      }
    };

    fetchAkte();
  }, [id]);

  const handleCloseAkte = async () => {
    setIsClosing(true);
    try {
      await api.post(`akten/${id}/schliessen/`);
      window.location.reload();
    } catch (err) {
      console.error("Fehler beim Schließen der Akte", err);
      alert("Fehler beim Schließen der Akte.");
      setIsClosing(false);
      setShowCloseModal(false);
    }
  };

  const saveModusOperandi = async () => {
    if (!id) return;
    try {
      await api.patch(`akten/${id}/`, { modus_operandi: modusOperandi });
      console.log("Modus Operandi gespeichert");
    } catch (err) {
      console.error("Fehler beim Speichern Modus Operandi", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !akte) {
    return <div className="text-center p-8 text-red-500">{error || "Akte nicht gefunden."}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Close Confirmation Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Akte schließen</h3>
            <p className="text-slate-600 mb-6">
              Möchten Sie diese Akte wirklich schließen? Alle Daten werden eingefroren und als JSON exportiert.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCloseModal(false)}
                className="btn btn-secondary"
                disabled={isClosing}
              >
                Abbrechen
              </button>
              <button
                onClick={handleCloseAkte}
                className="btn btn-accent"
                disabled={isClosing}
              >
                {isClosing ? 'Wird geschlossen...' : 'Schließen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-slate-900">{akte.betreff}</h2>
            <span className="badge badge-success text-sm">{akte.status}</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4 text-slate-600">
            <div>
              <span className="font-semibold">Aktenzeichen:</span> <span className="font-mono text-primary font-semibold">{akte.az}</span>
            </div>

            {/* Modus Operandi Input */}
            <div className="flex items-center gap-2 flex-grow max-w-xl">
              <span className="font-semibold whitespace-nowrap">Modus Operandi:</span>
              <input
                type="text"
                className="input input-sm w-full border-transparent hover:border-slate-300 focus:border-primary bg-transparent focus:bg-white transition-all"
                placeholder="Freieingabe..."
                value={modusOperandi}
                onChange={(e) => setModusOperandi(e.target.value)}
                onBlur={saveModusOperandi}
                onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            ← Zurück
          </button>
          <button
            onClick={() => setShowCloseModal(true)}
            className="btn btn-accent"
            disabled={akte.status.toLowerCase() === 'geschlossen'}
          >
            Akte schließen
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border overflow-x-auto">
        <nav className="-mb-px flex space-x-8 min-w-max">
          <button
            onClick={() => handleTabChange('akte')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'akte'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-secondary hover:border-gray-300'
              }`}
          >
            Akte & Details
          </button>
          <button
            onClick={() => handleTabChange('drittbeteiligte')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'drittbeteiligte'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-secondary hover:border-gray-300'
              }`}
          >
            Drittbeteiligte
          </button>
          <button
            onClick={() => handleTabChange('fragebogen')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'fragebogen'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-secondary hover:border-gray-300'
              }`}
          >
            Fragebogen
          </button>
          <button
            onClick={() => handleTabChange('finanzen')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'finanzen'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-secondary hover:border-gray-300'
              }`}
          >
            Finanzen
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        <div className={activeTab === 'akte' ? 'space-y-8 animate-fadeIn' : 'hidden'}>
          {/* Stammdaten Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mandant Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                  <UserIcon /> Mandant
                </h3>
                <button
                  onClick={() => navigate(`/stammdaten?tab=mandant&editId=${akte.mandant.id}&returnTo=/akten/${id}`)}
                  className="text-sm text-primary hover:underline"
                >
                  Bearbeiten
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-text-muted">Name:</span>
                  <span className="col-span-2 font-medium">{akte.mandant.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-text-muted">Adresse:</span>
                  <span className="col-span-2">{akte.mandant.adresse}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-text-muted">Kontakt:</span>
                  <div className="col-span-2 flex flex-col">
                    <a href={`tel:${akte.mandant.telefon}`} className="text-primary hover:underline">{akte.mandant.telefon}</a>
                    <a href={`mailto:${akte.mandant.email}`} className="text-primary hover:underline">{akte.mandant.email}</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Gegner Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                  <ShieldIcon /> Gegner
                </h3>
                <button
                  onClick={() => navigate(`/stammdaten?tab=gegner&editId=${akte.gegner.id}&returnTo=/akten/${id}`)}
                  className="text-sm text-primary hover:underline"
                >
                  Bearbeiten
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-text-muted">Name:</span>
                  <span className="col-span-2 font-medium">{akte.gegner.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-text-muted">Vertreter:</span>
                  <span className="col-span-2">{akte.gegner.vertreter}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-text-muted">Adresse:</span>
                  <span className="col-span-2">{akte.gegner.adresse}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-text-muted">Kontakt:</span>
                  <div className="col-span-2 flex flex-col">
                    <a href={`tel:${akte.gegner.telefon}`} className="text-primary hover:underline">{akte.gegner.telefon}</a>
                    <a href={`mailto:${akte.gegner.email}`} className="text-primary hover:underline">{akte.gegner.email}</a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Split View */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column: Verlauf (2/3 width on large screens) */}
            <div className="xl:col-span-2">
              <div className="card h-full">
                <VerlaufSection akteId={id || ''} />
              </div>
            </div>

            {/* Right Column: Aufgaben/Fristen (1/3 width) */}
            <div className="xl:col-span-1">
              <div className="card h-full sticky top-6">
                <h3 className="text-lg font-bold text-secondary mb-4">Aufgaben & Fristen</h3>
                <AufgabenFristenSection akteId={id || ''} />
              </div>
            </div>
          </div>
        </div>

        <div className={activeTab === 'drittbeteiligte' ? 'animate-fadeIn' : 'hidden'}>
          <DrittbeteiligteList akteId={id || ''} />
        </div>

        <div className={activeTab === 'fragebogen' ? 'animate-fadeIn' : 'hidden'}>
          <Fragebogen akteId={id || ''} />
        </div>

        <div className={activeTab === 'finanzen' ? 'animate-fadeIn' : 'hidden'}>
          <div className="card">
            <FinanzTabelle akteId={id || ''} />
          </div>
        </div>
      </div>
    </div>
  );
};

const UserIcon = () => (
  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

export default AktenView;