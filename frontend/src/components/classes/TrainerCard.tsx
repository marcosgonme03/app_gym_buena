import React from 'react';

interface TrainerCardProps {
  name: string;
  avatarUrl?: string | null;
  specialty?: string | null;
  classesCount?: number;
  rating?: number | null;
  onViewProfile?: () => void;
}

export const TrainerCard: React.FC<TrainerCardProps> = ({
  name,
  avatarUrl,
  specialty,
  classesCount,
  rating,
  onViewProfile,
}) => {
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
        <div className="space-y-1">
          <p className="text-sm text-dark-200">Entrenador especializado para guiar tu progreso de forma segura.</p>
          <p className="text-xs text-dark-400">Especialidad: {specialty || 'Entrenamiento funcional'}</p>
          <p className="text-xs text-dark-400">Clases impartidas: {classesCount ?? 0}</p>
          <p className="text-xs text-dark-400">Rating: {rating ? `${rating.toFixed(1)} / 5` : 'Sin valoraciones'}</p>
        </div>
      </div>
      {onViewProfile && (
        <button
          onClick={onViewProfile}
          className="mt-3 w-full px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-sm transition-colors"
          aria-label="Ver perfil del entrenador"
        >
          Ver perfil entrenador
        </button>
      )}
    </section>
  );
};
