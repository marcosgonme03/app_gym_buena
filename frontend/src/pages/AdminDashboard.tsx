import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/supabase/types';
import { Avatar } from '@/components/common/Avatar';

export const AdminDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'all' | 'admin' | 'trainer' | 'member'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('[AdminDashboard] Error loading users:', fetchError);
        setError('Error al cargar usuarios');
        return;
      }

      setUsers(data || []);
    } catch (err) {
      console.error('[AdminDashboard] Unexpected error:', err);
      setError('Error inesperado al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'trainer':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'member':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      default:
        return 'bg-dark-700 text-dark-300 border-dark-600';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'trainer':
        return 'Entrenador';
      case 'member':
        return 'Miembro';
      default:
        return role;
    }
  };

  // Filtrar usuarios según el role seleccionado
  const filteredUsers = selectedRole === 'all' 
    ? users 
    : users.filter(u => u.role === selectedRole);

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-dark-950">
      <header className="bg-dark-900 border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={profile.avatar_url}
                name={`${profile.name} ${profile.last_name}`}
                size="md"
              />
              <div>
                <h1 className="text-2xl font-bold text-dark-50">Panel de Administración</h1>
                <p className="text-sm text-dark-400 mt-1">Hola, {profile.name} (Admin)</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors"
                title="Ajustes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors"
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
            <h3 className="text-sm text-dark-400 mb-2">Total Usuarios</h3>
            <p className="text-3xl font-bold text-dark-50">{users.length}</p>
          </div>
          <div 
            className={`bg-dark-900 border rounded-lg p-6 cursor-pointer transition-all ${
              selectedRole === 'admin' 
                ? 'border-red-500 ring-2 ring-red-500/20' 
                : 'border-dark-800 hover:border-red-500/50'
            }`}
            onClick={() => setSelectedRole(selectedRole === 'admin' ? 'all' : 'admin')}
          >
            <h3 className="text-sm text-dark-400 mb-2">Administradores</h3>
            <p className="text-3xl font-bold text-red-400">{users.filter(u => u.role === 'admin').length}</p>
          </div>
          <div 
            className={`bg-dark-900 border rounded-lg p-6 cursor-pointer transition-all ${
              selectedRole === 'trainer' 
                ? 'border-blue-500 ring-2 ring-blue-500/20' 
                : 'border-dark-800 hover:border-blue-500/50'
            }`}
            onClick={() => setSelectedRole(selectedRole === 'trainer' ? 'all' : 'trainer')}
          >
            <h3 className="text-sm text-dark-400 mb-2">Entrenadores</h3>
            <p className="text-3xl font-bold text-blue-400">{users.filter(u => u.role === 'trainer').length}</p>
          </div>
          <div 
            className={`bg-dark-900 border rounded-lg p-6 cursor-pointer transition-all ${
              selectedRole === 'member' 
                ? 'border-green-500 ring-2 ring-green-500/20' 
                : 'border-dark-800 hover:border-green-500/50'
            }`}
            onClick={() => setSelectedRole(selectedRole === 'member' ? 'all' : 'member')}
          >
            <h3 className="text-sm text-dark-400 mb-2">Miembros</h3>
            <p className="text-3xl font-bold text-green-400">{users.filter(u => u.role === 'member').length}</p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-dark-900 border border-dark-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-dark-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-dark-50">
                {selectedRole === 'all' && 'Todos los Usuarios'}
                {selectedRole === 'admin' && 'Administradores'}
                {selectedRole === 'trainer' && 'Entrenadores'}
                {selectedRole === 'member' && 'Miembros'}
              </h2>
              {selectedRole !== 'all' && (
                <button
                  onClick={() => setSelectedRole('all')}
                  className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Ver todos
                </button>
              )}
            </div>
            <button
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-dark-800 hover:bg-dark-700 disabled:opacity-50 text-dark-200 rounded-md transition-colors text-sm"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-dark-400">Cargando usuarios...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-red-400 font-medium mb-2">{error}</p>
              <button onClick={loadUsers} className="text-sm text-primary-400 hover:text-primary-300">
                Reintentar
              </button>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-dark-400">No hay usuarios en esta categoría</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-dark-400 uppercase tracking-wider">Fecha Registro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-800">
                  {filteredUsers.map((user) => (
                    <tr key={user.user_id} className="hover:bg-dark-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar
                            src={user.avatar_url}
                            name={`${user.name} ${user.last_name}`}
                            size="md"
                            className="mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-dark-50">
                              {user.name} {user.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-dark-300">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-400">
                        {new Date(user.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
