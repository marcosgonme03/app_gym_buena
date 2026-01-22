import React, { useState } from 'react';
import type { WeeklyWorkoutExercise } from '../types';
import { updateExercise, deleteExercise } from '../api';

interface ExerciseItemProps {
  exercise: WeeklyWorkoutExercise;
  onUpdate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export const ExerciseItem: React.FC<ExerciseItemProps> = ({
  exercise,
  onUpdate,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    exercise_name: exercise.exercise_name,
    sets: exercise.sets,
    reps: exercise.reps,
    rest_seconds: exercise.rest_seconds || 0,
    notes: exercise.notes || ''
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateExercise(exercise.id, formData);
      setIsEditing(false);
      onUpdate();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar este ejercicio?')) return;
    
    try {
      setDeleting(true);
      await deleteExercise(exercise.id);
      onUpdate();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="p-3 sm:p-4 bg-dark-800/50 border border-primary-500/30 rounded-lg">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-3">
          <div className="col-span-2">
            <label className="block text-xs text-dark-400 mb-1">Ejercicio</label>
            <input
              type="text"
              value={formData.exercise_name}
              onChange={e => setFormData({...formData, exercise_name: e.target.value})}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
              placeholder="Press banca"
            />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">Series</label>
            <input
              type="number"
              min="1"
              max="20"
              value={formData.sets}
              onChange={e => setFormData({...formData, sets: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-dark-400 mb-1">Reps</label>
            <input
              type="number"
              min="1"
              max="50"
              value={formData.reps}
              onChange={e => setFormData({...formData, reps: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs text-dark-400 mb-1">Descanso (seg)</label>
            <input
              type="number"
              min="0"
              max="600"
              value={formData.rest_seconds}
              onChange={e => setFormData({...formData, rest_seconds: parseInt(e.target.value)})}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
            />
          </div>
          <div className="col-span-2 sm:col-span-3">
            <label className="block text-xs text-dark-400 mb-1">Notas</label>
            <input
              type="text"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
              placeholder="Opcional"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !formData.exercise_name.trim()}
            className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 bg-dark-800/30 border border-dark-700/50 rounded-lg hover:border-dark-600 transition-colors group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-dark-100 dark:text-dark-100 light:text-gray-900">
            {exercise.exercise_name}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-dark-400">
              {exercise.sets} × {exercise.reps}
            </span>
            {exercise.rest_seconds && exercise.rest_seconds > 0 && (
              <>
                <span className="text-dark-700">•</span>
                <span className="text-xs text-dark-400">
                  {exercise.rest_seconds}s descanso
                </span>
              </>
            )}
          </div>
          {exercise.notes && (
            <p className="text-xs text-dark-500 mt-1 italic">
              {exercise.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Reordenar */}
          <div className="flex flex-col">
            <button
              onClick={onMoveUp}
              disabled={!canMoveUp}
              className="p-1 hover:bg-dark-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Subir"
            >
              <svg className="w-3 h-3 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={onMoveDown}
              disabled={!canMoveDown}
              className="p-1 hover:bg-dark-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
              title="Bajar"
            >
              <svg className="w-3 h-3 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Editar */}
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 hover:bg-dark-700 rounded-lg transition-colors"
            title="Editar"
          >
            <svg className="w-4 h-4 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Eliminar */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 hover:bg-red-900/20 rounded-lg transition-colors"
            title="Eliminar"
          >
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
