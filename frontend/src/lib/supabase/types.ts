export type Role = 'admin' | 'trainer' | 'member';

// Tipos de objetivo de entrenamiento
export type GoalType = 
  | 'lose_fat' 
  | 'gain_muscle' 
  | 'strength' 
  | 'endurance' 
  | 'mobility' 
  | 'health';

export interface UserProfile {
  id: string;
  user_id: string;
  role: Role;
  name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
  phone?: string | null;
  bio?: string | null;
  date_of_birth?: string | null;
  height_cm?: number | null;  // Altura en cm (ahora en users)
  level?: 'beginner' | 'intermediate' | 'advanced' | null;
  
  // Nuevos campos de objetivo (solo para members)
  goal_type?: GoalType | null;
  goal_notes?: string | null;
  goal_target_date?: string | null;
  onboarding_completed?: boolean;
  
  created_at: string;
  updated_at: string;
}

// Nueva tabla body_metrics para tracking histórico de peso y altura
export interface BodyMetric {
  id: string;
  user_id: string;
  weight_kg: number;  // Peso en kilogramos
  height_cm?: number | null;  // Altura en centímetros (opcional, puede duplicarse desde users)
  recorded_at: string;  // Timestamp de cuándo se registró
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile: UserProfile;
}

// TODO: Tipos para cuando implementes las tablas de clases y reservas
export interface Class {
  id: string;
  title: string;
  description: string | null;
  trainer_id: string | null;
  capacity: number;
  schedule: string;
  duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  class_id: string;
  status: 'confirmed' | 'cancelled' | 'attended';
  booked_at: string;
  attended: boolean;
  created_at: string;
}
