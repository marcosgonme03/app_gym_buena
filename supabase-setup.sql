-- ============================================================================
-- CONFIGURACIÓN INICIAL DE BASE DE DATOS - GYM APP
-- ============================================================================
-- Proyecto: Aplicación de gestión de gimnasio (TFG)
-- Base de datos: Supabase PostgreSQL
-- Auth: Supabase Auth (email/password)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONES NECESARIAS
-- ----------------------------------------------------------------------------
-- uuid-ossp: Generación de UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 2. ENUM TYPES
-- ----------------------------------------------------------------------------
-- Roles de usuario en el sistema
CREATE TYPE user_role AS ENUM ('admin', 'trainer', 'member');

-- Niveles de experiencia del usuario
CREATE TYPE fitness_level AS ENUM ('beginner', 'intermediate', 'advanced');

-- ----------------------------------------------------------------------------
-- 3. TABLA PRINCIPAL: USERS
-- ----------------------------------------------------------------------------
-- Tabla de usuarios públicos vinculada 1:1 con auth.users
-- Almacena información de perfil y datos del gimnasio
CREATE TABLE public.users (
  -- Identificador único (PK)
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Relación con auth.users (FK única, obligatoria)
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Rol del usuario en el sistema
  role user_role NOT NULL DEFAULT 'member',
  
  -- Información personal básica
  name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  birth_date DATE,
  
  -- Datos físicos (para entrenamientos personalizados)
  height_cm INTEGER CHECK (height_cm > 0 AND height_cm < 300),
  weight_kg NUMERIC(5,2) CHECK (weight_kg > 0 AND weight_kg < 500),
  
  -- Objetivos y nivel de fitness
  goal TEXT,
  level fitness_level DEFAULT 'beginner',
  
  -- Metadatos de auditoría
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX idx_users_user_id ON public.users(user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

-- Comentarios para documentación de la base de datos
COMMENT ON TABLE public.users IS 'Perfiles de usuarios del gimnasio vinculados a Supabase Auth';
COMMENT ON COLUMN public.users.user_id IS 'FK a auth.users - relación 1:1 obligatoria';
COMMENT ON COLUMN public.users.role IS 'admin: administrador, trainer: entrenador, member: socio';

-- ----------------------------------------------------------------------------
-- 4. FUNCIÓN: ACTUALIZAR TIMESTAMP
-- ----------------------------------------------------------------------------
-- Función para actualizar automáticamente updated_at en cada UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para aplicar la función automáticamente
CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5. FUNCIÓN: AUTO-CREAR PERFIL DESPUÉS DE SIGNUP
-- ----------------------------------------------------------------------------
-- Cuando un usuario se registra en auth.users, se crea automáticamente su perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (user_id, email, name, last_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Nuevo'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger en auth.users para crear perfil automáticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------------------------
-- Activar RLS en la tabla users (OBLIGATORIO para seguridad)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 7. POLÍTICAS DE SEGURIDAD
-- ----------------------------------------------------------------------------

-- POLÍTICA 1: Lectura pública de perfiles (para listar entrenadores, etc.)
-- Ajustar según necesidades reales de privacidad
CREATE POLICY "Usuarios autenticados pueden ver perfiles públicos"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- POLÍTICA 2: Los usuarios pueden leer su propio perfil completo
CREATE POLICY "Usuarios pueden leer su propio perfil"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- POLÍTICA 3: Los usuarios solo pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- POLÍTICA 4: Admins pueden leer todos los perfiles
CREATE POLICY "Admins pueden leer todos los usuarios"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICA 5: Admins pueden actualizar cualquier perfil
CREATE POLICY "Admins pueden actualizar cualquier usuario"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICA 6: Admins pueden eliminar usuarios
CREATE POLICY "Admins pueden eliminar usuarios"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICA 7: Los nuevos registros se crean automáticamente por el trigger
-- No se permite INSERT manual directo (solo vía trigger)
CREATE POLICY "Sistema puede insertar nuevos usuarios"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 8. PREPARACIÓN PARA FUTURAS TABLAS
-- ----------------------------------------------------------------------------
-- Estructura base para próximas implementaciones:

-- CLASES (próximamente)
-- - id, title, description, trainer_id, capacity, schedule, duration, etc.

-- RESERVAS (próximamente)
-- - id, user_id, class_id, status, booked_at, attended, etc.

-- ENTRENAMIENTOS (próximamente)
-- - id, user_id, trainer_id, workout_plan, exercises, sets, reps, etc.

-- ASISTENCIAS (próximamente)
-- - id, user_id, check_in_time, check_out_time, etc.

-- ----------------------------------------------------------------------------
-- 9. VERIFICACIÓN FINAL
-- ----------------------------------------------------------------------------
-- Verificar que todo está correctamente configurado
DO $$
BEGIN
  RAISE NOTICE '✅ Setup completado correctamente';
  RAISE NOTICE '📊 Tablas creadas: %', (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');
  RAISE NOTICE '🔐 RLS activado: %', (SELECT relrowsecurity FROM pg_class WHERE relname = 'users');
  RAISE NOTICE '🛡️ Políticas creadas: %', (SELECT count(*) FROM pg_policies WHERE tablename = 'users');
END $$;

-- ============================================================================
-- FIN DEL SETUP INICIAL
-- ============================================================================
-- Próximos pasos:
-- 1. Ejecutar este SQL en Supabase SQL Editor
-- 2. Crear primer usuario admin manualmente (ver instrucciones abajo)
-- 3. Configurar Supabase Auth en frontend (Next.js/Expo)
-- 4. Implementar tablas de clases y reservas
-- ============================================================================
