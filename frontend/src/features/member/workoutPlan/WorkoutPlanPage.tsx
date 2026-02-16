import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/layout/BottomNav';
import { getWeeklyPlanFull, upsertPlanMeta, createSession, deleteSession, createExercise, reorderExercises } from './api';
import { getWeekStart, getWeekEnd, addWeeks, formatWeekRange, getDayName, formatShortDate, getWeekDays, isDateInWeek } from './weekHelpers';
import type { WeeklyPlanFullDTO } from './types';
import { ExerciseItem } from './components/ExerciseItem';
import type { ClassesFilters, SessionWithAvailability } from '@/features/classes/types';
import { useClassesWeek } from '@/features/classes/hooks/useClassesWeek';
import { useMyBookings } from '@/features/classes/hooks/useMyBookings';
import { useBookClass } from '@/features/classes/hooks/useBookClass';
import { useCancelBooking } from '@/features/classes/hooks/useCancelBooking';
import { MyBookedClassesStrip } from '@/features/classes/components/MyBookedClassesStrip';
import { ReserveClassSection } from '@/features/classes/components/ReserveClassSection';
import { ClassDetailsModal } from '@/features/classes/components/ClassDetailsModal';

const defaultClassesFilters: ClassesFilters = {
  search: '',
  level: 'all',
  trainerUserId: 'all',
  day: 'all',
  onlyAvailable: false,
};

