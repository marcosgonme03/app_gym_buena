import { useState } from 'react';
import { bookClass } from '@/features/classes/services/classesService';

export function useBookClass() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await bookClass(sessionId);
      if (!result.success) {
        throw new Error(result.message || 'No se pudo reservar la clase');
      }
      return result;
    } catch (err: any) {
      setError(err.message || 'No se pudo reservar la clase');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
