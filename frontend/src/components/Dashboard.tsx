import React from 'react';
import { Link } from 'react-router-dom';
import SearchBar from './SearchBar';

const Dashboard = () => {
  const stats = [
    { label: 'Offene Akten', value: '24', change: '+2', trend: 'up', icon: <FolderIcon />, color: 'bg-sky-500' },
    { label: 'Fristen heute', value: '3', change: '-1', trend: 'down', icon: <ClockIcon />, color: 'bg-amber-500' },
    { label: 'Termine diese Woche', value: '8', change: '+4', trend: 'up', icon: <CalendarIcon />, color: 'bg-emerald-500' },
    { label: 'Statistiken', value: '156', change: '+12', trend: 'up', icon: <ChartIcon />, color: 'bg-violet-500' },
  ];

  const recentAkten = [
    { id: 1, az: '2024/001', mandant: 'Müller GmbH', gegner: 'Schmidt AG', status: 'Aktiv', update: 'Heute, 10:30' },
    { id: 2, az: '2024/002', mandant: 'Dr. Weber', gegner: 'Allianz Vers.', status: 'Warten', update: 'Gestern, 14:15' },
    { id: 3, az: '2024/003', mandant: 'Klaus Klein', gegner: 'Stadt München', status: 'Aktiv', update: '17.11.2024' },
    { id: 4, az: '2024/004', mandant: 'ImmoInvest', gegner: 'Bauunternehmung', status: 'Abgeschlossen', update: '15.11.2024' },
    { id: 5, az: '2024/005', mandant: 'Herbert Meyer', gegner: 'Deutsche Bank', status: 'Aktiv', update: '14.11.2024' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-md p-6 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                <h3 className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</h3>
                <div className={`flex items-center mt-3 text-xs font-semibold ${stat.trend === 'up' ? 'text-emerald-600' : 'text-red-600'}`}>
                  <span>{stat.change}</span>
                  <span className="ml-1 text-slate-500 font-normal">vs. Vormonat</span>
                </div>
              </div>
              <div className={`${stat.color} p-3 rounded-lg text-white`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search Bar Test */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Akten durchsuchen</h3>
        <SearchBar />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Link to="/akte" className="btn btn-accent">
          <PlusIcon />
          Neue Akte anlegen
        </Link>
        <button className="btn btn-secondary">
          <CalendarIcon />
          Termin erstellen
        </button>
      </div>

      {/* Recent Files Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-slate-900">Zuletzt bearbeitete Akten</h3>
          <Link to="/akte" className="text-sm font-semibold text-primary hover:text-primary-dark">
            Alle anzeigen →
          </Link>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Aktenzeichen</th>
                <th>Mandant</th>
                <th>Gegner</th>
                <th>Status</th>
                <th>Letztes Update</th>
                <th className="text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {recentAkten.map((akte) => (
                <tr key={akte.id} className="hover:bg-slate-50 transition-colors">
                  <td className="font-semibold text-primary">
                    <Link to={`/akte/${akte.id}`} className="hover:underline">{akte.az}</Link>
                  </td>
                  <td className="font-medium">{akte.mandant}</td>
                  <td className="text-slate-600">{akte.gegner}</td>
                  <td>
                    <span className={`badge ${akte.status === 'Aktiv' ? 'badge-success' :
                      akte.status === 'Warten' ? 'badge-warning' : 'badge-neutral'
                      }`}>
                      {akte.status}
                    </span>
                  </td>
                  <td className="text-slate-500 text-sm">{akte.update}</td>
                  <td className="text-right">
                    <Link
                      to={`/akte/${akte.id}`}
                      className="text-primary hover:text-primary-dark font-semibold text-sm"
                    >
                      Bearbeiten
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Icons
const FolderIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const ChartIcon = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

export default Dashboard;