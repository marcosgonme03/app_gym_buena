# 🏗️ Arquitectura de la Nueva Estructura - Rol Member

## 📊 Diagrama de Base de Datos

```
┌─────────────────────────────────────────────────────────────┐
│                      public.users                            │
├─────────────────────────────────────────────────────────────┤
│ PK  user_id              UUID                                │
│     role                 ENUM (admin/trainer/member)         │
│     name                 VARCHAR                             │
│     last_name            VARCHAR                             │
│     email                VARCHAR                             │
│     avatar_url           VARCHAR                             │
│     phone                VARCHAR                             │
│     bio                  TEXT                                │
│     date_of_birth        DATE                                │
│     height_cm            INTEGER          ← RENOMBRADO       │
│     level                ENUM (beginner/intermediate...)     │
│                                                               │
│     ┌─────────────────  NUEVOS CAMPOS ──────────────────┐   │
│     │ goal_type          ENUM goal_type                 │   │
│     │ goal_notes         TEXT                           │   │
│     │ goal_target_date   DATE                           │   │
│     │ onboarding_completed BOOLEAN                      │   │
│     └───────────────────────────────────────────────────┘   │
│                                                               │
│     created_at           TIMESTAMPTZ                         │
│     updated_at           TIMESTAMPTZ                         │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ FK: user_id
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   public.body_metrics (NUEVA)                │
├─────────────────────────────────────────────────────────────┤
│ PK  id                   UUID                                │
│ FK  user_id              UUID → users.user_id                │
│     weight_kg            DECIMAL(5,2)  CHECK (20-300)        │
│     height_cm            INTEGER       CHECK (80-250)        │
│     recorded_at          TIMESTAMPTZ                         │
│     created_at           TIMESTAMPTZ                         │
├─────────────────────────────────────────────────────────────┤
│ Índices:                                                     │
│   - idx_body_metrics_user_id                                │
│   - idx_body_metrics_recorded_at (DESC)                     │
│   - idx_body_metrics_user_recorded (COMPOSITE)              │
├─────────────────────────────────────────────────────────────┤
│ RLS Policies:                                                │
│   ✅ SELECT: auth.uid() = user_id                           │
│   ✅ INSERT: auth.uid() = user_id                           │
│   ✅ UPDATE: auth.uid() = user_id                           │
│   ✅ DELETE: auth.uid() = user_id                           │
│   ✅ ADMIN: role = 'admin' (SELECT all)                     │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Enum: goal_type

```sql
CREATE TYPE goal_type AS ENUM (
  'lose_fat',      -- Perder grasa
  'gain_muscle',   -- Ganar músculo
  'strength',      -- Aumentar fuerza
  'endurance',     -- Mejorar resistencia
  'mobility',      -- Mejorar movilidad
  'health'         -- Salud general
);
```

---

## 🔄 Flujo de Datos

### 1️⃣ Onboarding (Primera vez)

```
Usuario → Settings Form
          ↓
    ┌─────────────────┐
    │ Formulario      │
    │ - Objetivo *    │  * = Requerido si onboarding_completed = false
    │ - Peso         │
    │ - Altura       │
    │ - Fecha obj.   │
    │ - Notas        │
    └─────────────────┘
          ↓
    handleSubmit()
          ↓
    ┌─────────────────────────────────────┐
    │ 1. updateMyProfile(...)             │
    │    → UPDATE users SET               │
    │      goal_type,                     │
    │      goal_notes,                    │
    │      goal_target_date,              │
    │      height_cm,                     │
    │      onboarding_completed = true    │
    └─────────────────────────────────────┘
          ↓
    ┌─────────────────────────────────────┐
    │ 2. insertBodyMetric({ weight_kg })  │
    │    → INSERT INTO body_metrics       │
    │      (user_id, weight_kg, ...)      │
    └─────────────────────────────────────┘
          ↓
    refreshProfile()
          ↓
    Redirige a MemberDashboard
```

### 2️⃣ Visualización de Datos (Dashboard)

```
MemberDashboard
    ↓
MemberStatsCard (component)
    ↓
useEffect() → loads data
    ↓
┌──────────────────────────────────┐
│ getMyLatestBodyMetric()          │
│ SELECT * FROM body_metrics       │
│ WHERE user_id = auth.uid()       │
│ ORDER BY recorded_at DESC        │
│ LIMIT 1                          │
└──────────────────────────────────┘
    ↓
┌──────────────────────────────────┐
│ profile (from AuthContext)       │
│ - goal_type                      │
│ - goal_notes                     │
│ - goal_target_date               │
│ - height_cm                      │
│ - level                          │
└──────────────────────────────────┘
    ↓