export const WorkoutPlanPage: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const initialWeek = searchParams.get('week') || getWeekStart();
  const [weekStart, setWeekStart] = useState(initialWeek);
  const [classesWeekStart, setClassesWeekStart] = useState(getWeekStart());
  const [planData, setPlanData] = useState<WeeklyPlanFullDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{message: string; type: 'success'|'error'} | null>(null);
  const [classesFilters, setClassesFilters] = useState<ClassesFilters>(defaultClassesFilters);
  const [selectedClassSession, setSelectedClassSession] = useState<SessionWithAvailability | null>(null);

  // Estados para modals/forms
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaForm, setMetaForm] = useState({title: '', notes: ''});
  const [showNewSession, setShowNewSession] = useState(false);
  const [sessionForm, setSessionForm] = useState({date: '', name: '', notes: ''});
  const [addingExerciseTo, setAddingExerciseTo] = useState<string | null>(null);
  const [exerciseForm, setExerciseForm] = useState({
    exercise_name: '',
    sets: 3,
    reps: 10,
    rest_seconds: 60,
    notes: ''
  });

  const classesWeekEnd = getWeekEnd(classesWeekStart);

  const {
    data: classesSessions,
    trainers,
    loading: classesLoading,
    error: classesError,
    refresh: refreshClasses,
  } = useClassesWeek(classesWeekStart, classesWeekEnd, classesFilters);

  const {
    data: myBookings,
    loading: bookingsLoading,
    error: bookingsError,
    refresh: refreshBookings,
  } = useMyBookings();

  const { mutate: reserveClass, loading: reservingClass } = useBookClass();
  const { mutate: cancelClassBooking, loading: cancellingClass } = useCancelBooking();

  useEffect(() => {
    loadPlan();
  }, [weekStart]);

  useEffect(() => {
    if (planData) {
      setMetaForm({
        title: planData.plan.title || '',
        notes: planData.plan.notes || ''
      });
    }
  }, [planData]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const data = await getWeeklyPlanFull(weekStart);
      setPlanData(data);
    } catch (error: any) {
      showToast(error.message || 'Error al cargar plan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success'|'error') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveMeta = async () => {
    if (!planData) return;
    try {
      setSaving(true);
      await upsertPlanMeta(planData.plan.id, metaForm);
      await loadPlan();
      setEditingMeta(false);
      showToast('Plan actualizado', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateSession = async () => {
    if (!planData || !sessionForm.date || !sessionForm.name) {
      showToast('Completa los campos requeridos', 'error');
      return;
    }

    if (!isDateInWeek(sessionForm.date, weekStart)) {
      showToast('La fecha debe estar dentro de esta semana', 'error');
      return;
    }

    try {
      setSaving(true);
      const orderIndex = planData.sessions.length;
      await createSession({
        plan_id: planData.plan.id,
        session_date: sessionForm.date,
        name: sessionForm.name,
        notes: sessionForm.notes || null,
        order_index: orderIndex
      });
      await loadPlan();
      setShowNewSession(false);
      setSessionForm({date: '', name: '', notes: ''});
      showToast('Sesión creada', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('¿Eliminar esta sesión y todos sus ejercicios?')) return;
    try {
      await deleteSession(sessionId);
      await loadPlan();
      showToast('Sesión eliminada', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleAddExercise = async (sessionId: string) => {
    if (!exerciseForm.exercise_name.trim()) {
      showToast('Ingresa el nombre del ejercicio', 'error');
      return;
    }

    try {
      setSaving(true);
      const session = planData?.sessions.find(s => s.id === sessionId);
      const orderIndex = session?.exercises.length || 0;
      
      await createExercise({
        session_id: sessionId,
        ...exerciseForm,
        order_index: orderIndex
      });
      
      await loadPlan();
      setAddingExerciseTo(null);
      setExerciseForm({exercise_name: '', sets: 3, reps: 10, rest_seconds: 60, notes: ''});
      showToast('Ejercicio añadido', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleMoveExercise = async (sessionId: string, exerciseId: string, direction: 'up'|'down') => {
    const session = planData?.sessions.find(s => s.id === sessionId);
    if (!session) return;

    const currentIndex = session.exercises.findIndex(e => e.id === exerciseId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= session.exercises.length) return;

    const reordered = [...session.exercises];
    [reordered[currentIndex], reordered[newIndex]] = [reordered[newIndex], reordered[currentIndex]];

    try {
      await reorderExercises(sessionId, reordered.map((ex, idx) => ({id: ex.id, order_index: idx})));
      await loadPlan();
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleReserveClass = async (session: SessionWithAvailability) => {
    try {
      await reserveClass(session.id);
      showToast('Reserva confirmada', 'success');
      await Promise.all([refreshClasses(), refreshBookings()]);
    } catch (error: any) {
      showToast(error.message || 'No se pudo reservar la clase', 'error');
    }
  };

  const handleCancelClass = async (session: SessionWithAvailability) => {
    try {
      await cancelClassBooking(session.id);
      showToast('Reserva cancelada', 'success');
      await Promise.all([refreshClasses(), refreshBookings()]);
    } catch (error: any) {
      showToast(error.message || 'No se pudo cancelar la reserva', 'error');
    }
  };

  const handleCancelClassBySessionId = async (sessionId: string) => {
    try {
      await cancelClassBooking(sessionId);
      showToast('Reserva cancelada', 'success');
      await Promise.all([refreshClasses(), refreshBookings()]);
    } catch (error: any) {
      showToast(error.message || 'No se pudo cancelar la reserva', 'error');
    }
  };

  if (!profile || profile.role !== 'member') {
    navigate('/app');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 dark:bg-dark-950 light:bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-400">Cargando planificación...</p>
        </div>
      </div>
    );
  }

  const weekDays = getWeekDays(weekStart);

  return (
    <div className="min-h-screen bg-dark-950 dark:bg-dark-950 light:bg-gray-50 pb-20">
      <BottomNav />

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500/20 border border-green-500/30 text-green-400' : 'bg-red-500/20 border border-red-500/30 text-red-400'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Header */}
      <header className="bg-gradient-to-br from-dark-900 to-dark-950 border-b border-dark-800/50 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/app')}
              className="flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Volver al dashboard</span>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-dark-50">Planificación Semanal</h1>
          </div>

          {/* Navegación semanas */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekStart(prev => addWeeks(prev, -1))}
              className="px-3 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors text-sm"
            >
              ← Anterior
            </button>
            <div className="text-center">
              <p className="text-base font-semibold text-dark-100">{formatWeekRange(weekStart)}</p>
            </div>
            <button
              onClick={() => setWeekStart(prev => addWeeks(prev, 1))}
              className="px-3 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors text-sm"
            >
              Siguiente →
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto space-y-6">
        <MyBookedClassesStrip
          bookings={myBookings}
          loading={bookingsLoading}
          error={bookingsError}
          onRetry={refreshBookings}
          onCancel={handleCancelClassBySessionId}
        />

        <ReserveClassSection
          weekStart={classesWeekStart}
          sessions={classesSessions}
          trainers={trainers}
          filters={classesFilters}
          loading={classesLoading}
          error={classesError}
          actionLoading={reservingClass || cancellingClass}
          onWeekChange={setClassesWeekStart}
          onFiltersChange={setClassesFilters}
          onRetry={refreshClasses}
          onBook={handleReserveClass}
          onCancel={handleCancelClass}
          onDetails={setSelectedClassSession}
        />

        {/* Meta del plan */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 sm:p-6">
          {!editingMeta ? (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-dark-50">Información de la semana</h2>
                <button
                  onClick={() => setEditingMeta(true)}
                  className="text-primary-400 hover:text-primary-300 text-sm font-medium"
                >
                  Editar
                </button>
              </div>
              {planData?.plan.title || planData?.plan.notes ? (
                <>
                  {planData.plan.title && (
                    <h3 className="text-base font-medium text-dark-100 mb-2">{planData.plan.title}</h3>
                  )}
                  {planData.plan.notes && (
                    <p className="text-sm text-dark-400">{planData.plan.notes}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-dark-500">Sin título ni notas. Haz clic en "Editar" para añadir.</p>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold text-dark-50 mb-3">Editar información</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Título (opcional)</label>
                  <input
                    type="text"
                    value={metaForm.title}
                    onChange={e => setMetaForm({...metaForm, title: e.target.value})}
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 focus:border-primary-500 focus:outline-none"
                    placeholder="Semana de fuerza"
                  />
                </div>
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Notas (opcional)</label>
                  <textarea
                    value={metaForm.notes}
                    onChange={e => setMetaForm({...metaForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-dark-100 focus:border-primary-500 focus:outline-none"
                    placeholder="Observaciones generales de la semana..."
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveMeta}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditingMeta(false)}
                    className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 font-medium rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sesiones */}
        <div className="bg-dark-900 border border-dark-800 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-dark-50">Sesiones de entrenamiento</h2>
            <button
              onClick={() => setShowNewSession(true)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Añadir sesión
            </button>
          </div>

          {/* Formulario nueva sesión */}
          {showNewSession && (
            <div className="mb-4 p-4 bg-dark-800 border border-primary-500/30 rounded-lg">
              <h3 className="text-sm font-medium text-dark-100 mb-3">Nueva sesión</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Fecha *</label>
                  <select
                    value={sessionForm.date}
                    onChange={e => setSessionForm({...sessionForm, date: e.target.value})}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Seleccionar día</option>
                    {weekDays.map(day => (
                      <option key={day} value={day}>
                        {getDayName(day)}, {formatShortDate(day)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-dark-400 mb-1">Nombre *</label>
                  <input
                    type="text"
                    value={sessionForm.name}
                    onChange={e => setSessionForm({...sessionForm, name: e.target.value})}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
                    placeholder="Tren superior"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-dark-400 mb-1">Notas</label>
                  <input
                    type="text"
                    value={sessionForm.notes}
                    onChange={e => setSessionForm({...sessionForm, notes: e.target.value})}
                    className="w-full px-3 py-2 bg-dark-900 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleCreateSession}
                  disabled={saving || !sessionForm.date || !sessionForm.name}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creando...' : 'Crear sesión'}
                </button>
                <button
                  onClick={() => {
                    setShowNewSession(false);
                    setSessionForm({date: '', name: '', notes: ''});
                  }}
                  className="px-4 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Lista de sesiones */}
          {planData && planData.sessions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-dark-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-dark-400 mb-4">No hay sesiones programadas para esta semana</p>
              <button
                onClick={() => setShowNewSession(true)}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Crear primera sesión
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {planData?.sessions.map(session => (
                <div key={session.id} className="p-4 bg-dark-800/50 border border-dark-700 rounded-lg">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-medium text-dark-100">{session.name}</h3>
                      <p className="text-xs text-dark-500 mt-0.5">
                        {getDayName(session.session_date)}, {formatShortDate(session.session_date)}
                      </p>
                      {session.notes && (
                        <p className="text-xs text-dark-400 mt-1">{session.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteSession(session.id)}
                      className="p-1.5 hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Eliminar sesión"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  {/* Ejercicios */}
                  <div className="space-y-2">
                    {session.exercises.map((exercise, idx) => (
                      <ExerciseItem
                        key={exercise.id}
                        exercise={exercise}
                        onUpdate={loadPlan}
                        onMoveUp={() => handleMoveExercise(session.id, exercise.id, 'up')}
                        onMoveDown={() => handleMoveExercise(session.id, exercise.id, 'down')}
                        canMoveUp={idx > 0}
                        canMoveDown={idx < session.exercises.length - 1}
                      />
                    ))}
                  </div>

                  {/* Añadir ejercicio */}
                  {addingExerciseTo === session.id ? (
                    <div className="mt-3 p-3 bg-dark-900 border border-primary-500/30 rounded-lg">
                      <h4 className="text-sm font-medium text-dark-100 mb-3">Nuevo ejercicio</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                        <div className="col-span-2">
                          <input
                            type="text"
                            value={exerciseForm.exercise_name}
                            onChange={e => setExerciseForm({...exerciseForm, exercise_name: e.target.value})}
                            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
                            placeholder="Nombre del ejercicio"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={exerciseForm.sets}
                            onChange={e => setExerciseForm({...exerciseForm, sets: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
                            placeholder="Series"
                          />
                        </div>
                        <div>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={exerciseForm.reps}
                            onChange={e => setExerciseForm({...exerciseForm, reps: parseInt(e.target.value)})}
                            className="w-full px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg text-sm text-dark-100 focus:border-primary-500 focus:outline-none"
                            placeholder="Reps"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddExercise(session.id)}
                          disabled={saving || !exerciseForm.exercise_name.trim()}
                          className="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          {saving ? 'Añadiendo...' : 'Añadir'}
                        </button>
                        <button
                          onClick={() => setAddingExerciseTo(null)}
                          className="px-3 py-2 bg-dark-700 hover:bg-dark-600 text-dark-200 text-sm font-medium rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingExerciseTo(session.id)}
                      className="w-full mt-3 py-2 border-2 border-dashed border-dark-700 hover:border-primary-500/50 hover:bg-dark-800 rounded-lg text-sm text-dark-400 hover:text-primary-400 transition-colors"
                    >
                      + Añadir ejercicio
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <ClassDetailsModal session={selectedClassSession} onClose={() => setSelectedClassSession(null)} />
      </main>
    </div>
  );
};
