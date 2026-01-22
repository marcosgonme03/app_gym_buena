# Member Components - Documentación Técnica

## 📁 Estructura de Componentes

```
frontend/src/
├── components/
│   └── member/
│       ├── ActiveGoal.tsx           # Objetivo activo del usuario
│       ├── WeeklySummary.tsx        # Resumen semanal inteligente
│       ├── QuickActions.tsx         # Acciones rápidas (4 botones)
│       ├── MotivationalFeedback.tsx # Mensajes motivacionales dinámicos
│       ├── WeeklyInsights.tsx       # Análisis comparativo semanal
│       └── StreakTracker.tsx        # Racha y logros (gamificación)
├── types/
│   └── member.ts                    # TypeScript interfaces
└── pages/
    └── MemberDashboard.tsx          # Dashboard principal integrado
```

---

## 🧩 Componentes Individuales

### 1. ActiveGoal.tsx

**Propósito**: Mostrar el objetivo principal del usuario con progreso visual.

**Props**:
```typescript
interface ActiveGoalProps {
  goal: UserGoal | null;      // Objetivo activo o null si no existe
  onEditGoal?: () => void;     // Callback para editar objetivo
}
```

**Estados**:
- **Con objetivo**: Card con gradiente, barra de progreso, métricas
- **Sin objetivo**: Estado vacío con CTA "Configurar objetivo"

**Características**:
- Cálculo automático de días restantes
- Barra de progreso animada
- Visualización de métricas (peso, grasa corporal)
- Responsive (compacto en mobile, expandido en desktop)

**Uso**:
```tsx
<ActiveGoal 
  goal={userGoal} 
  onEditGoal={() => navigate('/app/goal')}
/>
```

---

### 2. WeeklySummary.tsx

**Propósito**: Mostrar qué toca hoy, mañana y próxima clase reservada.

**Props**:
```typescript
interface WeeklySummaryProps {
  summary: WeeklySummaryType;    // Datos de la semana
  onViewPlanning?: () => void;   // Callback para ver planificación completa
}
```

**Estructura**:
- Barra de progreso semanal (X/Y entrenamientos)
- Card destacada: Entrenamiento de hoy
- Card secundaria: Entrenamiento de mañana
- Card especial: Próxima clase reservada
- CTA: "Ver planificación completa"

**Jerarquía Visual**:
1. Hoy → gradiente primary (más llamativo)
2. Mañana → gris (secundario)
3. Próxima clase → purple/pink (diferenciado)

**Uso**:
```tsx
<WeeklySummary 
  summary={weeklySummary}
  onViewPlanning={() => navigate('/app/workout')}
/>
```

---

### 3. QuickActions.tsx

**Propósito**: Acciones más comunes del usuario a 1 tap.

**Props**:
```typescript
interface QuickActionsProps {
  onCompleteWorkout?: () => void;  // Marcar entrenamiento completado
  onChangeWorkout?: () => void;    // Cambiar entrenamiento del día
  onBookClass?: () => void;        // Reservar clase
  onAddNote?: () => void;          // Añadir nota post-entreno
  workoutCompleted?: boolean;      // Estado del entrenamiento
}
```

**Acciones**:
1. **Marcar completado** (verde) → Solo activa si workout NO completado
2. **Cambiar entreno** (azul) → Solo activa si workout NO completado
3. **Reservar clase** (purple) → Siempre activa
4. **Añadir nota** (naranja) → Siempre activa

**Lógica de Estados**:
```typescript
// Si workout está completado:
- "Marcar completado" → disabled, muestra "Completado"
- "Cambiar entreno" → disabled (no puedes cambiar lo que ya hiciste)

// Si workout NO completado:
- Todas las acciones activas
```

**Uso**:
```tsx
<QuickActions
  onCompleteWorkout={handleComplete}
  onChangeWorkout={handleChange}
  onBookClass={handleBook}
  onAddNote={handleNote}
  workoutCompleted={false}
/>
```

---

### 4. MotivationalFeedback.tsx

**Propósito**: Mostrar mensajes motivacionales dinámicos con rotación automática.

**Props**:
```typescript
interface MotivationalFeedbackProps {
  messages: MotivationalMessage[];  // Array de mensajes
  streakDays?: number;              // Días de racha (para badge)
  progressPercentage?: number;      // Progreso del objetivo (para badge)
}
```

**Características**:
- Rotación automática cada 5 segundos
- Animación fade entre mensajes
- Gradiente dinámico según tipo de mensaje:
  - Achievement → amarillo-naranja-rosa
  - Encouragement → verde-esmeralda-teal
  - Milestone → purple-rosa
- Badges inferiores con racha y progreso
- Decoración de fondo con círculos blur

