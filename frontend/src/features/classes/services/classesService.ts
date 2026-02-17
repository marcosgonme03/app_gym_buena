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

const CLASS_SELECT_BASE = `
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
`;

function classSelect(includeVideo = true) {
  return includeVideo ? `${CLASS_SELECT_BASE}, video_url` : CLASS_SELECT_BASE;
}

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
  else if (myBooking && myBooking.status !== 'cancelled' && myBooking.status !== 'CANCELLED') availabilityState = 'booked';
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

async function fetchBookedCountsForSessions(sessionIds: string[]): Promise<Map<string, number>> {
  if (sessionIds.length === 0) return new Map();

  const { data, error } = await supabase.rpc('get_sessions_booking_counts', {
    p_session_ids: sessionIds,
  });

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  (data || []).forEach((row: { session_id: string; booked_count: number }) => {
    counts.set(row.session_id, row.booked_count || 0);
  });

  return counts;
}

export async function fetchClassSessionParticipants(sessionId: string, limit = 12) {
  const { data, error } = await supabase.rpc('get_class_session_participants', {
    p_session_id: sessionId,
    p_limit: limit,
  });

  if (error) throw new Error(error.message);
  return (data || []) as Array<{ user_id: string; full_name: string; avatar_url: string | null }>;
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
  if (uniqueIds.length === 0) return new Map<string, { user_id: string; name: string; last_name: string; email: string; avatar_url?: string | null }>();

  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id,name,last_name,email,avatar_url')
      .in('user_id', uniqueIds);

    if (error || !data) return new Map<string, { user_id: string; name: string; last_name: string; email: string; avatar_url?: string | null }>();
    return new Map(data.map((user) => [user.user_id, user]));
  } catch {
    return new Map<string, { user_id: string; name: string; last_name: string; email: string; avatar_url?: string | null }>();
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
  const buildQuery = (includeVideo: boolean) => {
    let query = supabase
      .from('classes')
      .select(classSelect(includeVideo))
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

    return query;
  };

  let { data, error } = await buildQuery(true);
  if (error?.message?.toLowerCase().includes('video_url')) {
    const fallback = await buildQuery(false);
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(error.message);
  return enrichGymClasses(data || []);
}

export async function fetchClassBySlug(slug: string): Promise<GymClass | null> {
  let { data, error } = await supabase
    .from('classes')
    .select(classSelect(true))
    .eq('slug', slug)
    .maybeSingle();

  if (error?.message?.toLowerCase().includes('video_url')) {
    const fallback = await supabase
      .from('classes')
      .select(classSelect(false))
      .eq('slug', slug)
      .maybeSingle();
    data = fallback.data;
    error = fallback.error;
  }

  if (error) throw new Error(error.message);
  if (!data) return null;
  const [enriched] = await enrichGymClasses([data]);
  return enriched || null;
}

export interface ClassDemandSignal {
  classId: string;
  recentBookings: number;
  previousBookings: number;
  trend: 'up' | 'steady' | 'down';
  label: 'Muy demandada' | '↑ Popular esta semana' | 'Estable';
}

export async function fetchClassDemandSignals(classIds: string[]): Promise<Record<string, ClassDemandSignal>> {
  const uniqueClassIds = Array.from(new Set(classIds.filter(Boolean)));
  if (uniqueClassIds.length === 0) return {};

  const { data: sessionsRows, error: sessionsError } = await supabase
    .from('class_sessions')
    .select('id,class_id')
    .in('class_id', uniqueClassIds);

  if (sessionsError) throw new Error(sessionsError.message);

  const sessionRows = (sessionsRows || []) as Array<{ id: string; class_id: string }>;
  const sessionIds = sessionRows.map((session) => session.id);
  if (sessionIds.length === 0) return {};

  const since = new Date();
  since.setDate(since.getDate() - 14);

  const { data: bookingRows, error: bookingsError } = await supabase
    .from('class_bookings')
    .select('session_id,booked_at,status')
    .in('session_id', sessionIds)
    .in('status', ['booked', 'confirmed', 'attended'])
    .gte('booked_at', since.toISOString());

  if (bookingsError) throw new Error(bookingsError.message);

  const sessionToClass = new Map(sessionRows.map((session) => [session.id, session.class_id]));
  const nowMs = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const recentCount = new Map<string, number>();
  const previousCount = new Map<string, number>();

  for (const booking of (bookingRows || []) as Array<{ session_id: string; booked_at: string }>) {
    const classId = sessionToClass.get(booking.session_id);
    if (!classId) continue;

    const age = nowMs - new Date(booking.booked_at).getTime();
    if (age <= sevenDaysMs) {
      recentCount.set(classId, (recentCount.get(classId) || 0) + 1);
    } else if (age <= sevenDaysMs * 2) {
      previousCount.set(classId, (previousCount.get(classId) || 0) + 1);
    }
  }

  const result: Record<string, ClassDemandSignal> = {};
  for (const classId of uniqueClassIds) {
    const recent = recentCount.get(classId) || 0;
    const previous = previousCount.get(classId) || 0;

    let trend: ClassDemandSignal['trend'] = 'steady';
    if (recent > previous) trend = 'up';
    if (recent < previous) trend = 'down';

    let label: ClassDemandSignal['label'] = 'Estable';
    if (recent >= 8) label = 'Muy demandada';
    else if (trend === 'up' && recent >= 3) label = '↑ Popular esta semana';

    result[classId] = {
      classId,
      recentBookings: recent,
      previousBookings: previous,
      trend,
      label,
    };
  }

  return result;
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
  const bookedCounts = await fetchBookedCountsForSessions(sessionIds);

  let myBookings: ClassBooking[] = [];
  if (userId) {
    const { data: myBookingsData, error: myBookingsError } = await supabase
      .from('class_bookings')
      .select('*')
      .eq('user_id', userId)
      .in('session_id', sessionIds)
      .in('status', ['booked', 'confirmed', 'attended', 'cancelled', 'CANCELLED', 'no_show']);

    if (myBookingsError) throw new Error(myBookingsError.message);
    myBookings = (myBookingsData || []) as ClassBooking[];
  }

  return sessions.map((session) => {
    const myBooking = myBookings.find((booking) => booking.session_id === session.id) || null;
    return mapAvailability(session, bookedCounts.get(session.id) || 0, myBooking);
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

  if (error) {
    const fallback = await supabase
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
      .eq('status', 'confirmed')
      .eq('class_sessions.class_id', classId)
      .gte('class_sessions.starts_at', nowIso)
      .order('booked_at', { ascending: true })
      .limit(limit);

    if (fallback.error) throw new Error(fallback.error.message);
    return enrichClassBookings(fallback.data || []);
  }

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

  const bookedCounts = await fetchBookedCountsForSessions(sessionIds);

  let myBookings: ClassBooking[] = [];
  if (userId) {
    const { data: myBookingsData, error: myBookingsError } = await supabase
      .from('class_bookings')
      .select('*')
      .eq('user_id', userId)
      .in('session_id', sessionIds)
      .in('status', ['booked', 'confirmed', 'attended', 'cancelled', 'CANCELLED', 'no_show']);

    if (myBookingsError) throw new Error(myBookingsError.message);
    myBookings = (myBookingsData || []) as ClassBooking[];
  }

  const result = sessions.map((session) => {
    const myBooking = myBookings.find((booking) => booking.session_id === session.id) || null;
    return mapAvailability(session, bookedCounts.get(session.id) || 0, myBooking);
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
    .in('status', ['booked', 'confirmed'])
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
  const attempt = await supabase.rpc('book_class_session', { p_session_id: sessionId });
  let data = attempt.data;
  let error = attempt.error;

  if (error) {
    const fallback = await supabase.rpc('book_class', { p_session_id: sessionId });
    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    const message = error.message || 'No se pudo reservar la clase';
    if (message.includes('FULL')) throw new Error('Clase completa. Prueba otro horario.');
    if (message.includes('ALREADY')) throw new Error('Ya tienes una reserva para esta sesión.');
    throw new Error(message);
  }

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
