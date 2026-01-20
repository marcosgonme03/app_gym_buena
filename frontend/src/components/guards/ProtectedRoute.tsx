import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/lib/supabase/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { session, profile, loading, error } = useAuth();

  console.log('[ProtectedRoute] State:', { 
    loading, 
    hasSession: !!session, 
    hasProfile: !!profile,
    role: profile?.role,
    error: error?.message 
  });

  // Mostrar loading skeleton mientras carga
  if (loading) {
    console.log('[ProtectedRoute] Still loading...');
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-dark-300">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no hay sesión, redirigir a login
  if (!session) {
    console.log('[ProtectedRoute] No session, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Si hay error crítico (perfil no encontrado), mostrar error
  if (error && !profile) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-dark-900 border border-red-500/50 rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-400">Error de Perfil</h3>
              <p className="text-dark-300 text-sm mt-1">
                Tu cuenta está autenticada pero no se encontró tu perfil en la base de datos.
              </p>
              <p className="text-dark-400 text-xs mt-2">
                Esto puede ocurrir si el trigger automático falló durante el registro.
                Por favor, contacta con soporte técnico.
              </p>
            </div>
          </div>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-dark-800 hover:bg-dark-700 text-dark-200 py-2 px-4 rounded transition-colors"
          >
            Volver al login
          </button>
        </div>
      </div>
    );
  }

  // Verificar roles permitidos
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    // Redirigir al dashboard correspondiente según el role real
    const redirectMap: Record<Role, string> = {
      admin: '/admin',
      trainer: '/trainer',
      member: '/app',
    };

    return <Navigate to={redirectMap[profile.role]} replace />;
  }

  return <>{children}</>;
};
