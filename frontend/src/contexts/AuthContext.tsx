import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/supabase/types';
import { getUserProfile } from '@/lib/auth/getProfile';

interface AuthContextType {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isLoadingRef = useRef(false);

  const loadUser = async (currentSession: Session | null) => {
    // Evitar múltiples llamadas simultáneas
    if (isLoadingRef.current) {
      console.log('[AuthContext] Already loading, skipping...');
      return;
    }

    try {
      isLoadingRef.current = true;
      setError(null);

      if (!currentSession) {
        console.log('[AuthContext] No session, clearing user data');
        setSession(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log('[AuthContext] Loading profile for user:', currentSession.user.id);
      
      const userProfile = await getUserProfile(currentSession.user.id);

      if (!userProfile) {
        console.error('[AuthContext] Profile not found');
        setError(new Error('Perfil no encontrado'));
      }

      setSession(currentSession);
      setProfile(userProfile);
      
      console.log('[AuthContext] User loaded successfully:', { 
        hasProfile: !!userProfile,
        role: userProfile?.role 
      });
    } catch (err) {
      console.error('[AuthContext] Error loading user:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  useEffect(() => {
    console.log('[AuthContext] Initializing...');

    // Cargar sesión inicial
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      console.log('[AuthContext] Initial session:', !!initialSession);
      loadUser(initialSession);
    });

    // Escuchar cambios en la autenticación (solo una vez)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('[AuthContext] Auth state changed:', _event, 'Session:', !!newSession);
      
      // Solo recargar si realmente cambió la sesión
      if (newSession?.user?.id !== session?.user?.id) {
        loadUser(newSession);
      }
    });

    return () => {
      console.log('[AuthContext] Cleaning up');
      subscription.unsubscribe();
    };
  }, []); // Sin dependencias para evitar loops

  const signOut = async () => {
    console.log('[AuthContext] Signing out...');
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setError(null);
  };

  const refreshProfile = async () => {
    console.log('[AuthContext] Refreshing profile...');
    
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.warn('[AuthContext] No session found during refresh');
        return;
      }

      // Forzar recarga desde BBDD
      const userProfile = await getUserProfile(currentSession.user.id);

      if (!userProfile) {
        console.error('[AuthContext] Profile not found during refresh');
        setError(new Error('Perfil no encontrado'));
        return;
      }

      setProfile(userProfile);
      console.log('[AuthContext] ✅ Profile refreshed successfully');
    } catch (err) {
      console.error('[AuthContext] Error refreshing profile:', err);
      setError(err as Error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, error, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
