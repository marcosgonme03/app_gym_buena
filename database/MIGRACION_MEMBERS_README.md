# 🏋️ Actualización de Rol "Member" - Nueva Estructura de BD

## 📋 Resumen de Cambios

Se ha actualizado completamente el área de **miembros** para adaptarse a la nueva estructura de base de datos:

### ✅ Cambios en Base de Datos

#### Tabla `public.users` (actualizada):
- ✅ **`goal_type`** (enum): Tipo de objetivo ('lose_fat', 'gain_muscle', 'strength', 'endurance', 'mobility', 'health')
- ✅ **`goal_notes`** (text): Notas sobre el objetivo (max 1000 caracteres)
- ✅ **`goal_target_date`** (date): Fecha objetivo para alcanzar la meta
- ✅ **`onboarding_completed`** (boolean): Si completó el proceso de setup inicial
- ✅ **`height_cm`** (integer): Altura en centímetros (renombrado desde `height`)
- ❌ **ELIMINADO:** `weight`, `goal` (texto), `weight_kg`

#### Nueva Tabla `public.body_metrics`:
```sql
{
  id: UUID,
  user_id: UUID (FK → users),
  weight_kg: DECIMAL(5,2),  // 20-300 kg
  height_cm: INTEGER,        // 80-250 cm (opcional)
  recorded_at: TIMESTAMPTZ,
  created_at: TIMESTAMPTZ
}
```

### ✅ Cambios en Frontend

#### Nuevos Archivos:
1. **`services/bodyMetrics.ts`**: Servicio para gestionar métricas corporales
   - `getMyLatestBodyMetric()`: Obtiene el peso más reciente
   - `getMyBodyMetrics(limit)`: Obtiene historial de pesos
   - `insertBodyMetric(payload)`: Inserta nueva métrica
   - `deleteBodyMetric(id)`: Elimina métrica
   - Incluye utilidades: `calculateBMI()`, `getBMICategory()`

2. **`components/member/MemberStatsCard.tsx`**: Componente para mostrar:
   - Objetivo actual con emoji y fecha
   - Peso actual (última body_metric)
   - Altura (desde users.height_cm)
   - Nivel de experiencia
   - CTAs si faltan datos

3. **`database/migrate_users_and_create_body_metrics.sql`**: Script completo de migración

#### Archivos Modificados:
1. **`lib/supabase/types.ts`**:
   - Nuevo tipo: `GoalType`
   - Actualizado `UserProfile` con nuevos campos
   - Nueva interfaz: `BodyMetric`

2. **`services/userProfile.ts`**:
   - Actualizado `UpdateProfilePayload` con goal_type, goal_notes, goal_target_date, height_cm
   - Nuevas validaciones: altura 80-250cm, goal_target_date no pasada
   - Eliminadas referencias a `weight` y `height` obsoletos

3. **`pages/Settings.tsx`**:
   - Nuevo campo: **Peso (kg)** - se guarda en body_metrics
   - Nuevo campo: **Altura (cm)** - se guarda en users.height_cm
   - Nuevo campo: **Nivel de Experiencia** (principiante/intermedio/avanzado)
   - Nuevo campo: **Objetivo Principal** (selector con 6 opciones)
   - Nuevo campo: **Fecha Objetivo** (date picker)
   - Nuevo campo: **Notas sobre Objetivo** (textarea 1000 chars)
   - Carga automática de peso actual desde body_metrics
   - Al guardar: actualiza users + inserta en body_metrics si cambió peso

4. **`pages/MemberDashboard.tsx`**:
   - Integrado `MemberStatsCard` en sidebar (desktop) y abajo (mobile)
   - Layout responsivo mantenido

---

## 🚀 Cómo Ejecutar la Migración

### Paso 1: Migrar Base de Datos

```sql
-- En Supabase SQL Editor, ejecuta:
-- c:\Users\marco\Desktop\app_gym_buena\database\migrate_users_and_create_body_metrics.sql

-- El script:
-- ✅ Crea enum goal_type
-- ✅ Añade columnas goal_type, goal_notes, goal_target_date, onboarding_completed
-- ✅ Renombra height → height_cm
-- ✅ Elimina weight, goal, weight_kg obsoletos
-- ✅ Crea tabla body_metrics con RLS
-- ✅ Crea índices para performance
-- ✅ Configura políticas de seguridad
```

### Paso 2: Verificar Migración

```sql
-- Verificar columnas de users
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
AND column_name IN ('goal_type', 'goal_notes', 'goal_target_date', 'height_cm', 'onboarding_completed');

-- Verificar tabla body_metrics
SELECT * FROM information_schema.tables
WHERE table_name = 'body_metrics';

-- Verificar políticas RLS
SELECT policyname, cmd FROM pg_policies
WHERE tablename = 'body_metrics';
```

### Paso 3: Iniciar Frontend

```bash
cd c:\Users\marco\Desktop\app_gym_buena\frontend
npm run dev
```

Servidor corriendo en: **http://localhost:5177/**

