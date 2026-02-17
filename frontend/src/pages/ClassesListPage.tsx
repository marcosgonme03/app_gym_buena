import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { ClassCard } from '@/components/classes/ClassCard';
import { useClasses } from '@/features/classes/hooks/useClasses';
import { cancelClass } from '@/features/classes/services/classesService';
import {
  type AdvancedClassesFilters,
  useClassesExtended,
} from '@/features/classes/hooks/useClassesExtended';
import { useClassRecommendations } from '@/features/classes/hooks/useClassRecommendations';
import { AdvancedClassesFilters as AdvancedClassesFiltersPanel } from '@/components/classes/AdvancedClassesFilters';
import { RecommendedClasses } from '@/components/classes/RecommendedClasses';
import { ClassesWeeklyCalendarView } from '@/components/classes/ClassesWeeklyCalendarView';

const defaultAdvancedFilters: AdvancedClassesFilters = {
  timeBand: 'all',
  trainer: 'all',
  duration: 'all',
  classKind: 'all',
  sortBy: 'recommended',
};

export const ClassesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [onlyActive, setOnlyActive] = useState(true);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedClassesFilters>(defaultAdvancedFilters);
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid');
  const [actionLoadingSessionId, setActionLoadingSessionId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { data, loading, error, refresh } = useClasses({
    search,
    level,
    onlyActive,
    daysAhead: 14,
  });

  const trainerOptions = useMemo(
    () => Array.from(new Set(data.map((item) => item.trainerName))).sort((a, b) => a.localeCompare(b, 'es')),
    [data]
  );

  const { demandSignals, demandLoading, filteredAndSorted, calendarItemsByDay } = useClassesExtended(data, advancedFilters);
  const { recommendations, fallbackToPopular } = useClassRecommendations(data, demandSignals);

  const handleCancelBooking = async (sessionId: string) => {
    try {
      setActionLoadingSessionId(sessionId);
      await cancelClass(sessionId);
      setToast({ type: 'success', message: 'Reserva cancelada correctamente.' });
      await refresh();
    } catch (err: any) {
      setToast({ type: 'error', message: err?.message || 'No se pudo cancelar la reserva.' });
    } finally {
      setActionLoadingSessionId(null);
      window.setTimeout(() => setToast(null), 2600);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 light:bg-gray-50 pb-24 lg:pb-8">
      <BottomNav />

      <main className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-dark-50">Clases</h1>
            <p className="text-sm text-dark-400">Explora y reserva clases en segundos</p>
          </div>
          <button
            onClick={() => navigate('/app/workout')}
            className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm transition-all duration-200 hover:shadow-lg"
            aria-label="Ir a Entrenar"
          >
            Ir a Entrenar
          </button>
        </header>

        {toast && (
          <div className={`rounded-xl border p-3 text-sm ${toast.type === 'success' ? 'border-green-500/30 bg-green-500/10 text-green-200' : 'border-red-500/30 bg-red-500/10 text-red-200'}`}>
            {toast.message}
          </div>
        )}

        <RecommendedClasses
          items={recommendations}
          fallbackToPopular={fallbackToPopular}
          onOpen={(slug) => navigate(`/app/classes/${slug}`)}
        />

        <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre..."
              aria-label="Buscar clases"
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
            />

            <select
              value={level}
              onChange={(event) => setLevel(event.target.value as 'all' | 'beginner' | 'intermediate' | 'advanced')}
              aria-label="Filtrar por nivel"
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
            >
              <option value="all">Todos los niveles</option>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>

            <label className="inline-flex items-center gap-2 text-sm text-dark-200 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(event) => setOnlyActive(event.target.checked)}
                aria-label="Mostrar solo clases activas"
              />
              Solo activas
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg border border-dark-700 bg-dark-800 p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-dark-200 hover:text-dark-100'}`}
                aria-label="Cambiar a vista grid"
              >
                Vista grid
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 rounded-md text-xs transition-colors ${viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'text-dark-200 hover:text-dark-100'}`}
                aria-label="Cambiar a vista calendario"
              >
                Vista calendario
              </button>
            </div>

            <p className="text-xs text-dark-400">
              {demandLoading ? 'Analizando tendencias…' : 'Tendencias actualizadas de los últimos 7 días.'}
            </p>
          </div>
        </section>

        <AdvancedClassesFiltersPanel
          open={advancedOpen}
          filters={advancedFilters}
          trainerOptions={trainerOptions}
          onChange={setAdvancedFilters}
          onToggleOpen={() => setAdvancedOpen((prev) => !prev)}
        />

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Cargando clases">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-2xl border border-dark-800 bg-dark-900 overflow-hidden">
                <div className="h-40 bg-dark-800" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-dark-800 rounded w-2/3" />
                  <div className="h-3 bg-dark-800 rounded w-1/2" />
                  <div className="h-2 bg-dark-800 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-300 mb-2">{error}</p>
            <button
              onClick={refresh}
              className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm transition-colors"
              aria-label="Reintentar carga de clases"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && filteredAndSorted.length === 0 && (
          <div className="rounded-lg border border-dark-800 bg-dark-900 p-8 text-center">
            <p className="text-dark-400">No hay clases para mostrar con esos filtros.</p>
          </div>
        )}

        {!loading && !error && filteredAndSorted.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSorted.map((item) => (
              <ClassCard
                key={item.id}
                item={item}
                demandSignal={demandSignals[item.id]}
                onOpen={(slug) => navigate(`/app/classes/${slug}`)}
                onCancelBooking={handleCancelBooking}
                actionLoadingSessionId={actionLoadingSessionId}
              />
            ))}
          </div>
        )}

        {!loading && !error && filteredAndSorted.length > 0 && viewMode === 'calendar' && (
          <ClassesWeeklyCalendarView
            itemsByDay={calendarItemsByDay}
            onOpen={(slug) => navigate(`/app/classes/${slug}`)}
          />
        )}
      </main>
    </div>
  );
};

export default ClassesListPage;
