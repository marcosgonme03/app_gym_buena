import { useState } from 'react';
import { bookSession } from '@/lib/bookings';

export function useBookSession() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (sessionId: string) => {
    try {
      setLoading(true);
      setError(null);
      return await bookSession(sessionId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo reservar la sesión';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}
