-- =====================================================
-- WORKOUT PAGE — DB CHANGES
-- Copiar y pegar en el SQL Editor de Supabase
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1.  Añadir peso total levantado por sesión
--     Necesario para:
--       - Historial: mostrar kg por sesión
--       - Estadísticas: sumar "Peso Total Levantado"
-- ─────────────────────────────────────────────────────
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS total_weight_kg NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN public.workout_sessions.total_weight_kg
  IS 'Peso total levantado en la sesión (suma de series × reps × kg por ejercicio)';


-- ─────────────────────────────────────────────────────
-- 2.  Nombre libre para sesiones sin plan asignado
--     Allows free workouts (no plan_session_id) to have a label
-- ─────────────────────────────────────────────────────
ALTER TABLE public.workout_sessions
  ADD COLUMN IF NOT EXISTS session_name TEXT DEFAULT NULL;

COMMENT ON COLUMN public.workout_sessions.session_name
  IS 'Nombre del entrenamiento cuando no hay plan_session_id vinculado';


-- ─────────────────────────────────────────────────────
-- 3.  Función auxiliar: obtener estadísticas del usuario
--     Usada en la sidebar derecha de la página de entrenamientos
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_workout_stats(p_user_id UUID)
RETURNS TABLE (
  total_sessions  BIGINT,
  total_weight_kg NUMERIC
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*)                       AS total_sessions,
    COALESCE(SUM(total_weight_kg), 0) AS total_weight_kg
  FROM public.workout_sessions
  WHERE user_id = p_user_id
    AND status   = 'completed';
$$;


-- ─────────────────────────────────────────────────────
-- 4.  Vista de historial enriquecido (opcional)
--     Facilita la query desde el frontend unificando
--     workout_sessions + weekly_workout_sessions + exercises
-- ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_workout_history AS
SELECT
  ws.id,
  ws.user_id,
  ws.workout_date,
  ws.actual_duration_min,
  ws.total_weight_kg,
  ws.session_name,
  COALESCE(ws.session_name, wws.name, 'Entrenamiento libre') AS display_name,
  COUNT(wwe.id)::INT                                          AS exercise_count
FROM public.workout_sessions ws
LEFT JOIN public.weekly_workout_sessions  wws ON ws.plan_session_id = wws.id
LEFT JOIN public.weekly_workout_exercises wwe ON wws.id = wwe.session_id
WHERE ws.status = 'completed'
GROUP BY ws.id, ws.user_id, ws.workout_date, ws.actual_duration_min,
         ws.total_weight_kg, ws.session_name, wws.name;

-- RLS on the view (inherited from base tables, but good to be explicit)
-- The view is read-only and filters user_id on the frontend via .eq('user_id', user.id)


-- ─────────────────────────────────────────────────────
-- 5.  Índice nuevo para consultas de calendario
--     Optimiza la query de días completados en un mes
-- ─────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_date_status
  ON public.workout_sessions (user_id, workout_date, status);


-- ─────────────────────────────────────────────────────
-- 6.  (Opcional) Datos de ejemplo — descomenta para usar
--     Inserta una sesión completada de prueba en tu cuenta
-- ─────────────────────────────────────────────────────
/*
INSERT INTO public.workout_sessions (
  user_id, workout_date, status,
  started_at, completed_at,
  estimated_duration_min, actual_duration_min,
  session_name, total_weight_kg
)
VALUES (
  auth.uid(),
  CURRENT_DATE - INTERVAL '2 days',
  'completed',
  NOW() - INTERVAL '2 days 1 hour',
  NOW() - INTERVAL '2 days',
  55, 52,
  'Pecho y Tríceps',
  3600
)
ON CONFLICT (user_id, workout_date) DO NOTHING;

INSERT INTO public.workout_sessions (
  user_id, workout_date, status,
  started_at, completed_at,
  estimated_duration_min, actual_duration_min,
  session_name, total_weight_kg
)
VALUES (
  auth.uid(),
  CURRENT_DATE - INTERVAL '4 days',
  'completed',
  NOW() - INTERVAL '4 days 1 hour',
  NOW() - INTERVAL '4 days',
  60, 58,
  'Piernas y Hombros',
  4280
)
ON CONFLICT (user_id, workout_date) DO NOTHING;

INSERT INTO public.workout_sessions (
  user_id, workout_date, status,
  started_at, completed_at,
  estimated_duration_min, actual_duration_min,
  session_name, total_weight_kg
)
VALUES (
  auth.uid(),
  CURRENT_DATE - INTERVAL '6 days',
  'completed',
  NOW() - INTERVAL '6 days 1 hour',
  NOW() - INTERVAL '6 days',
  45, 44,
  'Espalda y Bíceps',
  2900
)
ON CONFLICT (user_id, workout_date) DO NOTHING;
*/
