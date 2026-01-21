import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import { BottomNav } from '@/components/layout/BottomNav';

// Datos simulados - preparados para reemplazar con backend
const MOCK_DATA = {
  membership: {
    plan: 'Premium',
    status: 'active', // 'active' | 'expiring-soon' | 'expired'
    renewalDate: '2026-02-15',
    daysRemaining: 26
  },
  todayWorkout: {
    name: 'Fuerza - Tren Superior',
    type: 'Hipertrofia',
    duration: 60,
    exercises: 8,
    completed: false
  },
  bookedClasses: [
    {
      id: '1',
      name: 'Spinning',
      trainer: 'Carlos Pérez',
      date: '2026-01-22',
      time: '10:00',
      duration: 45
    },
    {
      id: '2',
      name: 'Yoga Flow',
      trainer: 'Ana García',
      date: '2026-01-23',
      time: '18:30',
      duration: 60
    }
  ],
  progress: {
    workoutsThisWeek: 3,
    weeklyGoal: 4,
    currentStreak: 5,
    weeklyPercentage: 75
  },
  notifications: [
    {
      id: '1',
      type: 'warning',
      message: 'Tu membresía vence en 26 días'
    },
    {
      id: '2',
      type: 'info',
      message: 'Nueva clase de CrossFit disponible los martes'
    }
  ]
};

export const MemberDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [workoutCompleted, setWorkoutCompleted] = useState(MOCK_DATA.todayWorkout.completed);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCompleteWorkout = () => {
    setWorkoutCompleted(true);
    // TODO: Guardar en backend
  };

  const handleCancelClass = (classId: string) => {
    // TODO: Implementar cancelación
    console.log('Cancelar clase:', classId);
  };

  if (!profile) return null;

  const getMembershipStatusColor = () => {
    switch (MOCK_DATA.membership.status) {
      case 'active': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'expiring-soon': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'expired': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getMembershipStatusText = () => {
    switch (MOCK_DATA.membership.status) {
      case 'active': return 'Activa';
      case 'expiring-soon': return 'Próxima a vencer';
      case 'expired': return 'Caducada';
      default: return 'Desconocido';
    }
  };

  const motivationalMessage = MOCK_DATA.progress.workoutsThisWeek >= MOCK_DATA.progress.weeklyGoal
    ? '¡Meta semanal alcanzada! 💪'
    : `¡Vamos ${profile.name}! ${MOCK_DATA.progress.weeklyGoal - MOCK_DATA.progress.workoutsThisWeek} entrenamientos más para tu meta`;

  return (
    <div className="min-h-screen bg-dark-950 pb-20">
      {/* Header Mobile-First */}
      <header className="bg-gradient-to-br from-dark-900 to-dark-950 border-b border-dark-800/50 sticky top-0 z-40">
        <div className="px-4 py-4">
          {/* User Info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar
                src={profile.avatar_url}
                name={`${profile.name} ${profile.last_name}`}
                size="lg"
              />
              <div>
                <h1 className="text-xl font-bold text-dark-50">
                  Hola, {profile.name} 👋
                </h1>
                <p className="text-xs text-dark-400">{motivationalMessage}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="p-2 bg-dark-800/50 hover:bg-dark-800 text-dark-400 rounded-lg transition-colors lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>

          {/* Membership Status Card Compact */}
          <div className="bg-dark-800/30 backdrop-blur-sm rounded-xl p-4 border border-dark-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-50">{MOCK_DATA.membership.plan}</p>
                  <p className="text-xs text-dark-400">{MOCK_DATA.membership.daysRemaining} días restantes</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getMembershipStatusColor()}`}>
                {getMembershipStatusText()}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto">
        {/* Notificaciones */}
        {MOCK_DATA.notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {MOCK_DATA.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-3 rounded-xl border ${
                  notification.type === 'warning'
                    ? 'bg-yellow-500/5 border-yellow-500/20'
                    : 'bg-blue-500/5 border-blue-500/20'
                }`}
              >
                <svg
                  className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    notification.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className={`text-sm ${notification.type === 'warning' ? 'text-yellow-200' : 'text-blue-200'}`}>
                  {notification.message}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 mb-6">
          {/* Entrenamiento de hoy - Card destacada */}
          <div className="bg-gradient-to-br from-primary-500/10 to-primary-600/5 border border-primary-500/20 rounded-2xl p-5 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs text-primary-300 font-medium mb-1">Entrenamiento de Hoy</p>
                <h3 className="text-lg font-bold text-dark-50">{MOCK_DATA.todayWorkout.name}</h3>
                <p className="text-sm text-dark-400 mt-1">{MOCK_DATA.todayWorkout.type}</p>
              </div>
              {!workoutCompleted && (
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mb-4 text-sm">
              <div className="flex items-center gap-1.5 text-dark-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{MOCK_DATA.todayWorkout.duration} min</span>
              </div>
              <div className="flex items-center gap-1.5 text-dark-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>{MOCK_DATA.todayWorkout.exercises} ejercicios</span>
              </div>
            </div>

            {workoutCompleted ? (
              <div className="flex items-center justify-center gap-2 py-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-green-400">¡Completado!</span>
              </div>
            ) : (
              <button
                onClick={handleCompleteWorkout}
                className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl transition-colors"
              >
                Comenzar Entrenamiento
              </button>
            )}
          </div>

          {/* Progreso semanal - Compact */}
          <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-dark-50">Progreso Semanal</h3>
              <span className="text-xs text-dark-400">{MOCK_DATA.progress.weeklyPercentage}%</span>
            </div>
            
            <div className="mb-3">
              <div className="flex items-end gap-2 mb-2">
                <span className="text-3xl font-bold text-primary-400">
                  {MOCK_DATA.progress.workoutsThisWeek}
                </span>
                <span className="text-dark-400 text-sm mb-1.5">/ {MOCK_DATA.progress.weeklyGoal}</span>
              </div>
              <div className="w-full bg-dark-800 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-400 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${MOCK_DATA.progress.weeklyPercentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-dark-800">
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-dark-300">
                  Racha: <span className="font-semibold text-orange-400">{MOCK_DATA.progress.currentStreak} días</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Clases reservadas */}
        <div className="bg-dark-900 border border-dark-800 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-dark-50 mb-4">Próximas Clases</h2>

          {MOCK_DATA.bookedClasses.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-dark-400 text-sm mb-4">No tienes clases reservadas</p>
              <button className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors text-sm font-medium">
                Explorar Clases
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {MOCK_DATA.bookedClasses.map((classItem) => (
                <div
                  key={classItem.id}
                  className="flex items-center gap-3 p-4 bg-dark-800/50 rounded-xl border border-dark-700/50 hover:border-dark-600 transition-colors"
                >
                  <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-dark-50 text-sm truncate">{classItem.name}</h3>
                    <p className="text-xs text-dark-400">con {classItem.trainer}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-dark-500">
                      <span>
                        {new Date(classItem.date).toLocaleDateString('es-ES', {
                          weekday: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span>•</span>
                      <span>{classItem.time}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelClass(classItem.id)}
                    className="p-2 text-dark-500 hover:text-red-400 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default MemberDashboard;
