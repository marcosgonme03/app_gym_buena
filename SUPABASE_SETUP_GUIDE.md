# 🏋️ Guía de Configuración Supabase - Gym App

## 📋 Información del Proyecto

- **Project ID**: `rkyjpakkigmphuinjorp`
- **Supabase URL**: `https://rkyjpakkigmphuinjorp.supabase.co`
- **Database**: PostgreSQL con Supabase Auth
- **Frontend**: Next.js + Expo

---

## 🚀 Pasos de Implementación

### 1️⃣ Ejecutar el Setup SQL

1. Abre **Supabase Dashboard** → `https://supabase.com/dashboard/project/rkyjpakkigmphuinjorp`
2. Ve a **SQL Editor** (menú lateral izquierdo)
3. Crea una nueva query
4. Copia y pega TODO el contenido de `supabase-setup.sql`
5. Click en **Run** (o `Ctrl+Enter`)
6. Verifica el mensaje: `✅ Setup completado correctamente`

---

### 2️⃣ Crear Usuario Admin Inicial

**Opción A: Desde Supabase Dashboard**

1. Ve a **Authentication** → **Users**
2. Click en **Add User** → **Create new user**
3. Completa:
   - Email: `admin@gym.com` (o el que prefieras)
   - Password: `Admin123!` (cámbialo después)
   - Auto Confirm User: ✅ (activar)
4. Click en **Create user**

**Opción B: Desde SQL (después de crear en Auth)**

```sql
-- Primero registra al usuario en Auth, luego actualiza su rol:
UPDATE public.users
SET role = 'admin'
WHERE email = 'admin@gym.com';
```

---

### 3️⃣ Obtener las API Keys

1. Ve a **Settings** → **API**
2. Copia estas variables de entorno:

```env
# Frontend (.env.local en Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://rkyjpakkigmphuinjorp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aquí

# Backend (si aplica)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aquí
```

⚠️ **NUNCA expongas `SERVICE_ROLE_KEY` en el frontend**

---

## 📊 Estructura de la Base de Datos

### Tabla: `public.users`

| Campo         | Tipo              | Descripción                          |
|---------------|-------------------|--------------------------------------|
| `id`          | UUID (PK)         | ID único del perfil                  |
| `user_id`     | UUID (FK, UNIQUE) | Referencia a `auth.users(id)`        |
| `role`        | ENUM              | admin, trainer, member               |
| `name`        | TEXT              | Nombre del usuario                   |
| `last_name`   | TEXT              | Apellido                             |
| `email`       | TEXT (UNIQUE)     | Email (sincronizado con auth)        |
| `phone`       | TEXT              | Teléfono (opcional)                  |
| `birth_date`  | DATE              | Fecha de nacimiento                  |
| `height_cm`   | INTEGER           | Altura en cm (1-300)                 |
| `weight_kg`   | NUMERIC(5,2)      | Peso en kg (0.01-500)                |
| `goal`        | TEXT              | Objetivo fitness                     |
| `level`       | ENUM              | beginner, intermediate, advanced     |
| `created_at`  | TIMESTAMPTZ       | Fecha de creación                    |
| `updated_at`  | TIMESTAMPTZ       | Última actualización (auto)          |

---

## 🔐 Políticas de Seguridad (RLS)

### ✅ Políticas Activas

1. **Lectura pública**: Usuarios autenticados ven perfiles públicos
2. **Lectura propia**: Cada usuario ve su perfil completo
3. **Actualización propia**: Solo puedes modificar tu perfil
4. **Admin read all**: Admins ven todos los usuarios
5. **Admin update all**: Admins modifican cualquier perfil
6. **Admin delete**: Admins eliminan usuarios
7. **Auto-insert**: Perfiles creados automáticamente vía trigger

### 🔍 Verificar RLS

```sql
-- Ver políticas activas
SELECT * FROM pg_policies WHERE tablename = 'users';

-- Verificar RLS está ON
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'users';
```

---

## 🔧 Funcionalidad Automática

### Trigger: Auto-creación de Perfil

Cuando un usuario se registra en **Supabase Auth**:

```javascript
// Frontend (Next.js/Expo con Supabase Auth)
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'SecurePass123!',
  options: {
    data: {
      name: 'Juan',
      last_name: 'Pérez',
      // role: 'member' (default automático)
    }
  }
});
```

