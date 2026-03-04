// ============================================================================
// useCalendar — Calendario funcional con carga de sesiones por mes
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getMonthSessions, getDaySessions } from '../services/trainingService';
import type { CalendarDayData, WorkoutSession } from '../types';

const toISO = (d: Date) => d.toISOString().split('T')[0];
const todayISO = toISO(new Date());

export const MONTH_NAMES_ES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
];

export function buildCalendarGrid(year: number, month: number): (number | null)[] {
  const firstDay    = new Date(year, month, 1).getDay();
  const lastDate    = new Date(year, month + 1, 0).getDate();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1; // Monday-first
  const days: (number | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDate; d++) days.push(d);
  // Pad to full weeks
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

interface UseCalendarResult {
  year:          number;
  month:         number;
  calDays:       (number | null)[];
  monthName:     string;
  selectedDate:  string;
  calendarData:  Map<string, CalendarDayData>;
  daySessions:   WorkoutSession[];
  loading:       boolean;
  dayLoading:    boolean;
  selectDate:    (iso: string) => void;
  prevMonth:     () => void;
  nextMonth:     () => void;
  goToToday:     () => void;
  refresh:       () => Promise<void>;
  refreshDay:    (date: string) => Promise<void>;
}

export function useCalendar(initialDate?: string): UseCalendarResult {
  const now        = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(initialDate ?? todayISO);

  const [calendarData, setCalendarData] = useState<Map<string, CalendarDayData>>(new Map());
  const [daySessions,  setDaySessions]  = useState<WorkoutSession[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [dayLoading,   setDayLoading]   = useState(false);

  // ── Load month sessions ────────────────────────────────────────────────────
  const loadMonth = useCallback(async (y: number, m: number) => {
    try {
      setLoading(true);
      const data = await getMonthSessions(y, m);
      const map  = new Map<string, CalendarDayData>();
      data.forEach(d => map.set(d.date, d));
      setCalendarData(map);
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // React StrictMode cleanup — safe to ignore
      console.error('[useCalendar] loadMonth:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMonth(year, month); }, [year, month, loadMonth]);

  // ── Load day sessions ──────────────────────────────────────────────────────
  const loadDay = useCallback(async (date: string) => {
    try {
      setDayLoading(true);
      const sessions = await getDaySessions(date);
      setDaySessions(sessions);
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // React StrictMode cleanup — safe to ignore
      console.error('[useCalendar] loadDay:', err);
      setDaySessions([]);
    } finally {
      setDayLoading(false);
    }
  }, []);

  useEffect(() => { loadDay(selectedDate); }, [selectedDate, loadDay]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  const prevMonth = useCallback(() => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else              setMonth(m => m - 1);
  }, [month]);

  const nextMonth = useCallback(() => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else               setMonth(m => m + 1);
  }, [month]);

  const goToToday = useCallback(() => {
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth());
    setSelectedDate(todayISO);
  }, []);

  const selectDate = useCallback((iso: string) => {
    setSelectedDate(iso);
    // If date is in a different month, navigate there
    const d  = new Date(iso + 'T12:00:00');
    const dy = d.getFullYear();
    const dm = d.getMonth();
    if (dy !== year || dm !== month) {
      setYear(dy);
      setMonth(dm);
    }
  }, [year, month]);

  const refresh = useCallback(() => loadMonth(year, month), [year, month, loadMonth]);
  const refreshDay = useCallback((date: string) => loadDay(date), [loadDay]);

  const calDays  = useMemo(() => buildCalendarGrid(year, month), [year, month]);
  const monthName = MONTH_NAMES_ES[month];

  return {
    year, month, calDays, monthName,
    selectedDate, calendarData, daySessions,
    loading, dayLoading,
    selectDate, prevMonth, nextMonth, goToToday,
    refresh, refreshDay,
  };
}
