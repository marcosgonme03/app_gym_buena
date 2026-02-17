import React from 'react';

interface BookingCTAProps {
  canReserve: boolean;
  canCancel: boolean;
  isFull: boolean;
  isProcessing: boolean;
  onReserve: () => void;
  onCancel: () => void;
}

export const BookingCTA: React.FC<BookingCTAProps> = ({
  canReserve,
  canCancel,
  isFull,
  isProcessing,
  onReserve,
  onCancel,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-dark-800 bg-dark-950/95 backdrop-blur px-4 py-3 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {canCancel ? (
          <button
            onClick={onCancel}
            disabled={isProcessing}
            aria-label="Cancelar reserva"
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-60"
          >
            {isProcessing ? 'Cancelando...' : 'Cancelar reserva'}
          </button>
        ) : canReserve ? (
          <button
            onClick={onReserve}
            disabled={isProcessing}
            aria-label="Reservar clase"
            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold disabled:opacity-60"
          >
            {isProcessing ? 'Reservando...' : 'Reservar'}
          </button>
        ) : (
          <button
            disabled
            aria-label={isFull ? 'Clase completa' : 'No disponible'}
            className="w-full py-3 rounded-xl bg-dark-700 text-dark-300 font-semibold cursor-not-allowed"
          >
            {isFull ? 'Completo' : 'No disponible'}
          </button>
        )}
      </div>
    </div>
  );
};
