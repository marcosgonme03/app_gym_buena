import { supabase } from '@/lib/supabase/client';
import type {
  BookRpcResult,
  ClassBooking,
  ClassesFilters,
  ClassSession,
  GymClass,
  SessionWithAvailability,
} from '@/features/classes/types';

export const BOOKING_UPDATED_EVENT = 'classes:booking-updated';

export function notifyBookingUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(BOOKING_UPDATED_EVENT));
  }
}

function toIsoStart(date: string) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toIsoEnd(date: string) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function mapAvailability(session: ClassSession, bookedCount: number, myBooking: ClassBooking | null): SessionWithAvailability {
  const effectiveCapacity = session.capacity_override ?? session.classes.capacity;
  const remainingSpots = Math.max(0, effectiveCapacity - bookedCount);

  let availabilityState: SessionWithAvailability['availabilityState'] = 'available';
  if (session.is_cancelled) availabilityState = 'cancelled';
  else if (myBooking && myBooking.status !== 'cancelled') availabilityState = 'booked';
  else if (remainingSpots <= 0) availabilityState = 'full';
  else if (remainingSpots <= 3) availabilityState = 'few_left';

  return {
    ...session,
    bookedCount,
    remainingSpots,
    occupancyRatio: Math.min(1, bookedCount / Math.max(1, effectiveCapacity)),
    myBooking,
    availabilityState,
  };
}

function applyFilters(sessions: SessionWithAvailability[], filters: ClassesFilters) {
  return sessions.filter((session) => {
    const title = session.classes.title.toLowerCase();
    const description = (session.classes.description || '').toLowerCase();
    const search = filters.search.toLowerCase().trim();

    if (search && !title.includes(search) && !description.includes(search)) return false;
    if (filters.level !== 'all' && session.classes.level !== filters.level) return false;
    if (filters.trainerUserId !== 'all' && session.classes.trainer_user_id !== filters.trainerUserId) return false;

    const weekday = new Date(session.starts_at).getDay().toString();
    if (filters.day !== 'all' && weekday !== filters.day) return false;

    if (filters.onlyAvailable && !(session.availabilityState === 'available' || session.availabilityState === 'few_left')) {
      return false;
    }

    return true;
  });
}

function normalizeGymClass(row: any): GymClass {
  const usersRelation = row?.users;
  const normalizedUser = Array.isArray(usersRelation)
    ? usersRelation[0] || null
    : (usersRelation ?? null);

  return {
    ...row,
    users: normalizedUser,
  } as GymClass;
}

function normalizeClassSession(row: any): ClassSession {
  return {
    ...row,
    classes: normalizeGymClass(row.classes),
  } as ClassSession;
}

function normalizeClassBooking(row: any): ClassBooking {
  const session = row?.class_sessions;
  return {
    ...row,
    class_sessions: session
      ? {
          ...session,
          classes: normalizeGymClass(session.classes),
        }
      : undefined,
  } as ClassBooking;
}

async function fetchUsersMap(userIds: string[]) {
  const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, { user_id: string; name: string; last_name: string; email: string }>();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id,name,last_name,email')
      .in('user_id', uniqueIds);

    if (error || !data) return new Map<string, { user_id: string; name: string; last_name: string; email: string }>();
    return new Map(data.map((user) => [user.user_id, user]));
  } catch {
    return new Map<string, { user_id: string; name: string; last_name: string; email: string }>();
  }
}

async function enrichGymClasses(rows: any[]): Promise<GymClass[]> {
  const usersMap = await fetchUsersMap(rows.map((row) => row?.trainer_user_id));
  return rows.map((row) =>
    normalizeGymClass({
      ...row,
      users: usersMap.get(row?.trainer_user_id ?? '') ?? null,
    })
  );
}

async function enrichClassSessions(rows: any[]): Promise<ClassSession[]> {
  const usersMap = await fetchUsersMap(rows.map((row) => row?.classes?.trainer_user_id));
  return rows.map((row) =>
    normalizeClassSession({
      ...row,
      classes: {
        ...row.classes,
        users: usersMap.get(row?.classes?.trainer_user_id ?? '') ?? null,
      },
    })
  );
}

async function enrichClassBookings(rows: any[]): Promise<ClassBooking[]> {
  const usersMap = await fetchUsersMap(rows.map((row) => row?.class_sessions?.classes?.trainer_user_id));
  return rows.map((row) =>
    normalizeClassBooking({
      ...row,
      class_sessions: row?.class_sessions
        ? {
            ...row.class_sessions,
            classes: {
              ...row.class_sessions.classes,
              users: usersMap.get(row?.class_sessions?.classes?.trainer_user_id ?? '') ?? null,
            },
          }
        : row.class_sessions,
    })
  );
}

