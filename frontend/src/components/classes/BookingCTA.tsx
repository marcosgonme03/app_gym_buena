import React from 'react';

interface BookingCTAProps {
  canReserve: boolean;
  canCancel: boolean;
  isFull: boolean;
  isProcessing: boolean;
  remainingSpots?: number;
  totalSpots?: number;
  countdownText?: string | null;
  canJoinWaitlist?: boolean;
  onReserve: () => void;
  onCancel: () => void;
  onJoinWaitlist?: () => void;
}

export const BookingCTA: React.FC<BookingCTAProps> = ({
  canReserve,
  canCancel,
  isFull,
  isProcessing,
  remainingSpots,
  totalSpots,
  countdownText,
  canJoinWaitlist,
  onReserve,
  onCancel,
  onJoinWaitlist,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-dark-800 bg-dark-950/95 backdrop-blur px-4 py-3 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-xs text-dark-300">
            {typeof remainingSpots === 'number' && typeof totalSpots === 'number'
              ? `${remainingSpots}/${totalSpots} plazas disponibles`
              : 'Selecciona una sesión para ver disponibilidad'}
          </p>
          {countdownText && <p className="text-xs text-green-300 font-medium">{countdownText}</p>}
        </div>

        {canCancel ? (
          <button
            onClick={onCancel}
            disabled={isProcessing}
            aria-label="Cancelar reserva"
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold disabled:opacity-60 transition-all duration-200"
          >
            {isProcessing ? 'Cancelando...' : 'Cancelar reserva'}
          </button>
        ) : canReserve ? (
          <button
            onClick={onReserve}
            disabled={isProcessing}
            aria-label="Reservar clase"
            className="w-full py-3 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold disabled:opacity-60 transition-all duration-200"
          >
            {isProcessing ? 'Reservando...' : 'Reservar'}
          </button>
        ) : canJoinWaitlist && onJoinWaitlist ? (
          <button
            onClick={onJoinWaitlist}
            disabled={isProcessing}
            aria-label="Apuntarme a lista de espera"
            className="w-full py-3 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-white font-semibold disabled:opacity-60 transition-all duration-200"
          >
            {isProcessing ? 'Procesando...' : 'Lista de espera'}
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
