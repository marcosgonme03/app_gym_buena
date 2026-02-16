import { useState } from 'react';
import { cancelClass } from '@/features/classes/services/classesService';

export function useCancelBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await cancelClass(sessionId);
      if (!result.success) {
        throw new Error(result.message || 'No se pudo cancelar la reserva');
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'No se pudo cancelar la reserva');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
