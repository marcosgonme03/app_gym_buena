// ============================================================================
// WeeklyMealEditor — Edita los alimentos de UNA comida de UN día del plan
// ============================================================================

import React, { useState } from 'react';
import type {
  DietPlanItem,
  MealType,
  DayOfWeek,
  AddDietPlanItemPayload,
  UpdateDietPlanItemPayload,
} from '../types';
import { MEAL_LABELS, MEAL_ICONS } from '../types';
import {
  addDietPlanItem,
  updateDietPlanItem,
  deleteDietPlanItem,
} from '../services/nutritionService';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const IconPencil = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

// ─── Inline add form ──────────────────────────────────────────────────────────

interface AddFormState {
  food_name: string;
  grams: string;
  calories: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
}

const EMPTY_FORM: AddFormState = {
  food_name: '', grams: '100', calories: '', protein_g: '', carbs_g: '', fat_g: '',
};

// ─── Item row (view + inline edit) ───────────────────────────────────────────

interface PlanItemRowProps {
  item: DietPlanItem;
  onUpdated: (updated: DietPlanItem) => void;
  onDeleted: (id: string) => void;
}

const PlanItemRow: React.FC<PlanItemRowProps> = ({ item, onUpdated, onDeleted }) => {
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const [form, setForm] = useState<Partial<AddFormState>>({
    food_name: item.food_name,
    grams:     String(item.grams),
    calories:  String(item.calories),
    protein_g: String(item.protein_g),
    carbs_g:   String(item.carbs_g),
    fat_g:     String(item.fat_g),
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload: UpdateDietPlanItemPayload = {
        food_name: form.food_name?.trim() || item.food_name,
        grams:     parseFloat(form.grams  || '0'),
        calories:  parseFloat(form.calories  || '0'),
        protein_g: parseFloat(form.protein_g || '0'),
        carbs_g:   parseFloat(form.carbs_g   || '0'),
        fat_g:     parseFloat(form.fat_g     || '0'),
      };
      const updated = await updateDietPlanItem(item.id, payload);
      onUpdated(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteDietPlanItem(item.id);
      onDeleted(item.id);
    } finally {
      setDeleting(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-dark-800/60 rounded-xl p-2.5 space-y-2 border border-dark-700">
        <input
          className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-dark-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
          value={form.food_name || ''}
          onChange={e => setForm(f => ({ ...f, food_name: e.target.value }))}
          placeholder="Alimento"
        />
        {/* Fila 1: gramos + calorías */}
        <div className="grid grid-cols-2 gap-1.5">
          {(['grams', 'calories'] as const).map(k => (
            <div key={k}>
              <p className="text-[10px] text-dark-500 mb-0.5">{k === 'grams' ? 'Gramos (g)' : 'Calorías (kcal)'}</p>
              <input
                type="number" min="0" step="0.1" inputMode="decimal"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2 py-1.5 text-xs text-dark-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={form[k] || ''}
                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        {/* Fila 2: proteínas + carbos + grasas */}
        <div className="grid grid-cols-3 gap-1.5">
          {(['protein_g', 'carbs_g', 'fat_g'] as const).map(k => (
            <div key={k}>
              <p className="text-[10px] text-dark-500 mb-0.5">{k === 'protein_g' ? 'Proteína' : k === 'carbs_g' ? 'Carbos' : 'Grasas'}</p>
              <input
                type="number" min="0" step="0.1" inputMode="decimal"
                className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2 py-1.5 text-xs text-dark-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                value={form[k] || ''}
                onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="text-xs text-dark-500 hover:text-dark-300 px-2 py-1">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1 text-xs bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-lg px-2.5 py-1 hover:bg-emerald-500/25 disabled:opacity-50 transition-all"
          >
            <IconCheck />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group py-1">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-dark-200 truncate">{item.food_name}</p>
        <p className="text-[10px] text-dark-500">{item.grams}g · <span className="text-orange-400">{Math.round(item.calories)}kcal</span> · <span className="text-blue-400">{item.protein_g}P</span></p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded text-dark-500 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
          title="Editar"
        >
          <IconPencil />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="p-1 rounded text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-30"
          title="Eliminar"
        >
          <IconTrash />
        </button>
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────

interface WeeklyMealEditorProps {
  dayOfWeek: DayOfWeek;
  mealType: MealType;
  items: DietPlanItem[];
  onItemsChange: (dayOfWeek: DayOfWeek, mealType: MealType, items: DietPlanItem[]) => void;
}

export const WeeklyMealEditor: React.FC<WeeklyMealEditorProps> = ({
  dayOfWeek,
  mealType,
  items,
  onItemsChange,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState<AddFormState>(EMPTY_FORM);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const set = (k: keyof AddFormState) => (val: string) => setForm(f => ({ ...f, [k]: val }));

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.food_name.trim()) { setError('Nombre obligatorio'); return; }
    if (!form.calories)         { setError('Calorías obligatorias'); return; }
    setError(null);
    try {
      setSaving(true);
      const payload: AddDietPlanItemPayload = {
        day_of_week: dayOfWeek,
        meal_type:   mealType,
        food_name:   form.food_name.trim(),
        grams:       parseFloat(form.grams)     || 0,
        calories:    parseFloat(form.calories)  || 0,
        protein_g:   parseFloat(form.protein_g) || 0,
        carbs_g:     parseFloat(form.carbs_g)   || 0,
        fat_g:       parseFloat(form.fat_g)     || 0,
        order_index: items.length,
      };
      const newItem = await addDietPlanItem(payload);
      onItemsChange(dayOfWeek, mealType, [...items, newItem]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdated = (updated: DietPlanItem) => {
    onItemsChange(dayOfWeek, mealType, items.map(i => i.id === updated.id ? updated : i));
  };

  const handleDeleted = (id: string) => {
    onItemsChange(dayOfWeek, mealType, items.filter(i => i.id !== id));
  };

  const totalKcal = items.reduce((s, i) => s + i.calories, 0);

  return (
    <div className="space-y-1">
      {/* Meal header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm">{MEAL_ICONS[mealType]}</span>
          <span className="text-xs font-bold text-dark-300 uppercase tracking-wide">{MEAL_LABELS[mealType]}</span>
          {items.length > 0 && (
            <span className="text-[10px] text-orange-400 ml-1">{Math.round(totalKcal)}kcal</span>
          )}
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setError(null); }}
          className="p-1 rounded text-dark-600 hover:text-primary-400 hover:bg-primary-500/10 transition-all"
          title="Añadir alimento"
        >
          <IconPlus />
        </button>
      </div>

      {/* Item list */}
      {items.length === 0 && !showForm && (
        <p
          onClick={() => setShowForm(true)}
          className="text-[10px] text-dark-700 italic cursor-pointer hover:text-dark-500 transition-colors py-1"
        >
          Sin alimentos · click para añadir
        </p>
      )}
      <div className="divide-y divide-dark-800/50">
        {items.map(item => (
          <PlanItemRow
            key={item.id}
            item={item}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        ))}
      </div>

      {/* Inline add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-dark-800/50 rounded-xl p-2.5 space-y-2 border border-dark-700 mt-2">
          <input
            autoFocus
            className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2.5 py-1.5 text-xs text-dark-100 placeholder-dark-600 focus:outline-none focus:ring-1 focus:ring-primary-500"
            value={form.food_name}
            onChange={e => set('food_name')(e.target.value)}
            placeholder="Ej: Pechuga a la plancha"
          />
          {/* Fila 1: gramos + calorías */}
          <div className="grid grid-cols-2 gap-1.5">
            {(['grams', 'calories'] as const).map(k => (
              <div key={k}>
                <p className="text-[10px] text-dark-500 mb-0.5">{k === 'grams' ? 'Gramos (g)' : 'Calorías (kcal)'}</p>
                <input
                  type="number" min="0" step="0.1" inputMode="decimal"
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2 py-1.5 text-xs text-dark-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={form[k] || ''}
                  onChange={e => set(k)(e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          {/* Fila 2: proteínas + carbos + grasas */}
          <div className="grid grid-cols-3 gap-1.5">
            {(['protein_g', 'carbs_g', 'fat_g'] as const).map(k => (
              <div key={k}>
                <p className="text-[10px] text-dark-500 mb-0.5">{k === 'protein_g' ? 'Proteína' : k === 'carbs_g' ? 'Carbos' : 'Grasas'}</p>
                <input
                  type="number" min="0" step="0.1" inputMode="decimal"
                  className="w-full bg-dark-800 border border-dark-700 rounded-lg px-2 py-1.5 text-xs text-dark-100 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  value={form[k] || ''}
                  onChange={e => set(k)(e.target.value)}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          {error && <p className="text-[10px] text-red-400">{error}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => { setShowForm(false); setError(null); }} className="text-xs text-dark-500 hover:text-dark-300 px-2 py-1">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-xs bg-primary-500/15 text-primary-400 border border-primary-500/30 rounded-lg px-3 py-1 hover:bg-primary-500/25 disabled:opacity-50 transition-all"
            >
              {saving ? '...' : 'Añadir'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
