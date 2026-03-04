// ============================================================================
// WorkoutHistoryPage — Historial completo de entrenamientos
// Ruta: /app/workout/historial
// ============================================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav }              from '@/components/layout/TopNav';
import { useWorkoutHistory }   from '../hooks/useWorkoutHistory';
import { useTrainingStats }    from '../hooks/useTrainingStats';
import { HistoryCard, HistoryCardSkeleton } from '../components/HistoryCard';
import { SessionDetailModal }  from '../modals/SessionDetailModal';
import { ConfirmModal }        from '../modals/ConfirmModal';
import { ToastProvider, useToast } from '../components/Toast';
import { repeatSession }       from '../services/trainingService';
import type { HistoryItem }    from '../types';

// ─── Filter options ───────────────────────────────────────────────────────────

type CategoryFilter = 'all' | 'fuerza' | 'hipertrofia' | 'cardio' | 'general';

const CATEGORY_OPTS: { value: CategoryFilter; label: string; emoji: string }[] = [
  { value: 'all',         label: 'Todas',      emoji: '⚡' },
  { value: 'fuerza',      label: 'Fuerza',     emoji: '🏋️' },
  { value: 'hipertrofia', label: 'Hipertrofia', emoji: '💪' },
  { value: 'cardio',      label: 'Cardio',     emoji: '🏃' },
  { value: 'general',     label: 'General',    emoji: '✨' },
];

// ─── Stats bar ────────────────────────────────────────────────────────────────

const StatsBar: React.FC = () => {
  const { stats, loading } = useTrainingStats();

  const items = [
    { label: 'Total sesiones', value: loading ? '—' : String(stats?.total_sessions ?? 0) },
    { label: 'Este mes',       value: loading ? '—' : String(stats?.this_month_sessions ?? 0) },
    { label: 'Esta semana',    value: loading ? '—' : String(stats?.this_week_sessions ?? 0) },
    {
      label: 'Volumen total',
      value: loading ? '—' : stats?.total_weight_kg ? `${stats.total_weight_kg.toLocaleString()} kg` : '0 kg',
    },
    {
      label: 'Duración media',
      value: loading ? '—' : stats?.avg_duration_min ? `${stats.avg_duration_min} min` : '—',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
      {items.map(item => (
        <div key={item.label} className="bg-dark-900 border border-dark-800 rounded-2xl p-4 text-center">
          {loading ? (
            <div className="h-6 w-12 bg-dark-800 rounded-lg animate-pulse mx-auto mb-1" />
          ) : (
            <p className="text-xl font-black text-dark-50 tabular-nums">{item.value}</p>
          )}
          <p className="text-xs text-dark-500 mt-1">{item.label}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Empty state ─────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ filtered: boolean; onClear: () => void; onNavigate: () => void }> = ({
  filtered, onClear, onNavigate,
}) => (
  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-dark-900 border border-dark-800 flex items-center justify-center text-3xl mb-4">
      {filtered ? '🔍' : '🏋️'}
    </div>
    <p className="text-dark-200 font-bold text-lg mb-2">
      {filtered ? 'Sin resultados' : 'Sin entrenamientos aún'}
    </p>
    <p className="text-dark-500 text-sm max-w-xs mb-6">
      {filtered
        ? 'Prueba con otro filtro de categoría'
        : 'Completa tu primer entrenamiento para verlo aquí'}
    </p>
    {filtered ? (
      <button
        onClick={onClear}
        className="px-5 py-2.5 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-xl text-sm font-semibold transition-colors"
      >
        Quitar filtro
      </button>
    ) : (
      <button
        onClick={onNavigate}
        className="px-5 py-2.5 bg-primary-500 hover:bg-primary-400 text-white rounded-xl text-sm font-bold transition-colors"
      >
        Ir a entrenamientos
      </button>
    )}
  </div>
);

// ─── Page inner ───────────────────────────────────────────────────────────────

const WorkoutHistoryPageInner: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { items, loading, hasMore, loadMore, refresh } = useWorkoutHistory();

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [detailItem,     setDetailItem]     = useState<HistoryItem | null>(null);
  const [repeatItem,     setRepeatItem]     = useState<HistoryItem | null>(null);
  const [repeating,      setRepeating]      = useState(false);
  const [search,         setSearch]         = useState('');

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = items.filter(item => {
    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    const matchesSearch = !search || item.session_name.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const isFiltered = categoryFilter !== 'all' || search.trim().length > 0;

  // ── Repeat ─────────────────────────────────────────────────────────────────
  const handleRepeatConfirm = async () => {
    if (!repeatItem) return;
    setRepeating(true);
    try {
      const session = await repeatSession(repeatItem.id);
      toast('Sesión creada · ¡A entrenar! 💪', 'success');
      setRepeatItem(null);
      await refresh();
      navigate(`/app/workout/sesion/${session.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo repetir';
      toast(msg, 'error');
    } finally {
      setRepeating(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/app/workout')}
            className="w-9 h-9 rounded-xl bg-dark-900 border border-dark-800 hover:border-dark-700 flex items-center justify-center text-dark-400 hover:text-dark-200 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black text-dark-50">Historial</h1>
            <p className="text-sm text-dark-500">Todos tus entrenamientos</p>
          </div>
        </div>

        {/* ── Stats bar ───────────────────────────────────────────────────── */}
        <StatsBar />

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar entrenamiento…"
              className="w-full bg-dark-900 border border-dark-800 focus:border-primary-500/50 rounded-2xl pl-9 pr-4 py-2.5 text-sm text-dark-100 placeholder-dark-600 focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-600 hover:text-dark-400"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {CATEGORY_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setCategoryFilter(opt.value)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all duration-150 ${
                  categoryFilter === opt.value
                    ? 'bg-primary-500/15 border-primary-500/40 text-primary-300'
                    : 'bg-dark-900 border-dark-800 text-dark-400 hover:border-dark-700 hover:text-dark-300'
                }`}
              >
                <span>{opt.emoji}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Count ───────────────────────────────────────────────────────── */}
        {!loading && items.length > 0 && (
          <p className="text-xs text-dark-600 mb-4">
            {isFiltered
              ? `${filtered.length} de ${items.length} entrenamientos`
              : `${items.length} entrenamientos registrados`}
          </p>
        )}

        {/* ── Grid ────────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <HistoryCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            filtered={isFiltered}
            onClear={() => { setCategoryFilter('all'); setSearch(''); }}
            onNavigate={() => navigate('/app/workout')}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => (
                <HistoryCard
                  key={item.id}
                  item={item}
                  onViewDetail={setDetailItem}
                  onRepeat={setRepeatItem}
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && !isFiltered && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-8 py-3 bg-dark-900 hover:bg-dark-800 border border-dark-800 hover:border-dark-700 text-dark-300 rounded-2xl text-sm font-semibold transition-all duration-150 disabled:opacity-50"
                >
                  {loading ? 'Cargando…' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <SessionDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onRepeat={item => { setDetailItem(null); setRepeatItem(item); }}
      />

      <ConfirmModal
        isOpen={!!repeatItem}
        title="Repetir entrenamiento"
        message={`Se creará una nueva sesión de "${repeatItem?.session_name}" para hoy. ¿Continuar?`}
        confirmLabel="Sí, repetir"
        loading={repeating}
        onConfirm={handleRepeatConfirm}
        onCancel={() => setRepeatItem(null)}
      />
    </div>
  );
};

export const WorkoutHistoryPage: React.FC = () => (
  <ToastProvider>
    <WorkoutHistoryPageInner />
  </ToastProvider>
);
