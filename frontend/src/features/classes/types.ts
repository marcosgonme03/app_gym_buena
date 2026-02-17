export type BookingStatus = 'booked' | 'confirmed' | 'cancelled' | 'CANCELLED' | 'attended' | 'no_show';

export interface GymClass {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  trainer_user_id: string;
  level: 'beginner' | 'intermediate' | 'advanced' | null;
  duration_min: number;
  capacity: number;
  cover_image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  users?: {
    user_id: string;
    name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
}

export interface ClassSession {
  id: string;
  class_id: string;
  starts_at: string;
  ends_at: string;
  capacity_override: number | null;
  is_cancelled: boolean;
  created_at: string;
  updated_at: string;
  classes: GymClass;
}

export interface ClassBooking {
  id: string;
  session_id: string;
  user_id: string;
  status: BookingStatus;
  booked_at: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  class_sessions?: ClassSession;
  users?: {
    user_id: string;
    name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
}

export interface SessionWithAvailability extends ClassSession {
  bookedCount: number;
  remainingSpots: number;
  occupancyRatio: number;
  myBooking: ClassBooking | null;
  availabilityState: 'available' | 'few_left' | 'full' | 'booked' | 'cancelled';
}

export interface ClassesFilters {
  search: string;
  level: 'all' | 'beginner' | 'intermediate' | 'advanced';
  trainerUserId: 'all' | string;
  day: 'all' | '1' | '2' | '3' | '4' | '5' | '6' | '0';
  onlyAvailable: boolean;
}

export interface BookRpcResult {
  success: boolean;
  code: string;
  message?: string;
  booking_id?: string;
}
