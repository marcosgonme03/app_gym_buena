import React from 'react';
import type {
  AdvancedClassesFilters as AdvancedClassesFiltersValue,
  ClassKind,
  DurationBand,
  SortMode,
  TimeBand,
} from '@/features/classes/hooks/useClassesExtended';

interface AdvancedClassesFiltersProps {
  open: boolean;
  filters: AdvancedClassesFiltersValue;
  trainerOptions: string[];
  onChange: (next: AdvancedClassesFiltersValue) => void;
  onToggleOpen: () => void;
}

const timeOptions: Array<{ value: TimeBand; label: string }> = [
  { value: 'all', label: 'Todo el día' },
  { value: 'morning', label: 'Mañana' },
  { value: 'afternoon', label: 'Tarde' },
  { value: 'evening', label: 'Noche' },
];

const durationOptions: Array<{ value: DurationBand; label: string }> = [
  { value: 'all', label: 'Cualquiera' },
  { value: 'short', label: 'Corta (< 40 min)' },
  { value: 'medium', label: 'Media (40 - 60 min)' },
  { value: 'long', label: 'Larga (> 60 min)' },
];

const kindOptions: Array<{ value: ClassKind; label: string }> = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'strength', label: 'Fuerza' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'mobility', label: 'Movilidad' },
];

const sortOptions: Array<{ value: SortMode; label: string }> = [
  { value: 'popular', label: 'Más populares' },
  { value: 'closest', label: 'Más cercanas en horario' },
  { value: 'least_occupied', label: 'Menos ocupadas' },
  { value: 'recommended', label: 'Recomendadas' },
];

export const AdvancedClassesFilters: React.FC<AdvancedClassesFiltersProps> = ({
  open,
  filters,
  trainerOptions,
  onChange,
  onToggleOpen,
}) => {
  const panelId = 'advanced-classes-filters';

  return (
    <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-dark-100">Filtros avanzados</h3>
          <p className="text-xs text-dark-400">Personaliza horarios, tipo de clase y orden.</p>
        </div>

        <button
          onClick={onToggleOpen}
          aria-expanded={open}
          aria-controls={panelId}
          className="px-3 py-1.5 rounded-lg bg-dark-800 hover:bg-dark-700 text-dark-100 text-xs transition-all duration-200 hover:shadow-lg"
        >
          {open ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      {open && (
        <div id={panelId} className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="space-y-1">
            <span className="text-xs text-dark-300">Franja horaria</span>
            <select
              value={filters.timeBand}
              aria-label="Filtrar por franja horaria"
              onChange={(e) => onChange({ ...filters, timeBand: e.target.value as TimeBand })}
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs text-dark-300">Entrenador</span>
            <select
              value={filters.trainer}
              aria-label="Filtrar por entrenador"
              onChange={(e) => onChange({ ...filters, trainer: e.target.value })}
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
            >
              <option value="all">Todos</option>
              {trainerOptions.map((trainer) => (
                <option key={trainer} value={trainer}>{trainer}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs text-dark-300">Duración</span>
            <select
              value={filters.duration}
              aria-label="Filtrar por duración"
              onChange={(e) => onChange({ ...filters, duration: e.target.value as DurationBand })}
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
            >
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs text-dark-300">Tipo</span>
            <select
              value={filters.classKind}
              aria-label="Filtrar por tipo"
              onChange={(e) => onChange({ ...filters, classKind: e.target.value as ClassKind })}
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
            >
              {kindOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-xs text-dark-300">Ordenar por</span>
            <select
              value={filters.sortBy}
              aria-label="Ordenar clases"
              onChange={(e) => onChange({ ...filters, sortBy: e.target.value as SortMode })}
              className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </section>
  );
};
