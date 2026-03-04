-- ============================================================
-- Admin Views Migration v2
-- SCRIPT CORREGIDO para esquema real (tabla: users, no user_profiles)
-- Ejecutar en Supabase SQL Editor con rol postgres
-- ============================================================

-- ── 1. View: estadísticas por usuario ────────────────────────
--    FIX: user_profiles → users
DROP VIEW IF EXISTS v_admin_user_stats CASCADE;
CREATE VIEW v_admin_user_stats AS
SELECT
  u.user_id,
  u.name,
  u.last_name,
  u.email,
  u.avatar_url,
  u.role,
  u.created_at,
  COALESCE(ws.total_sessions,     0) AS workout_count,
  COALESCE(ws.completed_sessions, 0) AS completed_sessions,
  COALESCE(ws.total_weight_kg,    0) AS total_weight_kg
FROM users u
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*)                                          AS total_sessions,
    COUNT(*) FILTER (WHERE status = 'completed')      AS completed_sessions,
    COALESCE(SUM(total_weight_kg), 0)                 AS total_weight_kg
  FROM workout_sessions
  GROUP BY user_id
) ws ON ws.user_id = u.user_id;

GRANT SELECT ON v_admin_user_stats TO authenticated;

-- ── 2. View: estadísticas de nutrición por usuario ───────────
--    FIX: user_profiles → users
DROP VIEW IF EXISTS v_admin_nutrition_stats CASCADE;
CREATE VIEW v_admin_nutrition_stats AS
SELECT
  u.user_id,
  u.name,
  u.last_name,
  u.email,
  COALESCE(n.total_entries,  0) AS total_entries,
  COALESCE(n.total_calories, 0) AS total_calories,
  COALESCE(n.total_protein,  0) AS total_protein_g,
  COALESCE(n.total_carbs,    0) AS total_carbs_g,
  COALESCE(n.total_fat,      0) AS total_fat_g
FROM users u
LEFT JOIN (
  SELECT
    user_id,
    COUNT(*)       AS total_entries,
    SUM(calories)  AS total_calories,
    SUM(protein_g) AS total_protein,
    SUM(carbs_g)   AS total_carbs,
    SUM(fat_g)     AS total_fat
  FROM nutrition_entries
  GROUP BY user_id
) n ON n.user_id = u.user_id;

GRANT SELECT ON v_admin_nutrition_stats TO authenticated;

-- ── 3. RPC: estadísticas globales de la plataforma ───────────
--    FIX: user_profiles → users  |  user_id = auth.uid() correcto
DROP FUNCTION IF EXISTS get_admin_platform_stats();
CREATE OR REPLACE FUNCTION get_admin_platform_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role   TEXT;
  v_result JSON;
