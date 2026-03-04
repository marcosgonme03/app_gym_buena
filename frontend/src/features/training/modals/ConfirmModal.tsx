// ============================================================================
// ConfirmModal — Confirmación de acciones destructivas
// ============================================================================

import React from 'react';

interface ConfirmModalProps {
  isOpen:       boolean;
  title:        string;
  message:      string;
  confirmLabel?: string;
  cancelLabel?:  string;
  danger?:       boolean;
  loading?:      boolean;
  onConfirm:    () => void;
  onCancel:     () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen, title, message,
  confirmLabel = 'Confirmar',
  cancelLabel  = 'Cancelar',
  danger       = false,
  loading      = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-dark-900 border border-dark-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-slideUp">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-4 ${danger ? 'bg-red-500/10' : 'bg-primary-500/10'}`}>
          <svg className={`w-5 h-5 ${danger ? 'text-red-400' : 'text-primary-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {danger
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            }
          </svg>
        </div>
        <h3 className="text-sm font-bold text-dark-50 text-center mb-1.5">{title}</h3>
        <p className="text-xs text-dark-400 text-center mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-dark-700 text-sm font-semibold text-dark-400 hover:text-dark-200 hover:border-dark-600 transition-all duration-150 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 disabled:opacity-50 ${
              danger
                ? 'bg-red-500/15 border border-red-500/20 text-red-400 hover:bg-red-500/25'
                : 'bg-primary-500 text-white hover:bg-primary-400'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Procesando...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
