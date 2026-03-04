// ============================================================================
// NutritionHistoryPage — Historial de días registrados
// Ruta: /app/nutrition/history
// ============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopNav } from '@/components/layout/TopNav';
import { supabase } from '@/lib/supabase/client';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function relativeDay(iso: string): string {
  const today = new Date().toISOString().split('T')[0];
  const diff  = Math.round(
    (new Date(today + 'T00:00:00').getTime() - new Date(iso + 'T00:00:00').getTime()) / 86400000,
  );
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff < 7)   return `${diff} días atrás`;
  return fmtDate(iso);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface DayRecord {
  entry_date: string;
  total_calories: number;
  total_protein_g: number;
  total_carbs_g: number;
  total_fat_g: number;
  item_count: number;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const NutritionHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [days,    setDays]    = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No autenticado');

      const { data, error: err } = await supabase
        .from('nutrition_entries')
        .select('entry_date, calories, protein_g, carbs_g, fat_g')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (err) throw err;

      // Aggregate by date in JS (minor calc, just grouping)
      const byDate: Record<string, DayRecord> = {};
      for (const row of (data || []) as any[]) {
        const d = row.entry_date as string;
        if (!byDate[d]) {
          byDate[d] = {
            entry_date:     d,
            total_calories: 0,
            total_protein_g: 0,
            total_carbs_g:   0,
            total_fat_g:     0,
            item_count:      0,
          };
        }
        byDate[d].total_calories  += Number(row.calories)  || 0;
        byDate[d].total_protein_g += Number(row.protein_g) || 0;
        byDate[d].total_carbs_g   += Number(row.carbs_g)   || 0;
        byDate[d].total_fat_g     += Number(row.fat_g)     || 0;
        byDate[d].item_count      += 1;
      }

      setDays(Object.values(byDate).sort((a, b) => b.entry_date.localeCompare(a.entry_date)));
    } catch (e: any) {
      setError(e.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-dark-950 flex flex-col">
      <TopNav />

      <div className="flex-1 w-full max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/nutrition')}
            className="p-2 rounded-xl bg-dark-800 hover:bg-dark-700 border border-dark-700 text-dark-400 hover:text-dark-100 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-black text-dark-50">Historial</h1>
            <p className="text-sm text-dark-500 mt-0.5">Registro nutricional por día</p>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="bg-dark-900 border border-dark-800 rounded-2xl p-5 animate-pulse">
                <div className="flex justify-between">
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-dark-800 rounded" />
                    <div className="h-3 w-16 bg-dark-800 rounded" />
                  </div>
                  <div className="flex gap-4">
                    {[...Array(4)].map((_, j) => (
                      <div key={j} className="h-6 w-12 bg-dark-800 rounded" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={load} className="mt-2 text-xs text-red-400 underline">Reintentar</button>
          </div>
        ) : days.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl mb-4">🥗</span>
            <h2 className="text-lg font-bold text-dark-300 mb-1">Sin registros aún</h2>
            <p className="text-sm text-dark-500 mb-6">Empieza registrando tu primera comida</p>
            <button
              onClick={() => navigate('/app/nutrition')}
              className="px-6 py-3 rounded-xl bg-primary-500 hover:bg-primary-400 text-white text-sm font-bold shadow-lg shadow-primary-500/20 transition-all"
            >
              Ir a Nutrición
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {days.map(day => (
              <div
                key={day.entry_date}
                className="bg-dark-900 border border-dark-800 hover:border-dark-700 rounded-2xl p-5 cursor-pointer group transition-all"
                onClick={() => navigate(`/app/nutrition?date=${day.entry_date}`)}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Date */}
                  <div>
                    <p className="text-sm font-bold text-dark-200 group-hover:text-dark-50 transition-colors">
                      {relativeDay(day.entry_date)}
                    </p>
                    <p className="text-xs text-dark-600">{fmtDate(day.entry_date)} · {day.item_count} alimentos</p>
                  </div>
                  {/* Macros */}
                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20">
                      {Math.round(day.total_calories)} kcal
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {Math.round(day.total_protein_g)}g P
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {Math.round(day.total_carbs_g)}g C
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      {Math.round(day.total_fat_g)}g G
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