**Tipos de Mensajes**:
```typescript
type MessageType = 'achievement' | 'encouragement' | 'reminder' | 'milestone';
```

**Uso**:
```tsx
<MotivationalFeedback 
  messages={[
    {
      id: '1',
      type: 'achievement',
      message: '¡5 días de racha! Estás en fuego 🔥',
      priority: 'high'
    }
  ]}
  streakDays={5}
  progressPercentage={35}
/>
```

---

### 5. WeeklyInsights.tsx

**Propósito**: Mostrar análisis comparativo semanal (vs semana anterior).

**Props**:
```typescript
interface WeeklyInsightsProps {
  insights: WeeklyInsight[];  // Array de insights
}
```

**Tipos de Insights**:
```typescript
type InsightType = 'improvement' | 'decline' | 'stable' | 'milestone';
```

**Colores por Tipo**:
- **improvement**: Verde → "Has mejorado"
- **decline**: Naranja → "Ha bajado (atención)"
- **stable**: Gris → "Sin cambios"
- **milestone**: Purple → "¡Hito alcanzado!"

**Cada Insight Muestra**:
- Métrica principal
- Valor anterior vs actual
- Cambio porcentual
- Mensaje contextual
- Icono según tipo

**Uso**:
```tsx
<WeeklyInsights 
  insights={[
    {
      type: 'improvement',
      metric: 'Entrenamientos completados',
      currentValue: 4,
      previousValue: 3,
      change: 33,
      message: 'Has entrenado más que la semana pasada'
    }
  ]}
/>
```

---

### 6. StreakTracker.tsx

**Propósito**: Gamificación ligera con racha y logros discretos.

**Props**:
```typescript
interface StreakTrackerProps {
  streakData: StreakData;           // Datos de racha y logros
  onViewAchievements?: () => void;  // Callback para ver todos los logros
}
```

**Características**:
- Card principal con gradiente dinámico según racha:
  - 0 días → gris
  - 1-6 días → naranja-rojo
  - 7-13 días → rojo-rosa
  - 14-29 días → rojo-purple
  - 30+ días → rojo-purple intenso
- Icono de llama con `animate-pulse` cuando hay racha activa
- Badge flotante con "Mejor racha"
- Últimos 3 logros mostrados
- Rareza de logros (common/rare/epic) con colores diferenciados

**Uso**:
```tsx
<StreakTracker 
  streakData={{
    current: 5,
    longest: 12,
    lastWorkoutDate: '2026-01-22',
    achievements: [...]
  }}
  onViewAchievements={() => navigate('/app/achievements')}
/>
```

---

## 📝 Types (member.ts)

### UserGoal
```typescript
interface UserGoal {
  id: string;
  userId: string;
  goalType: 'muscle_gain' | 'fat_loss' | 'strength' | 'endurance' | 'flexibility' | 'general_fitness';
  targetDate: string;
  startDate: string;
  currentProgress: number; // 0-100
  metrics: {
    startWeight?: number;
    targetWeight?: number;
    currentWeight?: number;
    startBodyFat?: number;
    targetBodyFat?: number;
    currentBodyFat?: number;
  };
  isActive: boolean;
}
```

### WeeklySummary
```typescript
interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  todayWorkout: { name, type, duration, completed } | null;
  tomorrowWorkout: { name, type, duration } | null;
  nextClass: { id, name, date, instructor, spotsLeft } | null;
  weekStats: {
    workoutsCompleted: number;
    workoutsPlanned: number;
    classesAttended: number;
    totalMinutes: number;
  };
}
```

### StreakData
```typescript
interface StreakData {
  current: number;
  longest: number;
  lastWorkoutDate: string | null;
  achievements: Achievement[];
}

interface Achievement {
  id: string;
  type: 'workout' | 'streak' | 'goal' | 'milestone';
  title: string;
  description: string;
  unlockedAt: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic';
}
```

---

## 🎨 Guía de Estilos

### Gradientes Utilizados

```css
/* Motivational Feedback */
.achievement-gradient { @apply bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500; }
.encouragement-gradient { @apply bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500; }
.milestone-gradient { @apply bg-gradient-to-br from-purple-400 via-pink-500 to-rose-500; }

/* Streak Tracker (dinámico) */
.streak-inactive { @apply from-gray-400 to-gray-500; }
.streak-low { @apply from-orange-400 to-red-500; }
.streak-medium { @apply from-orange-500 to-red-600; }
.streak-high { @apply from-red-500 to-pink-600; }
.streak-legend { @apply from-red-600 to-purple-700; }

/* Quick Actions */
.action-complete { @apply from-green-500 to-emerald-500; }
.action-change { @apply from-blue-500 to-cyan-500; }
.action-book { @apply from-purple-500 to-pink-500; }
.action-note { @apply from-orange-500 to-yellow-500; }
```

