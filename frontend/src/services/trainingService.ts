/**
 * src/services/trainingService.ts
 *
 * Re-exporta el servicio centralizado de entrenamientos.
 * La implementación completa vive en:
 *   src/features/training/services/trainingService.ts
 *
 * Importa desde aquí para mantener rutas cortas en toda la app:
 *   import { getWorkoutStats, createFreeSession } from '@/services/trainingService';
 */

export {
  // ── Rutinas ────────────────────────────────────────────────────────────────
  getRoutines,
  getRoutineWithExercises,
  createRoutine,
  deleteRoutine,

  // ── Plan semanal ───────────────────────────────────────────────────────────
  getWeeklyPlan,
  upsertWeeklyPlanDay,
  removeWeeklyPlanDay,

  // ── Crear sesiones ─────────────────────────────────────────────────────────
  createSessionFromTodayPlan,
  createSessionWithRoutine,
  createFreeSession,
  repeatSession,

  // ── Leer sesiones ─────────────────────────────────────────────────────────
  getActiveSession,
  getSessionWithExercises,
  getMonthSessions,
  getDaySessions,

  // ── Actualizar sesiones ────────────────────────────────────────────────────
  startSession,
  completeSession,
  updateSessionExercise,

  // ── Historial y estadísticas ───────────────────────────────────────────────
  getWorkoutHistory,
  getWorkoutStats,
} from '@/features/training/services/trainingService';
