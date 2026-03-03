import React from 'react';

const ARTICLES = [
  { id: '1', title: '5 Consejos para Ganar Músculo', tag: 'Entrenamiento' },
  { id: '2', title: 'Los Mejores Suplementos para Fitness', tag: 'Nutrición' },
  { id: '3', title: 'Cómo Evitar el Estancamiento', tag: 'Consejos' },
];

export const ArticlesCard: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-dark-50">Últimos Artículos</h2>
        <button className="text-xs text-dark-500 hover:text-primary-400 transition-colors font-semibold">
          Ver más →
        </button>
      </div>

      <div className="space-y-1">
        {ARTICLES.map((a, i) => (
          <div
            key={a.id}
            className="flex items-center gap-3.5 py-3 px-3 -mx-3 cursor-pointer group rounded-xl hover:bg-dark-800/40 transition-all duration-150 hover:translate-x-1"
          >
            {/* Number badge */}
            <span className="w-6 h-6 rounded-lg bg-dark-800 group-hover:bg-primary-500/20 text-dark-500 group-hover:text-primary-400 text-[11px] font-black flex items-center justify-center flex-shrink-0 transition-all">
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-dark-300 group-hover:text-dark-100 transition-colors leading-snug font-medium truncate">
                {a.title}
              </p>
              <span className="text-[10px] text-dark-600 font-semibold mt-0.5 block">{a.tag}</span>
            </div>
            <svg className="w-3.5 h-3.5 text-dark-700 group-hover:text-dark-500 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};
