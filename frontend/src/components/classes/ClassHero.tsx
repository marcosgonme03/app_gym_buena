import React from 'react';
import type { GymClass } from '@/features/classes/types';

interface ClassHeroProps {
  item: GymClass;
  selectedSessionLabel: string;
}

export const ClassHero: React.FC<ClassHeroProps> = ({ item, selectedSessionLabel }) => {
  const cover = item.cover_image_url || 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1400&q=80';

  return (
    <section className="rounded-2xl overflow-hidden border border-dark-800 bg-dark-900">
      <div className="relative h-72 md:h-80">
        <img src={cover} alt={item.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">{item.title}</h1>
          <p className="text-sm text-gray-200">{selectedSessionLabel}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] border bg-primary-500/15 text-primary-200 border-primary-500/30">
              {item.level || 'Todos los niveles'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] border bg-dark-800/70 text-dark-100 border-dark-600">
              {item.duration_min} min
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] border bg-dark-800/70 text-dark-100 border-dark-600">
              Capacidad {item.capacity}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] border bg-dark-800/70 text-dark-100 border-dark-600">
              Sala principal
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-5">
        <p className="text-sm text-dark-200 leading-relaxed">
          {item.description || 'Clase guiada para mejorar técnica, condición física y constancia en un entorno seguro y motivador.'}
        </p>
      </div>
    </section>
  );
};
