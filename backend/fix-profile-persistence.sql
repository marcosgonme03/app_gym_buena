-- ============================================
-- FIX COMPLETO: Persistencia de Ajustes
-- ============================================
-- Este script asegura:
-- 1. Columnas de perfil existen en public.users
-- 2. RLS policies correctas sin recursión
-- 3. Permisos para SELECT/UPDATE del propio perfil
-- ============================================

-- PASO 1: Verificar y agregar columnas de perfil (idempotente)
-- ============================================
DO $$ 
BEGIN
  -- avatar_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    RAISE NOTICE 'Columna avatar_url agregada';
  ELSE
    RAISE NOTICE 'Columna avatar_url ya existe';
  END IF;

  -- phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone VARCHAR(20);
    RAISE NOTICE 'Columna phone agregada';
  ELSE
    RAISE NOTICE 'Columna phone ya existe';
  END IF;

  -- bio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'bio'
  ) THEN
    ALTER TABLE public.users ADD COLUMN bio TEXT;
    RAISE NOTICE 'Columna bio agregada';
  ELSE
    RAISE NOTICE 'Columna bio ya existe';
  END IF;

  -- date_of_birth
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE public.users ADD COLUMN date_of_birth DATE;
    RAISE NOTICE 'Columna date_of_birth agregada';
  ELSE
    RAISE NOTICE 'Columna date_of_birth ya existe';
  END IF;
END $$;

-- PASO 2: Eliminar policies antiguas (evitar conflictos)
-- ============================================
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver perfiles públicos" ON public.users;
DROP POLICY IF EXISTS "Admins pueden leer todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.users;
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_system" ON public.users;

-- PASO 3: Crear policies SIN recursión (usando auth.uid() directamente)
-- ============================================

-- Policy SELECT: Usuarios solo ven su propio perfil
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy UPDATE: Usuarios solo actualizan su propio perfil
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy INSERT: Solo el sistema puede insertar (trigger)
CREATE POLICY "users_insert_system"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (false);

-- PASO 4: Verificar resultados
-- ============================================
-- Columnas agregadas
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('avatar_url', 'phone', 'bio', 'date_of_birth')
ORDER BY ordinal_position;

-- Políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;
