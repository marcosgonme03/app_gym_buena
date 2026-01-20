-- Crear tabla de clases
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  trainer_id UUID NOT NULL REFERENCES auth.users(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

-- Policy: Todos los usuarios autenticados pueden ver las clases
CREATE POLICY "classes_select_all"
ON public.classes
FOR SELECT
TO authenticated
USING (true);

-- Policy: Solo entrenadores pueden crear/editar sus propias clases
CREATE POLICY "trainers_manage_own_classes"
ON public.classes
FOR ALL
TO authenticated
USING (
  trainer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE user_id = auth.uid()
    AND role = 'trainer'
  )
)
WITH CHECK (
  trainer_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE user_id = auth.uid()
    AND role = 'trainer'
  )
);

-- Insertar algunas clases de ejemplo para hoy
-- NOTA: Reemplaza 'TRAINER_USER_ID' con el UUID real del entrenador

/*
INSERT INTO public.classes (name, description, trainer_id, date, start_time, end_time, capacity)
VALUES 
  ('Yoga Matutino', 'Clase de yoga para comenzar el día', 'TRAINER_USER_ID', CURRENT_DATE, '08:00', '09:00', 15),
  ('Spinning', 'Clase de spinning intenso', 'TRAINER_USER_ID', CURRENT_DATE, '10:00', '11:00', 20),
  ('CrossFit', 'Entrenamiento funcional de alta intensidad', 'TRAINER_USER_ID', CURRENT_DATE, '18:00', '19:00', 12);
*/

-- Verificar que se creó
SELECT * FROM public.classes;
