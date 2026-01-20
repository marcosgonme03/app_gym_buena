# Crear Usuario Entrenador y Clases

## 1. Crear tabla de clases en Supabase

Ve a **Supabase Dashboard** → **SQL Editor** y ejecuta el archivo:
```
backend/create-classes-table.sql
```

## 2. Crear usuario entrenador

En **Supabase Dashboard** → **Authentication** → **Users** → **Add User**:

- Email: `trainer@gym.com`
- Password: `trainer123`
- Click **Create user**

## 3. Asignar role de trainer

En **SQL Editor**, ejecuta:

```sql
-- Obtener el user_id del trainer
SELECT id, email FROM auth.users WHERE email = 'trainer@gym.com';

-- Actualizar el role a trainer (reemplaza USER_ID)
UPDATE public.users 
SET role = 'trainer' 
WHERE user_id = 'USER_ID_AQUI';

-- Verificar
SELECT user_id, email, name, role FROM public.users WHERE email = 'trainer@gym.com';
```

## 4. Crear clases de ejemplo

En **SQL Editor**, ejecuta (reemplaza TRAINER_USER_ID con el ID del paso 3):

```sql
INSERT INTO public.classes (name, description, trainer_id, date, start_time, end_time, capacity)
VALUES 
  ('Yoga Matutino', 'Clase de yoga para comenzar el día', 'TRAINER_USER_ID', CURRENT_DATE, '08:00', '09:00', 15),
  ('Spinning', 'Clase de spinning intenso', 'TRAINER_USER_ID', CURRENT_DATE, '10:00', '11:00', 20),
  ('CrossFit', 'Entrenamiento funcional de alta intensidad', 'TRAINER_USER_ID', CURRENT_DATE, '18:00', '19:00', 12);

-- Verificar que se crearon
SELECT * FROM public.classes WHERE trainer_id = 'TRAINER_USER_ID';
```

## 5. Probar

1. Haz login con `trainer@gym.com` / `trainer123`
2. Deberías ser redirigido a `/trainer`
3. Verás las 3 clases del día en formato de tarjetas

## Características del Dashboard de Entrenador

✅ Muestra clases del día actual
✅ Horarios de inicio y fin
✅ Capacidad de cada clase
✅ Estado activo
✅ Diseño con tarjetas responsive
✅ Empty state si no hay clases

## Mejoras futuras (para implementar después)

- Agregar/editar/eliminar clases
- Ver asistentes inscritos
- Marcar asistencia
- Calendario semanal
- Estadísticas de clases
- Notificaciones
