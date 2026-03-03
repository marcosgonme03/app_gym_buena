import React from 'react';

const VIDEOS = [
  {
    id: '1',
    title: 'Técnica de Press de Banca',
    duration: '8:32',
    category: 'Técnica',
    thumb: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
  },
  {
    id: '2',
    title: 'Estiramientos Post-Entreno',
    duration: '12:15',
    category: 'Recuperación',
    thumb: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&q=80',
  },
];

export const VideosCard: React.FC = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-dark-50">Videos Recomendados</h2>
        <button className="text-xs text-dark-500 hover:text-dark-300 transition-colors">Ver todos</button>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {VIDEOS.map(v => (
          <div
            key={v.id}
            className="rounded-2xl bg-dark-800/50 border border-dark-800 overflow-hidden cursor-pointer group hover:border-dark-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-black/30"
          >
            {/* Thumbnail */}
            <div className="relative h-36 bg-dark-800 overflow-hidden">
              <img
                src={v.thumb}
                alt={v.title}
                className="w-full h-full object-cover opacity-70 group-hover:opacity-90 group-hover:scale-105 transition-all duration-300"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Dark overlay on hover */}
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
              {/* Category badge */}
              <span className="absolute top-2 left-2 text-[10px] bg-dark-900/80 text-dark-300 px-2 py-0.5 rounded-full font-medium backdrop-blur-sm">
                {v.category}
              </span>
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary-500/90 group-hover:scale-110 transition-all duration-200 border border-white/10">
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
              {/* Duration badge */}
              <span className="absolute bottom-2 right-2 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded font-medium backdrop-blur-sm">
                {v.duration}
              </span>
            </div>

            <div className="p-3.5">
              <p className="text-xs text-dark-300 font-semibold leading-snug group-hover:text-dark-100 transition-colors line-clamp-2">
                {v.title}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