Renderiza UI con datos
```

### 3️⃣ Actualización de Peso

```
Usuario → Settings → Cambia Peso
          ↓
    handleSubmit()
          ↓
    Compara: formData.weight_kg !== currentWeight?
          ↓ SÍ
    ┌─────────────────────────────────────┐
    │ insertBodyMetric({ weight_kg })     │
    │ → INSERT nueva fila en body_metrics │
    │   con recorded_at = NOW()           │
    └─────────────────────────────────────┘
          ↓
    Dashboard se actualiza automáticamente
    (muestra nuevo peso con fecha)
```

---

## 🗂️ Estructura de Archivos

```
app_gym_buena/
├── database/
│   ├── migrate_users_and_create_body_metrics.sql  ← Script migración
│   └── MIGRACION_MEMBERS_README.md                ← Este documento
│
├── frontend/src/
│   ├── lib/supabase/
│   │   └── types.ts                               ← GoalType, BodyMetric
│   │
│   ├── services/
│   │   ├── bodyMetrics.ts                         ← CRUD body_metrics
│   │   └── userProfile.ts                         ← CRUD users (actualizado)
│   │
│   ├── components/member/
│   │   └── MemberStatsCard.tsx                    ← Muestra objetivo + peso
│   │
│   └── pages/
│       ├── Settings.tsx                           ← Formulario actualizado
│       └── MemberDashboard.tsx                    ← Integra MemberStatsCard
```

---

## 🔌 API de Servicios

### bodyMetrics.ts

```typescript
// Obtener última métrica
getMyLatestBodyMetric(): Promise<BodyMetric | null>
// → SELECT * FROM body_metrics WHERE user_id = auth.uid() ORDER BY recorded_at DESC LIMIT 1

// Obtener historial (30 últimas)
getMyBodyMetrics(limit: number = 30): Promise<BodyMetric[]>
// → SELECT * FROM body_metrics WHERE user_id = auth.uid() ORDER BY recorded_at DESC LIMIT 30

// Insertar nueva métrica
insertBodyMetric(payload: {
  weight_kg: number,
  height_cm?: number,
  recorded_at?: string
}): Promise<BodyMetric>
// → INSERT INTO body_metrics (user_id, weight_kg, height_cm, recorded_at) VALUES (...)

// Eliminar métrica
deleteBodyMetric(metricId: string): Promise<void>
// → DELETE FROM body_metrics WHERE id = ? AND user_id = auth.uid()

// Utilidades
calculateBMI(weight_kg: number, height_cm: number): number
getBMICategory(bmi: number): string
```

### userProfile.ts (actualizado)

```typescript
// Actualizar perfil
updateMyProfile(payload: {
  name?: string,
  last_name?: string,
  phone?: string | null,
  bio?: string | null,
  date_of_birth?: string | null,
  height_cm?: number | null,
  level?: 'beginner' | 'intermediate' | 'advanced',
  goal_type?: GoalType | null,
  goal_notes?: string | null,
  goal_target_date?: string | null,
  onboarding_completed?: boolean
}): Promise<UserProfile>
// → UPDATE users SET ... WHERE user_id = auth.uid()
```

---

## 🎨 Componentes UI

### MemberStatsCard

**Props:** Ninguno (usa AuthContext para profile)

**Estados:**
- `latestMetric: BodyMetric | null` - Última métrica de peso
- `loading: boolean` - Cargando datos

**Muestra:**
1. **Objetivo:** 
   - Si existe: emoji + label + fecha + notas
   - Si falta: alerta amarilla "Define tu objetivo"

2. **Métricas corporales:**
   - **Peso:** Si existe → "75.5 kg (22 ene)", sino → "+ Añadir peso"
   - **Altura:** Si existe → "175 cm", sino → "+ Añadir altura"

3. **Nivel:** Badge con emoji según level

**Responsive:**
- Desktop (≥1024px): Sidebar derecho
- Mobile (<1024px): Abajo del main content

---

## 🔐 Seguridad (RLS)

### Matriz de Permisos

| Tabla         | Rol    | SELECT | INSERT | UPDATE | DELETE |
|---------------|--------|--------|--------|--------|--------|
| users         | member | ✅ own | ❌     | ✅ own | ❌     |
| users         | admin  | ✅ all | ✅     | ✅ all | ✅     |
| body_metrics  | member | ✅ own | ✅ own | ✅ own | ✅ own |
| body_metrics  | admin  | ✅ all | ❌     | ❌     | ❌     |

**Validación automática:**
- Supabase client usa `auth.uid()` automáticamente
- No es posible insertar/leer datos de otro usuario
- RLS policies validan a nivel de BD

---

## 🧪 Queries de Testing

### Verificar datos de un usuario

```sql
-- Ver perfil completo
SELECT 
  user_id,
  name,
  email,
  goal_type,
  goal_notes,
  goal_target_date,
  height_cm,
  level,
  onboarding_completed
FROM users
WHERE user_id = 'xxx';

-- Ver historial de peso
SELECT 
  id,
  weight_kg,
  height_cm,
  recorded_at,
  created_at
