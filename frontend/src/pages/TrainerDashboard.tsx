import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { Avatar } from '@/components/common/Avatar';

interface Class {
  id: string;
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
}

export const TrainerDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayClasses();
  }, [profile]);

  const loadTodayClasses = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('trainer_id', profile.user_id)
        .eq('date', today)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[TrainerDashboard] Error loading classes:', error);
        return;
      }

      setClasses(data || []);
    } catch (err) {
      console.error('[TrainerDashboard] Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-dark-950 dark:bg-dark-950 light:bg-gray-50">
      <header className="bg-dark-900 border-b border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={profile.avatar_url}
                name={`${profile.name} ${profile.last_name}`}
                size="md"
              />
              <div>
                <h1 className="text-2xl font-bold text-dark-50 dark:text-dark-50 light:text-gray-900">Panel de Entrenador</h1>
                <p className="text-sm text-dark-400 dark:text-dark-400 light:text-gray-600 mt-1">Hola, {profile.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 bg-dark-800 hover:bg-dark-700 text-dark-200 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-dark-200 light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-900 rounded-lg transition-colors"
                title="Ajustes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-dark-200 light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-900 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-dark-50 dark:text-dark-50 light:text-gray-900 mb-2">Mis Clases de Hoy</h2>
          <p className="text-dark-400 dark:text-dark-400 light:text-gray-600 text-sm">{new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-dark-400 dark:text-dark-400 light:text-gray-600">Cargando clases...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="bg-dark-900 border border-dark-800 dark:bg-dark-900 dark:border-dark-800 light:bg-white light:border-gray-200 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-dark-800 dark:bg-dark-800 light:bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-dark-400 dark:text-dark-400 light:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-dark-300 dark:text-dark-300 light:text-gray-700 mb-2">No tienes clases hoy</h3>
            <p className="text-dark-500 text-sm">Disfruta tu día libre 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="bg-dark-900 border border-dark-800 rounded-lg p-6 hover:border-primary-500/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-dark-50 mb-1">{classItem.name}</h3>
                    <p className="text-sm text-dark-400">{classItem.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-dark-300">
                      {classItem.start_time.substring(0, 5)} - {classItem.end_time.substring(0, 5)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-dark-300">
                      Capacidad: {classItem.capacity} personas
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-dark-800">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    Activa
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
