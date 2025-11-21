import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import AktenView from './components/AktenView';
import AkteForm from './components/AkteForm';
import Login from './components/Login';
import Layout from './components/Layout';
import Settings from './components/Settings';
import Stammdaten from './components/Stammdaten';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <main>
          {/* Header nur anzeigen, wenn nicht auf Login-Seite? 
              Hier lassen wir ihn erstmal, oder passen ihn an. 
              Für E2E-Test ist es egal, solange Routing stimmt. */}

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/finanzen" element={<div>Finanzen (Platzhalter)</div>} />
            <Route path="/settings" element={<Settings />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/akte" element={<AkteForm />} />
                <Route path="/akte/:id" element={<AktenView />} />
                <Route path="/stammdaten" element={<Stammdaten />} />
              </Route>
            </Route>
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