BEGIN
  SELECT role INTO v_role
  FROM users
  WHERE user_id = auth.uid();

  IF v_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Acceso denegado: se requiere rol admin';
  END IF;

  SELECT json_build_object(
    'total_users',             (SELECT COUNT(*) FROM users),
    'active_users',            (SELECT COUNT(DISTINCT user_id) FROM workout_sessions),
    'total_workout_sessions',  (SELECT COUNT(*) FROM workout_sessions),
    'completed_sessions',      (SELECT COUNT(*) FROM workout_sessions WHERE status = 'completed'),
    'total_nutrition_entries', (SELECT COUNT(*) FROM nutrition_entries),
    'new_users_this_week',     (
      SELECT COUNT(*) FROM users
      WHERE created_at >= date_trunc('week', NOW())
    ),
    'new_users_last_week',     (
      SELECT COUNT(*) FROM users
      WHERE created_at >= date_trunc('week', NOW()) - INTERVAL '7 days'
        AND created_at  < date_trunc('week', NOW())
    ),
    'avg_workouts_per_user',   (
      SELECT ROUND(
        CASE WHEN COUNT(DISTINCT u.user_id) = 0 THEN 0
             ELSE COUNT(ws.id)::NUMERIC / COUNT(DISTINCT u.user_id)
        END, 2
      )
      FROM users u
      LEFT JOIN workout_sessions ws ON ws.user_id = u.user_id
    ),
    'total_weight_kg',         (SELECT COALESCE(SUM(total_weight_kg), 0) FROM workout_sessions)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_platform_stats() TO authenticated;

-- ── 4. View: sesiones agrupadas por categoría ────────────────
--    (sin cambios, no usa user_profiles)
DROP VIEW IF EXISTS v_admin_workout_stats CASCADE;
CREATE VIEW v_admin_workout_stats AS
SELECT
  ws.category,
  COUNT(*)                                                  AS total_sessions,
  COUNT(*) FILTER (WHERE ws.status = 'completed')           AS completed_sessions,
  COALESCE(AVG(ws.actual_duration_min), 0)                  AS avg_duration_min,
  COALESCE(SUM(ws.total_weight_kg), 0)                      AS total_weight_kg
FROM workout_sessions ws
GROUP BY ws.category;

GRANT SELECT ON v_admin_workout_stats TO authenticated;

-- ── 5. View: actividad diaria (sesiones + registros nutricionales) ──
--    (sin cambios, no usa user_profiles)
DROP VIEW IF EXISTS v_admin_daily_activity CASCADE;
CREATE VIEW v_admin_daily_activity AS
SELECT
  day::date                   AS activity_date,
  COALESCE(ws.sessions,  0)   AS sessions,
  COALESCE(ne.nutrition, 0)   AS nutrition_entries
FROM generate_series(
  (NOW() - INTERVAL '14 days')::date,
  NOW()::date,
  INTERVAL '1 day'
) AS day
LEFT JOIN (
  SELECT workout_date AS d, COUNT(*) AS sessions
  FROM workout_sessions
  WHERE workout_date >= (NOW() - INTERVAL '14 days')::date
  GROUP BY d
) ws ON ws.d = day::date
LEFT JOIN (
  SELECT entry_date AS d, COUNT(*) AS nutrition
  FROM nutrition_entries
  WHERE entry_date >= (NOW() - INTERVAL '14 days')::date
  GROUP BY d
) ne ON ne.d = day::date
ORDER BY activity_date;

GRANT SELECT ON v_admin_daily_activity TO authenticated;

-- ── 6. View: retención de usuarios (7 / 14 / 30 días) ───────
--    (sin cambios, no usa user_profiles)
DROP VIEW IF EXISTS v_admin_user_retention CASCADE;
CREATE VIEW v_admin_user_retention AS
WITH first_session AS (
  SELECT user_id, MIN(workout_date) AS first_date
  FROM workout_sessions
  GROUP BY user_id
),
cohort AS (
  SELECT
    fs.user_id,
    fs.first_date,
    MAX(CASE WHEN ws.workout_date >= fs.first_date + INTERVAL '7 days'  THEN 1 ELSE 0 END) AS returned_7d,
    MAX(CASE WHEN ws.workout_date >= fs.first_date + INTERVAL '14 days' THEN 1 ELSE 0 END) AS returned_14d,
    MAX(CASE WHEN ws.workout_date >= fs.first_date + INTERVAL '30 days' THEN 1 ELSE 0 END) AS returned_30d
  FROM first_session fs
  JOIN workout_sessions ws USING (user_id)
  GROUP BY fs.user_id, fs.first_date
)
SELECT
  COUNT(*)                             AS total_users,
  ROUND(AVG(returned_7d)  * 100, 1)   AS retention_7d_pct,
  ROUND(AVG(returned_14d) * 100, 1)   AS retention_14d_pct,
  ROUND(AVG(returned_30d) * 100, 1)   AS retention_30d_pct
FROM cohort;

GRANT SELECT ON v_admin_user_retention TO authenticated;

-- ── 7. View: popularidad de ejercicios ───────────────────────
--    FIX: session_exercise_items no existe → usar session_exercises
--    FIX: exercises no tiene exercise_id FK en session_exercises → agrupar por exercise_name
--    FIX: exercises.muscle_group / exercises.category no existen en esa tabla
DROP VIEW IF EXISTS v_admin_exercise_popularity CASCADE;
CREATE VIEW v_admin_exercise_popularity AS
SELECT
  se.exercise_name,
  COUNT(se.id)                AS total_uses,
  COUNT(DISTINCT se.user_id)  AS unique_users
FROM session_exercises se
JOIN workout_sessions ws ON ws.id = se.session_id
WHERE ws.status = 'completed'
GROUP BY se.exercise_name
ORDER BY total_uses DESC;

GRANT SELECT ON v_admin_exercise_popularity TO authenticated;

-- ── 8. View: salud de la plataforma (semana actual vs anterior) ──
--    FIX: FULL OUTER JOIN ... ON FALSE reemplazado por subconsultas escalares
--         (evita producto cartesiano de millones de filas)
--    FIX: user_profiles → users
DROP VIEW IF EXISTS v_admin_platform_health CASCADE;
CREATE VIEW v_admin_platform_health AS
SELECT
  (
    SELECT COUNT(*) FROM workout_sessions
    WHERE workout_date >= date_trunc('week', NOW())
  )::bigint                                                               AS sessions_this_week,
  (
    SELECT COUNT(*) FROM workout_sessions
    WHERE workout_date >= date_trunc('week', NOW()) - INTERVAL '7 days'
      AND workout_date  < date_trunc('week', NOW())
  )::bigint                                                               AS sessions_last_week,
  (
    SELECT COUNT(*) FROM nutrition_entries
    WHERE entry_date >= date_trunc('week', NOW())
  )::bigint                                                               AS nutrition_this_week,
  (
    SELECT COUNT(*) FROM nutrition_entries
    WHERE entry_date >= date_trunc('week', NOW()) - INTERVAL '7 days'
      AND entry_date  < date_trunc('week', NOW())
  )::bigint                                                               AS nutrition_last_week,
  (
    SELECT COUNT(*) FROM users
    WHERE created_at >= date_trunc('week', NOW())
  )::bigint                                                               AS new_users_this_week,
  (
    SELECT COUNT(*) FROM users
    WHERE created_at >= date_trunc('week', NOW()) - INTERVAL '7 days'
      AND created_at  < date_trunc('week', NOW())
  )::bigint                                                               AS new_users_last_week;

GRANT SELECT ON v_admin_platform_health TO authenticated;
