// ============================================================================
// HELPERS PARA MANEJO DE SEMANAS (ISO 8601)
// Lunes como inicio de semana
// ============================================================================

/**
 * Obtiene el lunes de la semana que contiene la fecha dada
 * @param date - Fecha (Date o string ISO)
 * @returns string YYYY-MM-DD del lunes de esa semana
 */
export function getWeekStart(date: Date | string = new Date()): string {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  
  // Obtener día de la semana (0 = domingo, 1 = lunes, ..., 6 = sábado)
  const dayOfWeek = d.getDay();
  
  // Calcular cuántos días restar para llegar al lunes
  // Si es domingo (0), restar 6 días; si es lunes (1), restar 0; etc.
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Crear nueva fecha para el lunes
  const monday = new Date(d);
  monday.setDate(d.getDate() - daysToSubtract);
  
  // Formatear a YYYY-MM-DD
  return formatDateToISO(monday);
}

/**
 * Obtiene el domingo de la semana que contiene la fecha dada
 * @param date - Fecha (Date o string ISO)
 * @returns string YYYY-MM-DD del domingo de esa semana
 */
export function getWeekEnd(date: Date | string = new Date()): string {
  const weekStart = getWeekStart(date);
  return addDays(weekStart, 6);
}

/**
 * Añade o resta semanas a una fecha
 * @param weekStart - Fecha base (string YYYY-MM-DD)
 * @param delta - Número de semanas a añadir (positivo) o restar (negativo)
 * @returns string YYYY-MM-DD del nuevo lunes
 */
export function addWeeks(weekStart: string, delta: number): string {
  const date = new Date(weekStart);
  date.setDate(date.getDate() + (delta * 7));
  return formatDateToISO(date);
}

/**
 * Añade o resta días a una fecha
 * @param dateStr - Fecha base (string YYYY-MM-DD)
 * @param days - Número de días a añadir/restar
 * @returns string YYYY-MM-DD
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateToISO(date);
}

/**
 * Formatea una fecha como YYYY-MM-DD
 * @param date - Fecha a formatear
 * @returns string YYYY-MM-DD
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formatea un rango de semana para mostrar en UI
 * @param weekStart - Lunes de la semana (YYYY-MM-DD)
 * @returns string "22–28 Ene 2026"
 */
export function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(start.getDate() + 6);
  
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  // Mes en español (3 letras)
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const month = months[end.getMonth()];
  const year = end.getFullYear();
  
  // Si están en el mismo mes
  if (start.getMonth() === end.getMonth()) {
    return `${startDay}–${endDay} ${month} ${year}`;
  }
  
  // Si están en meses diferentes
  const startMonth = months[start.getMonth()];
  return `${startDay} ${startMonth} – ${endDay} ${month} ${year}`;
}

/**
 * Verifica si una fecha está dentro de una semana específica
 * @param date - Fecha a verificar (YYYY-MM-DD)
 * @param weekStart - Lunes de la semana (YYYY-MM-DD)
 * @returns boolean
 */
export function isDateInWeek(date: string, weekStart: string): boolean {
  const d = new Date(date);
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(start.getDate() + 6);
  
  return d >= start && d <= end;
}

/**
 * Verifica si una fecha de inicio de semana es la semana actual
 * @param weekStart - Lunes de la semana (YYYY-MM-DD)
 * @returns boolean
 */
export function isCurrentWeek(weekStart: string): boolean {
  const currentWeekStart = getWeekStart(new Date());
  return weekStart === currentWeekStart;
}

/**
 * Obtiene el nombre del día de la semana
 * @param dateStr - Fecha (YYYY-MM-DD)
 * @returns string "Lunes", "Martes", etc.
 */
export function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[date.getDay()];
}

/**
 * Formatea una fecha para mostrar en UI
 * @param dateStr - Fecha (YYYY-MM-DD)
 * @returns string "22 Ene"
 */
export function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

/**
 * Obtiene todos los días de una semana
 * @param weekStart - Lunes de la semana (YYYY-MM-DD)
 * @returns string[] Array de 7 fechas (lunes a domingo)
 */
export function getWeekDays(weekStart: string): string[] {
  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(weekStart, i));
  }
  return days;
}

/**
 * Valida que una fecha sea válida y esté en formato correcto
 * @param dateStr - Fecha a validar (YYYY-MM-DD)
 * @returns boolean
 */
export function isValidDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Compara dos fechas
 * @param date1 - Primera fecha (YYYY-MM-DD)
 * @param date2 - Segunda fecha (YYYY-MM-DD)
 * @returns number (-1 si date1 < date2, 0 si iguales, 1 si date1 > date2)
 */
export function compareDates(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1 < d2 ? -1 : d1 > d2 ? 1 : 0;
}
