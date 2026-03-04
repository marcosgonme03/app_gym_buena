import React, { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { getRecentActivity } from '../services/adminService';

interface ActivityEntry {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  table_name: string;
  created_at: string;
}

const TABLE_BADGE: Record<string, string> = {
  workout_sessions:  'bg-purple-500/15 text-purple-400 border-purple-500/25',
  nutrition_entries: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

const TABLE_LABEL: Record<string, string> = {
  workout_sessions:  'Entrenamiento',
  nutrition_entries: 'Nutrición',
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'ahora mismo';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  return `hace ${Math.floor(diffH / 24)} d`;
}

export const AdminLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    getRecentActivity()
      .then((data) => setLogs(data as ActivityEntry[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const headerActions = (
    <button
      onClick={load}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-dark-800 text-dark-300 hover:text-dark-100 hover:bg-dark-700 transition-all disabled:opacity-50"
    >
      <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Actualizar
    </button>
  );

  return (
    <AdminLayout title="Logs del sistema" subtitle="Actividad reciente de usuarios" headerActions={headerActions}>
      <div className="bg-dark-900 border border-dark-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-dark-400 text-sm">Cargando actividad...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-dark-500">
            <svg className="w-10 h-10 mb-3 text-dark-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">Sin actividad registrada</p>
          </div>
        ) : (
          <div className="divide-y divide-dark-800/60">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-dark-800/20 transition-colors">
                {/* User icon */}
                <div className="shrink-0 w-8 h-8 rounded-full bg-dark-800 border border-dark-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-dark-200">{log.user_name}</span>
                    <span className="text-xs text-dark-500">·</span>
                    <span className="text-xs text-dark-500">{log.action}</span>
                  </div>
                  <p className="text-xs text-dark-600 mt-0.5">{log.user_email}</p>
                </div>

                {/* Badge + time */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${TABLE_BADGE[log.table_name] ?? 'bg-dark-700/50 text-dark-400 border-dark-700'}`}>
                    {TABLE_LABEL[log.table_name] ?? log.table_name}
                  </span>
                  <span className="text-xs text-dark-600">{timeAgo(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