FROM body_metrics
WHERE user_id = 'xxx'
ORDER BY recorded_at DESC;

-- Ver última métrica
SELECT *
FROM body_metrics
WHERE user_id = 'xxx'
ORDER BY recorded_at DESC
LIMIT 1;
```

### Simular inserción manual

```sql
-- Insertar métrica
INSERT INTO body_metrics (user_id, weight_kg, height_cm, recorded_at)
VALUES (
  'xxx',  -- user_id
  75.5,   -- peso
  175,    -- altura
  NOW()   -- fecha actual
);

-- Actualizar objetivo
UPDATE users
SET 
  goal_type = 'gain_muscle',
  goal_notes = 'Quiero ganar 5kg en 6 meses',
  goal_target_date = (CURRENT_DATE + INTERVAL '6 months')::DATE,
  onboarding_completed = TRUE
WHERE user_id = 'xxx';
```

---

## 📱 Capturas de Flujo (Wireframes)

### Settings Form

```
┌──────────────────────────────────────────┐
│  Ajustes                    [X] Cerrar   │
├──────────────────────────────────────────┤
│                                          │
│  Información Personal                    │
│  ┌────────────┐ ┌────────────┐         │
│  │ Nombre     │ │ Apellidos  │         │
│  └────────────┘ └────────────┘         │
│  ┌─────────────────────────────┐       │
│  │ Email (readonly)            │       │
│  └─────────────────────────────┘       │
│  ┌─────────────────────────────┐       │
│  │ Teléfono                    │       │
│  └─────────────────────────────┘       │
│  ┌─────────────────────────────┐       │
│  │ Fecha Nacimiento            │       │
│  └─────────────────────────────┘       │
│                                          │
│  Medidas Físicas                         │
│  ┌────────────┐ ┌────────────┐         │
│  │ Peso (kg)  │ │ Altura(cm) │         │
│  │ 75.5       │ │ 175        │         │
│  └────────────┘ └────────────┘         │
│  ℹ️  Se guardará historial de cambios   │
│                                          │
│  Nivel de Experiencia                    │
│  ┌─────────────────────────────┐       │
│  │ ▼ Intermedio                │       │
│  └─────────────────────────────┘       │
│                                          │
│  Objetivo Principal *                    │
│  ┌─────────────────────────────┐       │
│  │ ▼ Ganar músculo             │       │
│  └─────────────────────────────┘       │
│                                          │
│  Fecha Objetivo (opcional)               │
│  ┌─────────────────────────────┐       │
│  │ 📅 15/07/2026               │       │
│  └─────────────────────────────┘       │
│                                          │
│  Notas sobre Objetivo                    │
│  ┌─────────────────────────────┐       │
│  │ Quiero ganar 5kg antes de   │       │
│  │ mi boda...                  │       │
│  └─────────────────────────────┘       │
│  0/1000 caracteres                       │
│                                          │
│  Biografía                               │
│  ┌─────────────────────────────┐       │
│  │ Soy entusiasta del fitness  │       │
│  └─────────────────────────────┘       │
│  0/500 caracteres                        │
│                                          │
│  [Guardar Cambios] [Cancelar]           │
└──────────────────────────────────────────┘
```

### MemberStatsCard (Desktop Sidebar)

```
┌─────────────────────────────────┐
│ Mi Perfil de Entrenamiento      │
│                         [Editar] │
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 💪  Objetivo actual         │ │
│ │     Ganar músculo           │ │
│ │     📅 15 julio 2026        │ │
│ │     "Quiero ganar 5kg..."   │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ ┌────────────┐  ┌────────────┐ │
│ │ Peso actual│  │ Altura     │ │
│ │ 75.5 kg    │  │ 175 cm     │ │
│ │ 22 ene     │  └────────────┘ │
│ └────────────┘                  │
├─────────────────────────────────┤
│ Nivel: 💪 Intermedio            │
└─────────────────────────────────┘
```

---

## 🚀 Deploy Checklist

### Pre-Deploy:
- [ ] Backup de base de datos actual
- [ ] Ejecutar script SQL en entorno staging
- [ ] Verificar que body_metrics existe
- [ ] Probar RLS con diferentes usuarios
- [ ] Verificar que frontend compila sin errores
- [ ] Testing manual completo

### Deploy:
- [ ] Ejecutar script SQL en producción
- [ ] Verificar logs de Supabase (0 errores)
- [ ] Deploy frontend
- [ ] Smoke test: login como member → ver dashboard
- [ ] Verificar que no hay errores en console

### Post-Deploy:
- [ ] Monitorear logs 1 hora
- [ ] Verificar métricas de Supabase (queries lentas?)
- [ ] Test en diferentes browsers
- [ ] Test en mobile real
- [ ] Recoger feedback de usuarios

---

Creado: 22 Enero 2026
