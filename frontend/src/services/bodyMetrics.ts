import { supabase } from '@/lib/supabase/client';
import { BodyMetric } from '@/lib/supabase/types';

/**
 * Servicio para gestionar métricas corporales (peso, altura)
 * Maneja la tabla body_metrics para tracking histórico
 */

// Obtener la última métrica corporal del usuario autenticado
export async function getMyLatestBodyMetric(): Promise<BodyMetric | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // Si no hay registros, no es un error crítico
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('[bodyMetrics] Error al obtener última métrica:', error);
    throw new Error(error.message || 'Error al obtener métricas corporales');
  }
}

// Obtener todas las métricas corporales del usuario autenticado (para gráficos históricos)
export async function getMyBodyMetrics(limit: number = 30): Promise<BodyMetric[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { data, error } = await supabase
      .from('body_metrics')
      .select('*')
      .eq('user_id', user.id)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error: any) {
    console.error('[bodyMetrics] Error al obtener métricas:', error);
    throw new Error(error.message || 'Error al obtener historial de métricas');
  }
}

// Insertar nueva métrica corporal
export interface InsertBodyMetricPayload {
  weight_kg: number;
  height_cm?: number | null;
  recorded_at?: string;  // Si no se proporciona, usa fecha actual
}

export async function insertBodyMetric(payload: InsertBodyMetricPayload): Promise<BodyMetric> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // Validaciones
    if (!payload.weight_kg || payload.weight_kg < 20 || payload.weight_kg > 300) {
      throw new Error('El peso debe estar entre 20 y 300 kg');
    }

    if (payload.height_cm !== undefined && payload.height_cm !== null) {
      if (payload.height_cm < 80 || payload.height_cm > 250) {
        throw new Error('La altura debe estar entre 80 y 250 cm');
      }
    }

    const insertData = {
      user_id: user.id,
      weight_kg: payload.weight_kg,
      height_cm: payload.height_cm || null,
      recorded_at: payload.recorded_at || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('body_metrics')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    console.log('[bodyMetrics] ✅ Nueva métrica insertada:', data);
    return data;
  } catch (error: any) {
    console.error('[bodyMetrics] ❌ Error al insertar métrica:', error);
    throw new Error(error.message || 'Error al guardar métrica corporal');
  }
}

// Eliminar métrica corporal (si el usuario quiere borrar un registro)
export async function deleteBodyMetric(metricId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    const { error } = await supabase
      .from('body_metrics')
      .delete()
      .eq('id', metricId)
      .eq('user_id', user.id);  // Seguridad: solo puede borrar sus propias métricas

    if (error) throw error;

    console.log('[bodyMetrics] ✅ Métrica eliminada:', metricId);
  } catch (error: any) {
    console.error('[bodyMetrics] ❌ Error al eliminar métrica:', error);
    throw new Error(error.message || 'Error al eliminar métrica corporal');
  }
}

// Utilidad: Calcular IMC (Body Mass Index)
export function calculateBMI(weight_kg: number, height_cm: number): number {
  const height_m = height_cm / 100;
  return weight_kg / (height_m * height_m);
}

// Utilidad: Obtener categoría de IMC
export function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Peso normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
}
