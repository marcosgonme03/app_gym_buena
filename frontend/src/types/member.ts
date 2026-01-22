// Types para el módulo de miembros

export interface UserGoal {
  id: string;
  userId: string;
  goalType: 'muscle_gain' | 'fat_loss' | 'strength' | 'endurance' | 'flexibility' | 'general_fitness';
  targetDate: string; // ISO date
  startDate: string; // ISO date
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
  createdAt: string;
  updatedAt: string;
}

export interface WeeklySummary {
  weekStart: string; // ISO date
  weekEnd: string; // ISO date
  todayWorkout: {
    name: string;
    type: string;
    duration: number; // minutes
    completed: boolean;
  } | null;
  tomorrowWorkout: {
    name: string;
    type: string;
    duration: number; // minutes
  } | null;
  nextClass: {
    id: string;
    name: string;
    date: string; // ISO datetime
    instructor: string;
    spotsLeft: number;
  } | null;
  weekStats: {
    workoutsCompleted: number;
    workoutsPlanned: number;
    classesAttended: number;
    totalMinutes: number;
  };
}

export interface QuickAction {
  id: string;
  type: 'complete_workout' | 'change_workout' | 'book_class' | 'add_note';
  label: string;
  icon: string;
  enabled: boolean;
  action: () => void | Promise<void>;
}

export interface MotivationalMessage {
  id: string;
  type: 'achievement' | 'encouragement' | 'reminder' | 'milestone';
  message: string;
  context?: string;
  timestamp: string;
  priority: 'high' | 'medium' | 'low';
}

export interface WeeklyInsight {
  type: 'improvement' | 'decline' | 'stable' | 'milestone';
  metric: string;
  currentValue: number;
  previousValue: number;
  change: number; // percentage
  message: string;
  icon: string;
}

export interface StreakData {
  current: number; // días consecutivos
  longest: number; // mejor racha
  lastWorkoutDate: string | null; // ISO date
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  type: 'workout' | 'streak' | 'goal' | 'milestone';
  title: string;
  description: string;
  unlockedAt: string; // ISO date
  icon: string;
  rarity: 'common' | 'rare' | 'epic';
}

// Helper types
export type GoalTypeName = {
  [K in UserGoal['goalType']]: string;
};

export const GOAL_TYPE_NAMES: GoalTypeName = {
  muscle_gain: 'Ganar músculo',
  fat_loss: 'Perder grasa',
  strength: 'Aumentar fuerza',
  endurance: 'Mejorar resistencia',
  flexibility: 'Mejorar flexibilidad',
  general_fitness: 'Fitness general'
};
