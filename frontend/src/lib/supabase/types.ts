export type Role = 'admin' | 'trainer' | 'member';

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
  birth_date?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal?: string | null;
  level?: 'beginner' | 'intermediate' | 'advanced' | null;
  created_at: string;
  updated_at: string;
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
