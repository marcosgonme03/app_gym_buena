-- =====================================================
-- Script SQL: FASE 2 - Weekly Workout Tracking
-- Fecha: 2026-01-22
-- Descripción: Añade weekly_workout_goal a users y crea tabla workout_logs
-- =====================================================

-- 1. Añadir columna weekly_workout_goal a users
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS weekly_workout_goal INTEGER DEFAULT 3;

-- 2. Añadir constraint para weekly_workout_goal (1-14)
ALTER TABLE public.users
ADD CONSTRAINT weekly_workout_goal_range 
CHECK (weekly_workout_goal >= 1 AND weekly_workout_goal <= 14);

-- 3. Crear tabla workout_logs
CREATE TABLE IF NOT EXISTS public.workout_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    workout_type VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Crear índices en workout_logs
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON public.workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_performed_at ON public.workout_logs(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_performed ON public.workout_logs(user_id, performed_at DESC);

-- 5. Añadir comentarios para documentación
COMMENT ON COLUMN public.users.weekly_workout_goal IS 'Meta semanal de entrenamientos (1-14, default 3)';
COMMENT ON TABLE public.workout_logs IS 'Registro histórico de entrenamientos realizados';
COMMENT ON COLUMN public.workout_logs.performed_at IS 'Fecha y hora en que se realizó el entrenamiento';
COMMENT ON COLUMN public.workout_logs.workout_type IS 'Tipo de entrenamiento (cardio, fuerza, etc.)';
COMMENT ON COLUMN public.workout_logs.notes IS 'Notas opcionales sobre el entrenamiento';

-- 6. Habilitar Row Level Security (RLS) en workout_logs
ALTER TABLE public.workout_logs ENABLE ROW LEVEL SECURITY;

-- 7. Crear políticas RLS para workout_logs

-- Los usuarios solo pueden ver sus propios logs
CREATE POLICY "Users can view own workout logs"
ON public.workout_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Los usuarios solo pueden insertar sus propios logs
CREATE POLICY "Users can insert own workout logs"
ON public.workout_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Los usuarios solo pueden actualizar sus propios logs
CREATE POLICY "Users can update own workout logs"
ON public.workout_logs
FOR UPDATE
USING (auth.uid() = user_id);

-- Los usuarios solo pueden eliminar sus propios logs
CREATE POLICY "Users can delete own workout logs"
ON public.workout_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Admins pueden ver todos los logs
CREATE POLICY "Admins can view all workout logs"
ON public.workout_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.user_id = auth.uid()
        AND users.role = 'admin'
    )
);

-- 8. Actualizar users existentes con weekly_workout_goal=3 si es NULL
UPDATE public.users
SET weekly_workout_goal = 3
WHERE weekly_workout_goal IS NULL;

-- 9. Crear índice en users para weekly_workout_goal
CREATE INDEX IF NOT EXISTS idx_users_weekly_goal ON public.users(weekly_workout_goal) WHERE weekly_workout_goal IS NOT NULL;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar columna weekly_workout_goal en users
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name = 'weekly_workout_goal';

-- Verificar estructura de workout_logs
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'workout_logs'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'workout_logs';

-- Verificar constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'users'
AND tc.constraint_name LIKE '%weekly_workout%';

-- =====================================================
-- DATOS DE PRUEBA (opcional - descomentar si quieres)
-- =====================================================

/*
-- Insertar workout logs de ejemplo para un usuario
INSERT INTO public.workout_logs (user_id, performed_at, workout_type, notes)
VALUES 
    ('00000000-0000-0000-0000-000000000000', NOW(), 'cardio', 'Corrí 5km'),
    ('00000000-0000-0000-0000-000000000000', NOW() - INTERVAL '1 day', 'fuerza', 'Tren superior'),
    ('00000000-0000-0000-0000-000000000000', NOW() - INTERVAL '2 days', 'flexibilidad', 'Yoga 30min');

-- Actualizar meta semanal de un usuario
UPDATE public.users
SET weekly_workout_goal = 4
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Ver resumen de entrenamientos de esta semana para un usuario
SELECT 
    COUNT(*) as workouts_this_week,
    u.weekly_workout_goal
FROM public.workout_logs wl
JOIN public.users u ON u.user_id = wl.user_id
WHERE wl.user_id = '00000000-0000-0000-0000-000000000000'
AND wl.performed_at >= date_trunc('week', NOW())
GROUP BY u.weekly_workout_goal;
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