### Animaciones

```css
/* Barras de progreso */
.progress-bar {
  @apply transition-all duration-500 ease-out;
}

/* Hover en cards */
.interactive-card {
  @apply hover:shadow-md active:scale-95 transition-all;
}

/* Pulse para racha */
.streak-active {
  @apply animate-pulse;
}

/* Rotación de mensajes */
.message-fade-out {
  @apply opacity-0 scale-95 transition-all duration-300;
}

.message-fade-in {
  @apply opacity-100 scale-100 transition-all duration-300;
}
```

---

## 🔧 Integración en MemberDashboard

### Layout Responsive

**Mobile** (<1024px):
```tsx
<main className="max-w-lg mx-auto">
  <div className="space-y-4">
    {/* Stack vertical */}
    <MotivationalFeedback />
    <QuickActions />
    <WeeklySummary />
    <WeeklyInsights />
    {/* Clases reservadas inline */}
  </div>
</main>
```

**Desktop** (≥1024px):
```tsx
<main className="max-w-7xl mx-auto">
  <div className="lg:grid lg:grid-cols-3 lg:gap-6">
    {/* Columna izquierda (2/3) */}
    <div className="lg:col-span-2">
      <MotivationalFeedback />
      <QuickActions />
      <WeeklySummary />
      <WeeklyInsights />
    </div>
    
    {/* Sidebar derecho (1/3) */}
    <div className="hidden lg:block">
      <ActiveGoal />
      <StreakTracker />
      {/* Clases reservadas */}
      {/* Membership card */}
    </div>
  </div>
</main>
```

---

## 🚀 Cómo Usar los Componentes

### 1. Importar Tipos
```typescript
import {
  UserGoal,
  WeeklySummary as WeeklySummaryType,
  MotivationalMessage,
  WeeklyInsight,
  StreakData
} from '@/types/member';
```

### 2. Importar Componentes
```typescript
import ActiveGoal from '@/components/member/ActiveGoal';
import WeeklySummary from '@/components/member/WeeklySummary';
import QuickActions from '@/components/member/QuickActions';
import MotivationalFeedback from '@/components/member/MotivationalFeedback';
import WeeklyInsights from '@/components/member/WeeklyInsights';
import StreakTracker from '@/components/member/StreakTracker';
```

### 3. Usar con Datos Mockeados
```typescript
const MOCK_DATA = {
  userGoal: { ... } as UserGoal,
  weeklySummary: { ... } as WeeklySummaryType,
  motivationalMessages: [...] as MotivationalMessage[],
  weeklyInsights: [...] as WeeklyInsight[],
  streakData: { ... } as StreakData
};

// En el render:
<ActiveGoal goal={MOCK_DATA.userGoal} />
<WeeklySummary summary={MOCK_DATA.weeklySummary} />
// etc...
```

---

## 🔌 Preparación para Backend

### Reemplazar Datos Mockeados

**Antes (mock)**:
```typescript
const MOCK_DATA = { ... };
```

**Después (backend)**:
```typescript
const { data: userGoal } = await supabase
  .from('user_goals')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true)
  .single();

const { data: weeklySummary } = await supabase
  .rpc('get_weekly_summary', { user_id: userId });
```

### Handlers de Eventos

Todos los componentes tienen callbacks opcionales preparados:

```typescript
// Ya implementado en MemberDashboard:
const handleCompleteWorkout = () => {
  // TODO: Guardar en backend
};

const handleEditGoal = () => {
  // TODO: Abrir modal de edición
};

const handleViewAchievements = () => {
  // TODO: Navegar a página de logros
};
```

---

## ✅ Checklist de Implementación

### Componentes
- [x] ActiveGoal.tsx
- [x] WeeklySummary.tsx
- [x] QuickActions.tsx
- [x] MotivationalFeedback.tsx
- [x] WeeklyInsights.tsx
- [x] StreakTracker.tsx

### Types
- [x] member.ts con todas las interfaces

### Integración
- [x] MemberDashboard actualizado
- [x] Layout responsive (mobile + desktop)
- [x] Datos mockeados realistas

### Pendiente
- [ ] Integración con backend real
- [ ] Modales (editar objetivo, añadir nota, ver logros)
- [ ] Páginas placeholder (/app/workout, /app/classes, /app/progress)
- [ ] Sistema de notificaciones
- [ ] Tests unitarios

---

## 📚 Referencias

- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)
- [React TypeScript](https://react-typescript-cheatsheet.netlify.app/)
- [Supabase Docs](https://supabase.com/docs)

---

**Última actualización**: Enero 2026  
**Versión**: 1.0.0  
**Autor**: Frontend Team
