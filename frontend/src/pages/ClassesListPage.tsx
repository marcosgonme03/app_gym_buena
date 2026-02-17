import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { ClassCard } from '@/components/classes/ClassCard';
import { useClasses } from '@/features/classes/hooks/useClasses';

export const ClassesListPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [onlyActive, setOnlyActive] = useState(true);

  const { data, loading, error, refresh } = useClasses({
    search,
    level,
    onlyActive,
    daysAhead: 14,
  });

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
            className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm"
          >
            Ir a Entrenar
          </button>
        </header>

        <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
            />

            <select
              value={level}
              onChange={(event) => setLevel(event.target.value as 'all' | 'beginner' | 'intermediate' | 'advanced')}
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
              />
              Solo activas
            </label>
          </div>
        </section>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="animate-pulse h-56 rounded-xl bg-dark-800" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-300 mb-2">{error}</p>
            <button
              onClick={refresh}
              className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm"
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="rounded-lg border border-dark-800 bg-dark-900 p-8 text-center">
            <p className="text-dark-400">No hay clases para mostrar con esos filtros.</p>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item) => (
              <ClassCard
                key={item.id}
                item={item}
                onOpen={(slug) => navigate(`/app/classes/${slug}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ClassesListPage;
