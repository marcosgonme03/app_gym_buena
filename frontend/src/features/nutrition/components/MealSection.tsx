// ============================================================================
// MealSection — Lista de alimentos de una comida + botón añadir / eliminar
// ============================================================================

import React, { useState } from 'react';
import type { MealType, NutritionEntry, MealSummary } from '../types';
import { MEAL_LABELS } from '../types';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

// ─── Meal icon by type ───────────────────────────────────────────────────────

const MEAL_ICONS: Record<MealType, React.ReactNode> = {
  desayuno: <span className="text-lg">🌅</span>,
  almuerzo: <span className="text-lg">☀️</span>,
  cena:     <span className="text-lg">🌙</span>,
  snack:    <span className="text-lg">🍎</span>,
};

// ─── Empty state ─────────────────────────────────────────────────────────────

const EmptyMeal: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div
    onClick={onAdd}
    className="flex items-center gap-3 py-4 px-3 rounded-xl border border-dashed border-dark-700 hover:border-dark-600 cursor-pointer group transition-all"
  >
    <div className="w-8 h-8 rounded-lg bg-dark-800 border border-dark-700 flex items-center justify-center group-hover:bg-dark-700 transition-colors">
      <IconPlus />
    </div>
    <span className="text-sm text-dark-500 group-hover:text-dark-400 transition-colors">Añadir alimento...</span>
  </div>
);

// ─── Food row ────────────────────────────────────────────────────────────────

interface FoodRowProps {
  entry: NutritionEntry;
  onDelete: (id: string) => void;
  deleting: boolean;
}

const FoodRow: React.FC<FoodRowProps> = ({ entry, onDelete, deleting }) => (
  <div className="flex items-center gap-3 py-2.5 group">
    {/* name + grams */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-dark-100 truncate">{entry.food_name}</p>
      <p className="text-xs text-dark-500">{entry.grams}g</p>
    </div>
    {/* macros */}
    <div className="hidden sm:flex items-center gap-4 text-xs text-dark-400">
      <span className="text-orange-400">{Math.round(entry.calories)} kcal</span>
      <span className="text-blue-400">{entry.protein_g}g P</span>
      <span className="text-emerald-400">{entry.carbs_g}g C</span>
      <span className="text-yellow-400">{entry.fat_g}g G</span>
    </div>
    {/* mobile macros */}
    <div className="sm:hidden text-xs text-orange-400">{Math.round(entry.calories)} kcal</div>
    {/* delete */}
    <button
      onClick={() => onDelete(entry.id)}
      disabled={deleting}
      className="ml-2 p-1.5 rounded-lg text-dark-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-30"
      title="Eliminar"
    >
      <IconTrash />
    </button>
  </div>
);

// ─── Subtotal row ────────────────────────────────────────────────────────────

const SubtotalRow: React.FC<{ summary: MealSummary }> = ({ summary }) => {
  if (summary.item_count === 0) return null;
  return (
    <div className="flex items-center justify-between pt-2 border-t border-dark-800 mt-1">
      <span className="text-xs text-dark-500">{summary.item_count} alimento{summary.item_count !== 1 ? 's' : ''}</span>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-orange-400 font-semibold">{Math.round(summary.total_calories)} kcal</span>
        <span className="text-dark-500 hidden sm:block">{summary.total_protein_g}g P · {summary.total_carbs_g}g C · {summary.total_fat_g}g G</span>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

interface MealSectionProps {
  mealType: MealType;
  entries: NutritionEntry[];
  summary: MealSummary;
  onAddFood: (mealType: MealType) => void;
  onDeleteEntry: (id: string) => Promise<void>;
}

export const MealSection: React.FC<MealSectionProps> = ({
  mealType,
  entries,
  summary,
  onAddFood,
  onDeleteEntry,
}) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await onDeleteEntry(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {MEAL_ICONS[mealType]}
          <h3 className="text-sm font-bold text-dark-100 uppercase tracking-wide">
            {MEAL_LABELS[mealType]}
          </h3>
        </div>
        <button
          onClick={() => onAddFood(mealType)}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary-400 hover:text-primary-300 px-3 py-1.5 rounded-lg hover:bg-primary-500/10 transition-all"
        >
          <IconPlus />
          Añadir
        </button>
      </div>

      {/* Food list */}
      {entries.length === 0 ? (
        <EmptyMeal onAdd={() => onAddFood(mealType)} />
      ) : (
        <div className="divide-y divide-dark-800/50">
          {entries.map(entry => (
            <FoodRow
              key={entry.id}
              entry={entry}
              onDelete={handleDelete}
              deleting={deletingId === entry.id}
            />
          ))}
        </div>
      )}

      {/* Subtotal */}
      <SubtotalRow summary={summary} />
    </div>
  );
};
