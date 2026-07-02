import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import { AdminDashboard, PemilikDashboard, PenghuniDashboard } from './pages/Dashboards';

// Pelindung route: kalau belum login, lempar ke halaman login.
// Kalau role tidak sesuai halaman yang dituju, lempar ke dashboard yang benar.
const ProtectedRoute = ({ children, allowedRole }) => {
  const user = JSON.parse(localStorage.getItem('user'));

  if (!user) return <Navigate to="/login" replace />;

  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'Admin') return <Navigate to="/admin" replace />;
    if (user.role === 'Pemilik') return <Navigate to="/pemilik" replace />;
    return <Navigate to="/penghuni" replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Halaman default langsung ke login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRole="Admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pemilik"
          element={
            <ProtectedRoute allowedRole="Pemilik">
              <PemilikDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/penghuni"
          element={
            <ProtectedRoute allowedRole="Penghuni">
              <PenghuniDashboard />
            </ProtectedRoute>
          }
        />

        {/* Route tidak dikenal dilempar ke login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;