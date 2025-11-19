import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import OrganizerTabs from './OrganizerTabs';
import FinanzTabelle from './FinanzTabelle';
import DokumenteSection from './DokumenteSection';

interface Mandant {
  id?: number;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
}

interface Gegner {
  id?: number;
  name: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  vertreter: string;
}

interface Akte {
  id: string | number;
  az: string;
  betreff: string;
  status: string;
  anlagedatum: string;
  mandant: Mandant;
  gegner: Gegner;
}

const AktenView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [akte, setAkte] = useState<Akte | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'akte' | 'finanzen'>('akte');

  useEffect(() => {
    const timer = setTimeout(() => {
      setAkte({
        id: id || '1',
        az: '2024/001',
        betreff: 'Müller GmbH ./. Schmidt AG',
        status: 'Aktiv',
        anlagedatum: '2024-01-15',
        mandant: {
          name: 'Müller GmbH',
          strasse: 'Hauptstr. 10',
          plz: '10115',
          ort: 'Berlin',
          telefon: '030 123456',
          email: 'info@mueller-gmbh.de'
        },
        gegner: {
          name: 'Schmidt AG',
          strasse: 'Industrieweg 5',
          plz: '20095',
          ort: 'Hamburg',
          telefon: '040 987654',
          email: 'kontakt@schmidt-ag.de',
          vertreter: 'RA Dr. König'
        }
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!akte) {
    return <div className="text-center p-8 text-red-500">Akte nicht gefunden.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-slate-900">{akte.betreff}</h2>
            <span className="badge badge-success text-sm">{akte.status}</span>
          </div>
          <p className="text-slate-600">
            <span className="font-semibold">Aktenzeichen:</span> <span className="font-mono text-primary font-semibold">{akte.az}</span>
            <span className="mx-2">•</span>
            <span className="font-semibold">Angelegt am:</span> {akte.anlagedatum}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="btn btn-secondary"
          >
            ← Zurück
          </button>
          <button className="btn btn-accent">
            Akte schließen
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('akte')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'akte'
              ? 'border-primary text-primary'
              : 'border-transparent text-text-muted hover:text-secondary hover:border-gray-300'
              }`}
          >
            Akte & Details
          </button>
          <button
            onClick={() => setActiveTab('finanzen')}
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
        {activeTab === 'akte' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Stammdaten Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mandant Card */}
              <div className="card">
                <div className="flex items-center justify-between mb-4 border-b border-border pb-2">
                  <h3 className="text-lg font-bold text-secondary flex items-center gap-2">
                    <UserIcon /> Mandant
                  </h3>
                  <button className="text-sm text-primary hover:underline">Bearbeiten</button>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-text-muted">Name:</span>
                    <span className="col-span-2 font-medium">{akte.mandant.name}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-text-muted">Adresse:</span>
                    <span className="col-span-2">{akte.mandant.strasse}, {akte.mandant.plz} {akte.mandant.ort}</span>
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
                  <button className="text-sm text-primary hover:underline">Bearbeiten</button>
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
                    <span className="col-span-2">{akte.gegner.strasse}, {akte.gegner.plz} {akte.gegner.ort}</span>
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

            {/* Dokumente Section */}
            <div className="card">
              <h3 className="text-lg font-bold text-secondary mb-4">Dokumente</h3>
              <DokumenteSection akteId={id || ''} />
            </div>

            {/* Organizer Section */}
            <div className="card">
              <h3 className="text-lg font-bold text-secondary mb-4">Organizer</h3>
              <OrganizerTabs akteId={id || ''} />
            </div>
          </div>
        )}

        {activeTab === 'finanzen' && (
          <div className="animate-fadeIn">
            <div className="card">
              <FinanzTabelle akteId={id || ''} />
            </div>
          </div>
        )}
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