import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { useClassesCatalog } from '@/features/classes/hooks/useClassesCatalog';

export const ClassesCatalogPage: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [onlyActive, setOnlyActive] = useState(true);

  const { data, loading, error, refresh } = useClassesCatalog({ search, level, onlyActive });

  return (
    <div className="min-h-screen bg-dark-950 light:bg-gray-50 pb-24 lg:pb-8">
      <BottomNav />

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-dark-50">Clases</h1>
            <p className="text-sm text-dark-400">Catálogo del gimnasio</p>
          </div>
          <button onClick={() => navigate('/app/workout')} className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm">Ir a Entrenar</button>
        </header>

        <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
            />

            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
            >
              <option value="all">Todos los niveles</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <label className="inline-flex items-center gap-2 text-sm text-dark-200 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700">
              <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
              Solo activas
            </label>
          </div>
        </section>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="animate-pulse h-56 rounded-xl bg-dark-800" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4">
            <p className="text-sm text-red-300 mb-2">{error}</p>
            <button onClick={refresh} className="px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm">Reintentar</button>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="rounded-lg border border-dark-800 bg-dark-900 p-8 text-center">
            <p className="text-dark-400">No hay clases para mostrar con esos filtros.</p>
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item) => {
              const cover = item.cover_image_url || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=900&q=80';
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(`/app/classes/${item.slug}`)}
                  className="group text-left rounded-2xl overflow-hidden border border-dark-800 bg-dark-900 hover:border-primary-500/50 transition-colors"
                >
                  <div className="relative h-52">
                    <img src={cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] border bg-primary-500/15 text-primary-200 border-primary-500/30">
                          {item.level || 'Todos los niveles'}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] border bg-dark-800/70 text-dark-200 border-dark-600">
                          {item.duration_min} min
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
