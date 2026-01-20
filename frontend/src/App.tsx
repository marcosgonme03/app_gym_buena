import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { MemberDashboard } from '@/pages/MemberDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { TrainerDashboard } from '@/pages/TrainerDashboard';
import { Settings } from '@/pages/Settings';

export const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Rutas protegidas por role */}
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <MemberDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer"
              element={
                <ProtectedRoute allowedRoles={['trainer']}>
                  <TrainerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Ruta de ajustes (accesible para todos los roles autenticados) */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['admin', 'trainer', 'member']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};
