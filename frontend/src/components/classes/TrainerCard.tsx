import React from 'react';

interface TrainerCardProps {
  name: string;
  avatarUrl?: string | null;
}

export const TrainerCard: React.FC<TrainerCardProps> = ({ name, avatarUrl }) => {
  return (
    <section className="rounded-xl border border-dark-800 bg-dark-900 p-4">
      <h3 className="text-sm font-semibold text-dark-100 mb-3">Con {name}</h3>
      <div className="flex items-center gap-3">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} className="w-12 h-12 rounded-full object-cover border border-dark-700" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-dark-700 border border-dark-600 flex items-center justify-center text-dark-200 font-semibold">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
        <p className="text-sm text-dark-300">Entrenador especializado para guiar tu progreso de forma segura.</p>
      </div>
    </section>
  );
};
