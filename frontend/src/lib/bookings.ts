import { bookClass, cancelClass } from '@/features/classes/services/classesService';

export async function bookSession(sessionId: string) {
  return bookClass(sessionId);
}

export async function cancelSession(sessionId: string) {
  return cancelClass(sessionId);
}
