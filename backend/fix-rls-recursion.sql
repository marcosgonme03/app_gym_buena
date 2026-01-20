-- FIX: Infinite recursion in RLS policies for users table
-- El problema es que las policies estaban consultando la tabla users dentro de policies sobre users
-- Solución: Usar auth.uid() directamente sin subqueries a la tabla users

-- 1. Eliminar policies antiguas
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.users;
DROP POLICY IF EXISTS "Usuarios autenticados pueden ver perfiles públicos" ON public.users;
DROP POLICY IF EXISTS "Admins pueden leer todos los usuarios" ON public.users;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.users;

-- 2. Crear policies SIN recursión
-- Policy para SELECT: Los usuarios solo pueden ver su propio perfil
CREATE POLICY "users_select_own"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy para UPDATE: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "users_update_own"
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy para INSERT: Solo el trigger puede insertar (usando service_role)
-- Los usuarios autenticados NO pueden insertar directamente
CREATE POLICY "users_insert_system"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (false);

-- IMPORTANTE: Verificar que la función trigger NO tenga SECURITY DEFINER
-- Si la tiene, cambiar a SECURITY INVOKER para evitar problemas de RLS

-- Verificar el trigger actual:
-- SELECT pg_get_functiondef('handle_new_user'::regproc);

-- Si es necesario, recrear la función sin SECURITY DEFINER:
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, name, last_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    'member', -- role por defecto
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asegurar que el trigger existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. VERIFICACIÓN
-- Para verificar que funciona, ejecuta:
-- SELECT * FROM public.users WHERE user_id = auth.uid();
-- Debería retornar tu perfil sin errores de recursión
