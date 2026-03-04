// ============================================================================
// AddFoodModal — Modal para registrar un alimento
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import type { AddNutritionEntryPayload, MealType } from '../types';
import { MEAL_LABELS, MEAL_TYPES } from '../types';

// ─── Icons ────────────────────────────────────────────────────────────────────

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ─── Controlled number input ──────────────────────────────────────────────────

interface NumInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  color?: string;
  required?: boolean;
}

const NumInput: React.FC<NumInputProps> = ({ label, value, onChange, color = 'text-dark-100', required }) => (
  <div className="flex flex-col gap-1">
    <label className={`text-xs font-semibold ${color}`}>{label}{required && ' *'}</label>
    <input
      type="number"
      min="0"
      step="0.1"
      value={value}
      onChange={e => onChange(e.target.value)}
      className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-dark-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
      placeholder="0"
    />
  </div>
);

// ─── Default payload ──────────────────────────────────────────────────────────

const EMPTY_FORM = {
  food_name:  '',
  grams:      '100',
  calories:   '',
  protein_g:  '',
  carbs_g:    '',
  fat_g:      '',
};

// ─── Component ───────────────────────────────────────────────────────────────

interface AddFoodModalProps {
  open: boolean;
  initialMealType?: MealType;
  onClose: () => void;
  onSubmit: (payload: AddNutritionEntryPayload) => Promise<void>;
}

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  open,
  initialMealType = 'desayuno',
  onClose,
  onSubmit,
}) => {
  const [form, setForm]              = useState(EMPTY_FORM);
  const [mealType, setMealType]      = useState<MealType>(initialMealType);
  const [loading, setLoading]        = useState(false);
  const [error, setError]            = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Sync initialMealType when prop changes
  useEffect(() => { setMealType(initialMealType); }, [initialMealType]);

  // Focus name input on open
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError(null);
      setTimeout(() => nameRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const set = (key: keyof typeof form) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.food_name.trim()) { setError('El nombre del alimento es obligatorio'); return; }
    if (!form.calories)          { setError('Las calorías son obligatorias'); return; }

    try {
      setLoading(true);
      await onSubmit({
        meal_type:  mealType,
        food_name:  form.food_name.trim(),
        grams:      parseFloat(form.grams)     || 0,
        calories:   parseFloat(form.calories)  || 0,
        protein_g:  parseFloat(form.protein_g) || 0,
        carbs_g:    parseFloat(form.carbs_g)   || 0,
        fat_g:      parseFloat(form.fat_g)     || 0,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el alimento');
    } finally {
      setLoading(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Panel */}
      <div className="w-full max-w-md bg-dark-900 border border-dark-700 rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-800">
          <h2 className="text-base font-bold text-dark-50">Registrar alimento</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-dark-500 hover:text-dark-200 hover:bg-dark-800 transition-all">
            <IconX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Meal type selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-dark-400">Comida *</label>
            <div className="grid grid-cols-4 gap-2">
              {MEAL_TYPES.map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMealType(m)}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                    mealType === m
                      ? 'bg-primary-500/15 border-primary-500/30 text-primary-400'
                      : 'bg-dark-800 border-dark-700 text-dark-400 hover:text-dark-200'
                  }`}
                >
                  {MEAL_LABELS[m]}
                </button>
              ))}
            </div>
          </div>

          {/* Food name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-dark-400">Alimento *</label>
            <input
              ref={nameRef}
              type="text"
              value={form.food_name}
              onChange={e => set('food_name')(e.target.value)}
              placeholder="Ej: Pechuga de pollo"
              className="bg-dark-800 border border-dark-700 rounded-xl px-3 py-2.5 text-sm text-dark-100 placeholder-dark-600 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
            />
          </div>

          {/* Numeric fields */}
          <div className="grid grid-cols-2 gap-3">
            <NumInput label="Gramos"     value={form.grams}     onChange={set('grams')} />
            <NumInput label="Calorías"   value={form.calories}  onChange={set('calories')}  color="text-orange-400"  required />
            <NumInput label="Proteínas"  value={form.protein_g} onChange={set('protein_g')} color="text-blue-400"    />
            <NumInput label="Carbohidratos" value={form.carbs_g} onChange={set('carbs_g')} color="text-emerald-400" />
          </div>
          <NumInput label="Grasas" value={form.fat_g} onChange={set('fat_g')} color="text-yellow-400" />

          {/* Error */}
          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-primary-500 hover:bg-primary-400 disabled:opacity-50 text-white text-sm font-bold transition-all shadow-lg shadow-primary-500/20"
          >
            {loading ? 'Guardando...' : 'Añadir alimento'}
          </button>
        </form>
      </div>
    </div>
  );
};