---

## 🎯 Flujo de Usuario (Member)

### Primera Vez (Onboarding):
1. Usuario hace login → ve MemberDashboard
2. Si `onboarding_completed = false` o falta `goal_type`:
   - Muestra alerta amarilla: "Define tu objetivo"
3. Usuario va a **Settings**
4. Completa:
   - ✅ Objetivo Principal (requerido)
   - ✅ Peso (opcional pero recomendado)
   - ✅ Altura (opcional)
   - ✅ Fecha objetivo (opcional)
   - ✅ Notas (opcional)
5. Click "Guardar Cambios"
6. Backend:
   - UPDATE users con goal_type, goal_notes, goal_target_date, height_cm, onboarding_completed=true
   - Si hay peso: INSERT en body_metrics
7. Redirige a Dashboard → muestra todo completo

### Actualización de Peso:
1. Usuario va a **Settings**
2. Cambia el valor de "Peso (kg)"
3. Click "Guardar Cambios"
4. Backend:
   - Compara con peso actual (latest body_metric)
   - Si cambió: INSERT nueva fila en body_metrics
   - UPDATE users con otros campos
5. En Dashboard → muestra nuevo peso con fecha actualizada

---

## 📊 Validaciones Implementadas

### Peso (weight_kg):
- ✅ Rango: 20 - 300 kg
- ✅ Tipo: DECIMAL(5,2) - permite 2 decimales (ej: 75.5)
- ✅ Check constraint en BD
- ✅ Validación en frontend (input min/max)
- ✅ Validación en servicio bodyMetrics

### Altura (height_cm):
- ✅ Rango: 80 - 250 cm
- ✅ Tipo: INTEGER - sin decimales
- ✅ Check constraint en BD
- ✅ Validación en frontend (input min/max)
- ✅ Validación en servicio userProfile

### Objetivo (goal_type):
- ✅ Enum con 6 valores fijos
- ✅ Requerido si `onboarding_completed = false`
- ✅ Selector con labels legibles en español
- ✅ Check constraint en BD

### Fecha Objetivo (goal_target_date):
- ✅ No puede ser en el pasado
- ✅ Tipo: DATE
- ✅ Validación en servicio userProfile
- ✅ Date picker con min=today en frontend

### Notas (goal_notes):
- ✅ Máximo 1000 caracteres
- ✅ Contador de caracteres en UI
- ✅ Validación en servicio userProfile

---

## 🔐 Seguridad (RLS)

### Tabla `body_metrics`:
- ✅ **SELECT**: Usuario solo ve sus propias métricas
- ✅ **INSERT**: Usuario solo puede insertar para sí mismo
- ✅ **UPDATE**: Usuario solo puede actualizar las suyas
- ✅ **DELETE**: Usuario solo puede eliminar las suyas
- ✅ **ADMIN**: Los admins pueden ver todas las métricas

### Consultas Seguras:
```typescript
// Frontend usa auth.uid() automáticamente vía Supabase client
const { data } = await supabase
  .from('body_metrics')
  .select('*')
  .eq('user_id', user.id)  // RLS valida que user.id === auth.uid()
  .order('recorded_at', { ascending: false })
  .limit(1);
```

---

## 🎨 Estados de UI

### MemberStatsCard:

#### Con datos completos:
```
┌─────────────────────────────────┐
│ Mi Perfil de Entrenamiento  [Editar]
├─────────────────────────────────┤
│ 💪 Objetivo actual             │
│    Ganar músculo                │
│    Fecha: 15 julio 2026         │
│    "Quiero ganar 5kg de músculo"│
├─────────────────────────────────┤
│ ┌─────────┐  ┌─────────┐       │
│ │ Peso    │  │ Altura  │       │
│ │ 75.5 kg │  │ 175 cm  │       │
│ │ 22 ene  │  └─────────┘       │
│ └─────────┘                     │
├─────────────────────────────────┤
│ Nivel: 💪 Intermedio            │
└─────────────────────────────────┘
```

#### Sin objetivo:
```
┌─────────────────────────────────┐
│ ⚠️  Define tu objetivo          │
│    Completa tu perfil para      │
│    obtener recomendaciones      │
└─────────────────────────────────┘
```

#### Sin peso:
```
┌─────────┐
│ Peso    │
│ + Añadir│  ← Clickable, va a Settings
└─────────┘
```

---

## 🧪 Testing Manual

### Test 1: Usuario Nuevo (Sin Objetivo)
1. Login como member sin goal_type
2. ✅ Ver alerta amarilla en Dashboard
3. Ir a Settings
4. ✅ Campo "Objetivo Principal" marcado como requerido (*)
5. Seleccionar objetivo → Guardar
6. ✅ Ver objetivo en Dashboard
7. ✅ No más alerta amarilla

### Test 2: Añadir Peso por Primera Vez
1. Ir a Settings
2. Completar "Peso (kg)" = 75.5
3. Guardar
4. ✅ Verificar en Supabase: SELECT * FROM body_metrics;
5. ✅ Ver peso en Dashboard con fecha actual