export async function fetchClassesCatalog(params?: {
  search?: string;
  level?: 'all' | 'beginner' | 'intermediate' | 'advanced';
  onlyActive?: boolean;
}): Promise<GymClass[]> {
  let query = supabase
    .from('classes')
    .select(`
      id,
      title,
      slug,
      description,
      trainer_user_id,
      level,
      duration_min,
      capacity,
      cover_image_url,
      is_active,
      created_at,
      updated_at
    `)
    .order('title', { ascending: true });

  if (params?.onlyActive !== false) {
    query = query.eq('is_active', true);
  }

  if (params?.search?.trim()) {
    query = query.ilike('title', `%${params.search.trim()}%`);
  }

  if (params?.level && params.level !== 'all') {
    query = query.eq('level', params.level);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return enrichGymClasses(data || []);
}

export async function fetchClassBySlug(slug: string): Promise<GymClass | null> {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      id,
      title,
      slug,
      description,
      trainer_user_id,
      level,
      duration_min,
      capacity,
      cover_image_url,
      is_active,
      created_at,
      updated_at
    `)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const [enriched] = await enrichGymClasses([data]);
  return enriched || null;
}

export async function fetchClassSessionsByClass(classId: string, from?: string, to?: string): Promise<SessionWithAvailability[]> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  let query = supabase
    .from('class_sessions')
    .select(`
      *,
      classes!inner (
        id,
        title,
        slug,
        description,
        trainer_user_id,
        level,
        duration_min,
        capacity,
        cover_image_url,
        is_active,
        created_at,
        updated_at
      )
    `)
    .eq('class_id', classId)
    .order('starts_at', { ascending: true });

  if (from) query = query.gte('starts_at', from);
  if (to) query = query.lte('starts_at', to);

  const { data: sessionsData, error: sessionsError } = await query;
  if (sessionsError) throw new Error(sessionsError.message);

  const sessions = await enrichClassSessions(sessionsData || []);
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((session) => session.id);
  const { data: bookingsData, error: bookingsError } = await supabase
    .from('class_bookings')
    .select('*')
    .in('session_id', sessionIds)
    .in('status', ['booked', 'attended', 'cancelled', 'no_show']);

  if (bookingsError) throw new Error(bookingsError.message);

  const bookings = (bookingsData || []) as ClassBooking[];

  return sessions.map((session) => {
    const sessionBookings = bookings.filter((booking) => booking.session_id === session.id);
    const activeBookings = sessionBookings.filter((booking) => booking.status === 'booked' || booking.status === 'attended');
    const myBooking = userId ? sessionBookings.find((booking) => booking.user_id === userId) || null : null;
    return mapAvailability(session, activeBookings.length, myBooking);
  });
}

export async function fetchMyBookingsForClass(classId: string, limit = 5): Promise<ClassBooking[]> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('class_bookings')
    .select(`
      *,
      class_sessions!inner (
        *,
        classes!inner (
          id,
          title,
          slug,
          description,
          trainer_user_id,
          level,
          duration_min,
          capacity,
          cover_image_url,
          is_active,
          created_at,
          updated_at
        )
      )
    `)
    .eq('status', 'booked')
    .eq('class_sessions.class_id', classId)
    .gte('class_sessions.starts_at', nowIso)
    .order('booked_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return enrichClassBookings(data || []);
}

export async function fetchClassesWeek(
  weekStart: string,
  weekEnd: string,
  filters: ClassesFilters
): Promise<SessionWithAvailability[]> {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;

  const { data: sessionsData, error: sessionsError } = await supabase
    .from('class_sessions')
    .select(`
      *,
      classes!inner (
        id,
        title,
        slug,
        description,
        trainer_user_id,
        level,
        duration_min,
        capacity,
        cover_image_url,
        is_active,
        created_at,
        updated_at
      )
    `)
    .gte('starts_at', toIsoStart(weekStart))
    .lte('starts_at', toIsoEnd(weekEnd))
    .order('starts_at', { ascending: true });

  if (sessionsError) throw new Error(sessionsError.message);

  const sessions = await enrichClassSessions(sessionsData || []);
  if (sessions.length === 0) return [];

  const sessionIds = sessions.map((session) => session.id);

  const { data: bookingsData, error: bookingsError } = await supabase
    .from('class_bookings')
    .select('*')
    .in('session_id', sessionIds)
    .in('status', ['booked', 'attended', 'cancelled', 'no_show']);

  if (bookingsError) throw new Error(bookingsError.message);

  const bookings = (bookingsData || []) as ClassBooking[];

  const result = sessions.map((session) => {
    const sessionBookings = bookings.filter((booking) => booking.session_id === session.id);
    const activeBookings = sessionBookings.filter((booking) => booking.status === 'booked' || booking.status === 'attended');
    const myBooking = userId ? sessionBookings.find((booking) => booking.user_id === userId) || null : null;

    return mapAvailability(session, activeBookings.length, myBooking);
  });

  return applyFilters(result, filters);
}

export async function fetchMyUpcomingBookings(limit = 5): Promise<ClassBooking[]> {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('class_bookings')
    .select(`
      *,
      class_sessions!inner (
        *,
        classes!inner (
          id,
          title,
          slug,
          description,
          trainer_user_id,
          level,
          duration_min,
          capacity,
          cover_image_url,
          is_active,
          created_at,
          updated_at
        )
      )
    `)
    .eq('status', 'booked')
    .gte('class_sessions.starts_at', nowIso)
    .order('booked_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  return enrichClassBookings(data || []);
}

export async function fetchTrainersList() {
  const { data, error } = await supabase
    .from('users')
    .select('user_id,name,last_name,role')
    .eq('role', 'trainer')
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function bookClass(sessionId: string): Promise<BookRpcResult> {
  const { data, error } = await supabase.rpc('book_class', { p_session_id: sessionId });
  if (error) throw new Error(error.message);
  if ((data as BookRpcResult)?.success) {
    notifyBookingUpdated();
  }
  return data as BookRpcResult;
}

export async function cancelClass(sessionId: string): Promise<BookRpcResult> {
  const { data, error } = await supabase.rpc('cancel_class_booking', { p_session_id: sessionId });
  if (error) throw new Error(error.message);
  if ((data as BookRpcResult)?.success) {
    notifyBookingUpdated();
  }
  return data as BookRpcResult;
}

export async function fetchTrainerSessionsWithBookings(weekStart: string, weekEnd: string) {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) throw new Error('Usuario no autenticado');

  const { data, error } = await supabase
    .from('class_sessions')
    .select(`
      *,
      classes!inner (*),
      class_bookings (
        *,
        users:user_id (
          user_id,
          name,
          last_name,
          email
        )
      )
    `)
    .eq('classes.trainer_user_id', userId)
    .gte('starts_at', toIsoStart(weekStart))
    .lte('starts_at', toIsoEnd(weekEnd))
    .order('starts_at', { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function markAttendance(bookingId: string, status: 'attended' | 'no_show'): Promise<BookRpcResult> {
  const { data, error } = await supabase.rpc('mark_class_attendance', {
    p_booking_id: bookingId,
    p_status: status,
  });
  if (error) throw new Error(error.message);
  return data as BookRpcResult;
}

export async function createClass(payload: {
  title: string;
  description?: string;
  trainer_user_id: string;
  level?: 'beginner' | 'intermediate' | 'advanced' | null;
  duration_min: number;
  capacity: number;
}) {
  const { data, error } = await supabase
    .from('classes')
    .insert({
      ...payload,
      name: payload.title,
      trainer_id: payload.trainer_user_id,
      date: new Date().toISOString().split('T')[0],
      start_time: '08:00',
      end_time: '09:00',
      is_active: true,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as GymClass;
}

export async function updateClass(classId: string, payload: Partial<Pick<GymClass, 'title' | 'description' | 'trainer_user_id' | 'level' | 'duration_min' | 'capacity' | 'is_active'>>) {
  const patch: Record<string, unknown> = { ...payload };
  if (payload.title) patch.name = payload.title;
  if (payload.trainer_user_id) patch.trainer_id = payload.trainer_user_id;

  const { data, error } = await supabase
    .from('classes')
    .update(patch)
    .eq('id', classId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as GymClass;
}

export async function createClassSession(payload: {
  class_id: string;
  starts_at: string;
  ends_at: string;
  capacity_override?: number | null;
}) {
  const { data, error } = await supabase
    .from('class_sessions')
    .insert({
      ...payload,
      is_cancelled: false,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ClassSession;
}

export async function updateClassSession(sessionId: string, payload: Partial<Pick<ClassSession, 'starts_at' | 'ends_at' | 'capacity_override' | 'is_cancelled'>>) {
  const { data, error } = await supabase
    .from('class_sessions')
    .update(payload)
    .eq('id', sessionId)
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ClassSession;
}
