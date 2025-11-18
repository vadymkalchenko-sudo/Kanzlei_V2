import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AktenView from './components/AktenView';
import AkteForm from './components/AkteForm';

function App() {
  return (
    <Router>
      <main>
        <header>
          <h1>Kanzlei Management System</h1>
          <p>
            JSONB-Zusatzdaten und Konfliktprüfung direkt aus dem Browser testen. Port
            303 ist fest eingestellt.
          </p>
        </header>

        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/akte/:id" element={<AktenView />} />
          <Route path="/akte" element={<AkteForm />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
