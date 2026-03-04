// ============================================================================
// SelectRoutineModal — Selección de rutina para crear sesión
// ============================================================================

import React, { useEffect, useState } from 'react';
import { getRoutines } from '../services/trainingService';
import type { Routine } from '../types';

const CAT_STYLES: Record<string, string> = {
  fuerza:      'bg-blue-500/10 text-blue-400 border-blue-500/20',
  hipertrofia: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  cardio:      'bg-red-500/10 text-red-400 border-red-500/20',
  general:     'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

interface SelectRoutineModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  onSelectRoutine: (routine: Routine) => void;
  onCreateFree:   () => void;
  title?:         string;
  subtitle?:      string;
}

export const SelectRoutineModal: React.FC<SelectRoutineModalProps> = ({
  isOpen, onClose, onSelectRoutine, onCreateFree,
  title = 'Seleccionar rutina',
  subtitle = 'Elige una rutina para esta sesión o crea un entrenamiento libre.',
}) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getRoutines()
      .then(setRoutines)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = routines.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-dark-800 flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-dark-50">{title}</h2>
            <p className="text-xs text-dark-500 mt-0.5">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-all duration-150 -mt-1 -mr-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-dark-800">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar rutina..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-dark-100 placeholder-dark-600 focus:outline-none focus:border-primary-500/50 transition-colors"
            />
          </div>
        </div>

        {/* Routine list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-dark-800 rounded-xl animate-pulse" />
            ))
          ) : filtered.length > 0 ? (
            filtered.map(routine => (
              <button
                key={routine.id}
                onClick={() => onSelectRoutine(routine)}
                className="w-full text-left bg-dark-800/50 hover:bg-dark-800 border border-dark-800 hover:border-dark-700 rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-150 group"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-100 group-hover:text-white truncate transition-colors">
                    {routine.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-1.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${CAT_STYLES[routine.category] ?? CAT_STYLES.general}`}>
                      {routine.category}
                    </span>
                    {routine.exercise_count !== undefined && (
                      <span className="text-[10px] text-dark-600">
                        {routine.exercise_count} ejercicio{routine.exercise_count !== 1 ? 's' : ''}
                      </span>
                    )}
                    {routine.estimated_duration_min && (
                      <span className="text-[10px] text-dark-600">~{routine.estimated_duration_min} min</span>
                    )}
                  </div>
                </div>
                <svg className="w-4 h-4 text-dark-600 group-hover:text-primary-400 transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))
          ) : (
            <div className="py-8 text-center">
              <p className="text-sm text-dark-400">
                {search ? `Sin resultados para "${search}"` : 'No tienes rutinas creadas'}
              </p>
              <p className="text-xs text-dark-600 mt-1">Crea tu primera rutina para empezar</p>
            </div>
          )}
        </div>

        {/* Free workout option */}
        <div className="px-4 pb-4 pt-2 border-t border-dark-800">
          <button
            onClick={onCreateFree}
            className="w-full py-3 rounded-xl border border-dashed border-dark-700 hover:border-dark-600 text-sm font-medium text-dark-500 hover:text-dark-300 hover:bg-dark-800/50 transition-all duration-150"
          >
            + Entrenamiento libre (sin rutina)
          </button>
        </div>
      </div>
    </div>
  );
};
