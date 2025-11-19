import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Frist {
  akte_id: number;
  aktenzeichen: string;
  bezeichnung: string;
  frist_datum: string;
  prioritaet: string;
  tage_bis_frist?: number;
}

const Header = ({ title = 'Dashboard' }: { title?: string }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [fristen, setFristen] = useState<Frist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const envBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
        const API_BASE_URL = typeof envBaseUrl === "string" && envBaseUrl.length > 0
          ? envBaseUrl
          : "http://localhost:8000/api/";

        const response = await axios.get(`${API_BASE_URL}dashboard/`);
        if (response.data.priorisierte_fristen) {
          setFristen(response.data.priorisierte_fristen);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Dashboard-Daten", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const notificationCount = fristen.length;

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Suchen..."
              className="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <SearchIcon />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <BellIcon />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
                <div className="px-4 py-2 border-b border-slate-200">
                  <h3 className="font-semibold text-slate-900">Benachrichtigungen</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {fristen.length > 0 ? (
                    fristen.map((frist, index) => (
                      <div
                        key={index}
                        className="p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 cursor-pointer transition-colors"
                        onClick={() => {
                          if (frist.akte_id) {
                            window.location.href = `/akte/${frist.akte_id}`;
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-slate-800 text-sm">
                            {frist.aktenzeichen ? `${frist.aktenzeichen} - ` : ''}{frist.bezeichnung}
                          </span>
                          <span className={`text-xs px-1.5 py-0.5 rounded-full ${frist.prioritaet === 'hoch' ? 'bg-red-100 text-red-700' :
                              frist.prioritaet === 'mittel' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                            }`}>
                            {frist.prioritaet}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 flex justify-between">
                          <span>Frist: {new Date(frist.frist_datum).toLocaleDateString('de-DE')}</span>
                          {frist.tage_bis_frist !== undefined && (
                            <span className={frist.tage_bis_frist < 3 ? 'text-red-600 font-medium' : ''}>
                              {frist.tage_bis_frist} Tage
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-slate-500 text-sm">
                      Keine neuen Benachrichtigungen
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const SearchIcon = () => (
  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

export default Header;
