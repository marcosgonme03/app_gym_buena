import React from 'react';

interface ReservationUser {
  userId: string;
  fullName: string;
  avatarUrl?: string | null;
}

interface ReservationAvatarsProps {
  users: ReservationUser[];
  totalReserved: number;
  demandLabel?: string | null;
}

export const ReservationAvatars: React.FC<ReservationAvatarsProps> = ({ users, totalReserved, demandLabel }) => {
  return (
    <section className="rounded-xl border border-dark-800 bg-dark-900 p-4">
      <h3 className="text-sm font-semibold text-dark-100 mb-1">{totalReserved} personas apuntadas</h3>
      {demandLabel && <p className="text-xs text-primary-200 mb-3">{demandLabel}</p>}
      {users.length === 0 ? (
        <p className="text-xs text-dark-400">Aún no hay participantes visibles para esta sesión.</p>
      ) : (
        <div className="flex items-center gap-2">
          {users.slice(0, 5).map((user) => (
            user.avatarUrl ? (
              <img
                key={user.userId}
                src={user.avatarUrl}
                alt={user.fullName}
                className="w-8 h-8 rounded-full border border-dark-700 object-cover"
              />
            ) : (
              <div
                key={user.userId}
                className="w-8 h-8 rounded-full border border-dark-700 bg-dark-700 text-[11px] text-dark-100 flex items-center justify-center"
                title={user.fullName}
              >
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )
          ))}
          {totalReserved > users.length && (
            <span className="text-xs text-dark-300">+{totalReserved - users.length}</span>
          )}
        </div>
      )}
    </section>
  );
};