**Resultado automático en DB**:
1. Se crea entrada en `auth.users`
2. **Trigger** detecta nueva inserción
3. Se crea perfil en `public.users` automáticamente
4. `user_id` vinculado a `auth.users(id)`

### Trigger: Updated At

Cada vez que se ejecuta `UPDATE` en `public.users`:
- El campo `updated_at` se actualiza automáticamente a `NOW()`
- No necesitas manejarlo manualmente

---

## 🧪 Pruebas de Verificación

### Test 1: Verificar Setup

```sql
-- Verificar extensiones
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';

-- Verificar tipos enum
SELECT * FROM pg_type WHERE typname IN ('user_role', 'fitness_level');

-- Verificar tabla
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'users';
```

### Test 2: Crear Usuario de Prueba

```javascript
// En tu app frontend
const { data, error } = await supabase.auth.signUp({
  email: 'test@gym.com',
  password: 'Test123!',
  options: {
    data: {
      name: 'Test',
      last_name: 'User'
    }
  }
});

// Verificar en SQL
SELECT * FROM public.users WHERE email = 'test@gym.com';
```

### Test 3: Actualizar Perfil

```javascript
// Usuario autenticado actualiza su perfil
const { data, error } = await supabase
  .from('users')
  .update({ 
    height_cm: 175, 
    weight_kg: 70.5,
    level: 'intermediate' 
  })
  .eq('user_id', user.id); // Solo puede actualizar su propio perfil
```

---

## 📦 Próximas Tablas a Implementar

### 1. Classes (Clases del gimnasio)

```sql
CREATE TABLE public.classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  trainer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  schedule TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL, -- minutos
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Bookings (Reservas)

```sql
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed', -- confirmed, cancelled, attended
  booked_at TIMESTAMPTZ DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, class_id)
);
```

### 3. Workouts (Entrenamientos)

```sql
CREATE TABLE public.workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  exercises JSONB, -- Array de ejercicios: [{name, sets, reps, weight}]
  completed BOOLEAN DEFAULT false,
  scheduled_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔒 Configuración de Auth en Frontend

### Next.js Setup

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

**`lib/supabase.ts`**:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Expo (React Native) Setup

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

**`lib/supabase.ts`**:
```typescript
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

---

## 📝 Ejemplo de Uso Completo

### Registro de Usuario

```typescript
const handleSignUp = async (email: string, password: string, userData: any) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: userData.name,
        last_name: userData.lastName,
        phone: userData.phone,
      },
    },
  });

  if (error) throw error;
  
  // El perfil ya está creado automáticamente por el trigger
  return data;
};
```

### Login

```typescript
const handleLogin = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};
```

### Obtener Perfil del Usuario

```typescript
const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
};
```

### Actualizar Perfil

```typescript
const updateProfile = async (userId: string, updates: Partial<User>) => {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

---

## 🐛 Troubleshooting

### Error: "new row violates row-level security policy"

**Causa**: Intentas insertar manualmente en `public.users`  
**Solución**: Usa `supabase.auth.signUp()` - el trigger lo maneja

### Error: "user_id no existe en auth.users"

**Causa**: FK rota o usuario auth eliminado  
**Solución**: Verifica que el usuario existe en `auth.users`

```sql
SELECT * FROM auth.users WHERE id = 'uuid_aquí';
```

### Error: "permission denied for table users"

**Causa**: RLS bloqueando la operación  
**Solución**: Verifica que estás autenticado y tienes permisos

```javascript
// Verificar sesión activa
const { data: { session } } = await supabase.auth.getSession();
console.log(session?.user);
```

---

## ✅ Checklist Final

- [ ] SQL ejecutado en Supabase SQL Editor
- [ ] Usuario admin creado y rol asignado
- [ ] API Keys copiadas a `.env.local`
- [ ] Supabase client instalado en frontend
- [ ] Registro de prueba funcionando
- [ ] Login funcional
- [ ] Perfil se crea automáticamente
- [ ] RLS permite leer/actualizar propio perfil
- [ ] Admin puede ver todos los usuarios

---

## 📚 Recursos

- [Supabase Docs](https://supabase.com/docs)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)

---

**¿Problemas?** Revisa los logs de Supabase:
- Dashboard → Logs → Postgres Logs
- Dashboard → Logs → Auth Logs
