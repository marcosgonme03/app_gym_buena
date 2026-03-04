import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { AdminTable } from '../components/AdminTable';
import type { AdminTableColumn } from '../components/AdminTable';
import { Avatar } from '@/components/common/Avatar';
import { getAdminUsers, updateUserRole } from '../services/adminService';
import type { AdminUser } from '../types/adminTypes';

type Role = 'todos' | 'admin' | 'trainer' | 'member';
type SortKey = 'name' | 'sessions' | 'date';
type SortDir = 'asc' | 'desc';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'name',     label: 'Nombre' },
  { value: 'sessions', label: 'Sesiones' },
  { value: 'date',     label: 'Registro' },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  trainer: 'Entrenador',
  member: 'Miembro',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/15 text-red-400 border-red-500/25',
  trainer: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  member: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
};

interface Toast { id: number; msg: string; type: 'success' | 'error' }

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role>('todos');
  const [sortKey, setSortKey] = useState<SortKey>('sessions');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [updating, setUpdating] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (msg: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  const load = useCallback(() => {
    setLoading(true);
    getAdminUsers()
      .then(setUsers)
      .catch(() => pushToast('Error cargando usuarios', 'error'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(userId);
    try {
      await updateUserRole(userId, newRole as AdminUser['role']);
      setUsers((prev) =>
        prev.map((u) => u.user_id === userId ? { ...u, role: newRole as AdminUser['role'] } : u)
      );
      pushToast('Rol actualizado correctamente', 'success');
    } catch {
      pushToast('Error al actualizar rol', 'error');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = users
    .filter((u) => {
      const matchRole = roleFilter === 'todos' || u.role === roleFilter;
      const q = search.toLowerCase();
      const matchSearch = !q
        || `${u.name} ${u.last_name}`.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q);
      return matchRole && matchSearch;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'name')     cmp = `${a.name} ${a.last_name}`.localeCompare(`${b.name} ${b.last_name}`);
      if (sortKey === 'sessions') cmp = (a.workout_count ?? 0) - (b.workout_count ?? 0);
      if (sortKey === 'date')     cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const counts = {
    todos: users.length,
    admin: users.filter((u) => u.role === 'admin').length,
    trainer: users.filter((u) => u.role === 'trainer').length,
    member: users.filter((u) => u.role === 'member').length,
  };

  const columns: AdminTableColumn<AdminUser>[] = [
    {
      key: 'name',
      header: 'Usuario',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar src={row.avatar_url || undefined} name={`${row.name} ${row.last_name}`} size="sm" />
          <div>
            <p className="text-dark-100 font-medium">{row.name} {row.last_name}</p>
            <p className="text-xs text-dark-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Rol',
      width: 'w-36',
      render: (row) => (
        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[row.role]}`}>
          {ROLE_LABELS[row.role] ?? row.role}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Registro',
      width: 'w-32',
      render: (row) => (
        <span className="text-dark-400 text-xs">
          {new Date(row.created_at).toLocaleDateString('es-ES')}
        </span>
      ),
    },
    {
      key: 'workout_count',
      header: 'Sesiones',
      width: 'w-24',
      render: (row) => <span className="text-dark-300">{row.workout_count}</span>,
    },
    {
      key: 'actions',
      header: 'Cambiar rol',
      width: 'w-44',
      render: (row) => (
        <div className="flex items-center gap-2">
          <select
            value={row.role}
            disabled={updating === row.user_id}
            onChange={(e) => handleRoleChange(row.user_id, e.target.value)}
            className="bg-dark-800 border border-dark-700 text-dark-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
          >
            <option value="admin">Administrador</option>
            <option value="trainer">Entrenador</option>
            <option value="member">Miembro</option>
          </select>
          {updating === row.user_id && (
            <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminLayout title="Usuarios" subtitle="Gestión y roles de usuarios">
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium pointer-events-auto transition-all ${
            t.type === 'success'
              ? 'bg-green-500/15 border border-green-500/25 text-green-400'
              : 'bg-red-500/15 border border-red-500/25 text-red-400'
          }`}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Stat filter cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {(['todos', 'admin', 'trainer', 'member'] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`bg-dark-900 border rounded-xl p-4 text-left transition-all ${
              roleFilter === r
                ? 'border-primary-500/50 ring-1 ring-primary-500/30'
                : 'border-dark-800 hover:border-dark-700'
            }`}
          >
            <p className="text-xl font-black text-dark-100">{counts[r]}</p>
            <p className="text-xs text-dark-500 capitalize">{r === 'todos' ? 'Total' : ROLE_LABELS[r]}</p>
          </button>
        ))}
      </div>

      {/* Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 bg-dark-900 border border-dark-800 rounded-xl p-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o email..."
            className="w-full bg-transparent text-dark-200 placeholder-dark-600 text-sm focus:outline-none"
          />
        </div>
        {/* Sort key */}
        <div className="relative">
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="appearance-none bg-dark-900 border border-dark-800 rounded-xl px-4 py-2 pr-9 text-sm text-dark-200 focus:outline-none focus:border-primary-500/50 cursor-pointer h-full"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>Ordenar: {o.label}</option>)}
          </select>
          <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {/* Sort direction */}
        <button
          onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
          className="bg-dark-900 border border-dark-800 rounded-xl px-4 py-2 text-sm text-dark-400 hover:text-dark-200 transition-all flex items-center gap-2"
        >
          {sortDir === 'asc' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>
          )}
          {sortDir === 'asc' ? 'Asc' : 'Desc'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-dark-900 border border-dark-800 rounded-xl">
        <AdminTable<AdminUser>
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No se encontraron usuarios"
          keyExtractor={(u) => u.user_id}
        />
      </div>
    </AdminLayout>
  );
};
