// ============================================================================
// Toast — Notificaciones ligeras (success | error | info)
// ============================================================================

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id:      string;
  type:    ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems]       = useState<ToastItem[]>([]);
  const timersRef               = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(t => t.id !== id));
    const t = timersRef.current.get(id);
    if (t) { clearTimeout(t); timersRef.current.delete(id); }
  }, []);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setItems(prev => [...prev.slice(-4), { id, type, message }]);
    timersRef.current.set(id, setTimeout(() => remove(id), 3500));
  }, [remove]);

  useEffect(() => () => {
    timersRef.current.forEach(t => clearTimeout(t));
  }, []);

  const icons: Record<ToastType, React.ReactNode> = {
    success: (
      <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-4 h-4 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const borders: Record<ToastType, string> = {
    success: 'border-green-500/20',
    error:   'border-red-500/20',
    info:    'border-blue-500/20',
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Portal */}
      <div className="fixed bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {items.map(item => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-center gap-2.5 bg-dark-900 border ${borders[item.type]} rounded-xl px-4 py-3 shadow-2xl shadow-black/40 text-sm text-dark-100 min-w-[240px] max-w-xs animate-fadeIn`}
          >
            {icons[item.type]}
            <span className="flex-1">{item.message}</span>
            <button
              onClick={() => remove(item.id)}
              className="text-dark-600 hover:text-dark-300 transition-colors ml-1"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