### Test 3: Actualizar Peso
1. Ir a Settings
2. Cambiar peso de 75.5 → 76.0
3. Guardar
4. ✅ Verificar en Supabase: 2 filas en body_metrics (historial)
5. ✅ Dashboard muestra 76.0 kg con fecha actualizada

### Test 4: Validaciones
1. Intentar peso = 10 (< 20)
2. ✅ Input no permite o servicio rechaza
3. Intentar altura = 300 (> 250)
4. ✅ Servicio rechaza con error
5. Intentar fecha objetivo = ayer
6. ✅ Date picker bloquea o servicio rechaza

### Test 5: Responsividad
1. Abrir en móvil (< 1024px)
2. ✅ MemberStatsCard aparece abajo del main content
3. Abrir en desktop (≥ 1024px)
4. ✅ MemberStatsCard aparece en sidebar derecho

---

## 🐛 Troubleshooting

### Error: "relation 'body_metrics' does not exist"
**Solución:** Ejecuta el script SQL de migración en Supabase.

### Error: "column 'goal_type' does not exist"
**Solución:** Ejecuta el script SQL para añadir columnas a users.

### Peso no se guarda
**Check:**
1. Console del navegador → ver errores
2. Verificar que `insertBodyMetric` se está llamando
3. Verificar políticas RLS en body_metrics
4. Probar query manual en Supabase SQL Editor

### Peso no aparece en Dashboard
**Check:**
1. Verificar que hay datos: `SELECT * FROM body_metrics WHERE user_id = 'xxx'`
2. Ver console: `[MemberStats] Error al cargar métrica`
3. Verificar que `getMyLatestBodyMetric()` no tiene errores

---

## 📝 Próximos Pasos (Futuro)

### Features Pendientes:
- [ ] Gráfico de evolución de peso (line chart)
- [ ] Calculadora de IMC en tiempo real
- [ ] Recomendaciones basadas en goal_type
- [ ] Editar/eliminar métricas antiguas
- [ ] Exportar historial a CSV
- [ ] Metas de peso dentro de goal (target_weight)
- [ ] Fotos de progreso (progress_photos table)

### Mejoras de UX:
- [ ] Modal para añadir peso rápido sin ir a Settings
- [ ] Notificaciones "¿Quieres registrar tu peso de hoy?"
- [ ] Comparación "hace 1 semana/mes"
- [ ] Badges de logros ("Has registrado peso 30 días seguidos")

---

## 📚 Recursos

### Archivos Clave:
- **BD:** `database/migrate_users_and_create_body_metrics.sql`
- **Tipos:** `frontend/src/lib/supabase/types.ts`
- **Servicios:** `frontend/src/services/bodyMetrics.ts`, `userProfile.ts`
- **Componentes:** `frontend/src/components/member/MemberStatsCard.tsx`
- **Páginas:** `frontend/src/pages/Settings.tsx`, `MemberDashboard.tsx`

### Comandos Útiles:
```bash
# Frontend dev server
cd frontend && npm run dev

# Ver logs de Supabase
# → Ir a Supabase Dashboard → Logs → PostgreSQL

# Query útil: ver todas las métricas de un usuario
SELECT 
  bm.*,
  u.name,
  u.email
FROM body_metrics bm
JOIN users u ON u.user_id = bm.user_id
WHERE bm.user_id = 'xxx'
ORDER BY bm.recorded_at DESC;
```

---

## ✅ Checklist de Implementación

### Backend (Supabase):
- [x] Crear enum goal_type
- [x] Añadir columnas a users (goal_type, goal_notes, goal_target_date, onboarding_completed)
- [x] Renombrar height → height_cm
- [x] Eliminar weight, goal obsoletos
- [x] Crear tabla body_metrics
- [x] Configurar RLS en body_metrics
- [x] Crear índices
- [x] Verificar migración

### Frontend (React):
- [x] Actualizar tipos TypeScript
- [x] Crear servicio bodyMetrics
- [x] Actualizar servicio userProfile
- [x] Actualizar Settings con nuevos campos
- [x] Crear MemberStatsCard component
- [x] Integrar en MemberDashboard
- [x] Validaciones en formularios
- [x] Loading states
- [x] Error handling
- [x] Responsive design

### Testing:
- [ ] Test onboarding nuevo usuario
- [ ] Test añadir peso primera vez
- [ ] Test actualizar peso (historial)
- [ ] Test validaciones
- [ ] Test responsive mobile/desktop
- [ ] Test RLS policies

---

**¡IMPORTANTE!** 🚨
Antes de usar en producción:
1. ✅ Ejecutar script SQL en Supabase
2. ✅ Verificar que body_metrics existe
3. ✅ Probar crear métrica manual
4. ✅ Verificar RLS con diferentes usuarios
5. ✅ Hacer backup de BD antes de migrar

**Frontend corriendo en:** http://localhost:5177/

---

Creado: 22 Enero 2026
Última actualización: 22 Enero 2026
