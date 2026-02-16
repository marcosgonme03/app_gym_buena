import React, { useState } from 'react';
import type { ClassesFilters } from '@/features/classes/types';

interface FiltersBarProps {
  filters: ClassesFilters;
  trainers: Array<{ user_id: string; name: string; last_name: string }>;
  onChange: (next: ClassesFilters) => void;
}

const days = [
  { value: 'all', label: 'Todos los días' },
  { value: '1', label: 'Lunes' },
  { value: '2', label: 'Martes' },
  { value: '3', label: 'Miércoles' },
  { value: '4', label: 'Jueves' },
  { value: '5', label: 'Viernes' },
  { value: '6', label: 'Sábado' },
  { value: '0', label: 'Domingo' },
];

export const FiltersBar: React.FC<FiltersBarProps> = ({ filters, trainers, onChange }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const panel = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      <input
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        placeholder="Buscar clase..."
        className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
      />

      <select
        value={filters.level}
        onChange={(e) => onChange({ ...filters, level: e.target.value as ClassesFilters['level'] })}
        className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
      >
        <option value="all">Todos los niveles</option>
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>

      <select
        value={filters.trainerUserId}
        onChange={(e) => onChange({ ...filters, trainerUserId: e.target.value })}
        className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
      >
        <option value="all">Todos los entrenadores</option>
        {trainers.map((trainer) => (
          <option key={trainer.user_id} value={trainer.user_id}>
            {trainer.name} {trainer.last_name}
          </option>
        ))}
      </select>

      <select
        value={filters.day}
        onChange={(e) => onChange({ ...filters, day: e.target.value as ClassesFilters['day'] })}
        className="w-full rounded-lg bg-dark-800 border border-dark-700 text-dark-100 px-3 py-2 text-sm"
      >
        {days.map((day) => (
          <option key={day.value} value={day.value}>{day.label}</option>
        ))}
      </select>

      <label className="inline-flex items-center gap-2 text-sm text-dark-200 px-3 py-2 rounded-lg bg-dark-800 border border-dark-700">
        <input
          type="checkbox"
          checked={filters.onlyAvailable}
          onChange={(e) => onChange({ ...filters, onlyAvailable: e.target.checked })}
        />
        Solo con plazas
      </label>
    </div>
  );

  return (
    <section className="bg-dark-900 border border-dark-800 rounded-xl p-4">
      <div className="flex items-center justify-between md:hidden mb-3">
        <h3 className="text-sm font-semibold text-dark-100">Filtros</h3>
        <button
          onClick={() => setMobileOpen((prev) => !prev)}
          className="text-sm text-primary-300"
        >
          {mobileOpen ? 'Ocultar' : 'Mostrar'}
        </button>
      </div>

      <div className="hidden md:block">{panel}</div>
      {mobileOpen && <div className="md:hidden">{panel}</div>}
    </section>
  );
};
