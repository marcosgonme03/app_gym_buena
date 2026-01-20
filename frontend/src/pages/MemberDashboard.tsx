import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';

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
    <div className="min-h-screen bg-dark-950">
      {/* Header */}
      <header className="bg-dark-900 border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar
                src={profile.avatar_url}
                name={`${profile.name} ${profile.last_name}`}
                size="lg"
              />
              <div>
                <h1 className="text-3xl font-bold text-dark-50">
                  Hola, {profile.name}
                </h1>
                <p className="text-dark-400 mt-1">{motivationalMessage}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="p-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors"
                title="Ajustes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Notificaciones importantes */}
        {MOCK_DATA.notifications.length > 0 && (
          <div className="mb-6 space-y-3">
            {MOCK_DATA.notifications.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
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
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className={`text-sm ${notification.type === 'warning' ? 'text-yellow-200' : 'text-blue-200'}`}>
                  {notification.message}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Estado de membresía */}
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-dark-400">Estado de Membresía</h3>
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-2xl font-bold text-dark-50">{MOCK_DATA.membership.plan}</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border mt-2 ${getMembershipStatusColor()}`}
                >
                  {getMembershipStatusText()}
                </span>
              </div>
              <div className="pt-3 border-t border-dark-800">
                <p className="text-xs text-dark-500">Renovación</p>
                <p className="text-sm text-dark-300 font-medium">
                  {new Date(MOCK_DATA.membership.renewalDate).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
                <p className="text-xs text-dark-400 mt-1">
                  {MOCK_DATA.membership.daysRemaining} días restantes
                </p>
              </div>
            </div>
          </div>

          {/* Progreso semanal */}
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-dark-400">Progreso Semanal</h3>
              <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-bold text-dark-50">
                    {MOCK_DATA.progress.workoutsThisWeek}
                  </span>
                  <span className="text-dark-400 text-sm mb-1">/ {MOCK_DATA.progress.weeklyGoal} entrenamientos</span>
                </div>
                <div className="w-full bg-dark-800 rounded-full h-2">
                  <div
                    className="bg-primary-500 h-2 rounded-full transition-all"
                    style={{ width: `${MOCK_DATA.progress.weeklyPercentage}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-dark-800">
                <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-xs text-dark-500">Racha actual</p>
                  <p className="text-sm font-semibold text-dark-200">{MOCK_DATA.progress.currentStreak} días</p>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-dark-400 mb-4">Acciones Rápidas</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-4 bg-dark-800 hover:bg-dark-750 rounded-lg transition-colors group">
                <svg
                  className="w-6 h-6 text-primary-400 mb-2 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs text-dark-300 text-center">Reservar Clase</span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 bg-dark-800 hover:bg-dark-750 rounded-lg transition-colors group">
                <svg
                  className="w-6 h-6 text-primary-400 mb-2 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <span className="text-xs text-dark-300 text-center">Ver Rutinas</span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 bg-dark-800 hover:bg-dark-750 rounded-lg transition-colors group">
                <svg
                  className="w-6 h-6 text-primary-400 mb-2 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-xs text-dark-300 text-center">Mi Progreso</span>
              </button>

              <button className="flex flex-col items-center justify-center p-4 bg-dark-800 hover:bg-dark-750 rounded-lg transition-colors group">
                <svg
                  className="w-6 h-6 text-primary-400 mb-2 group-hover:scale-110 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <span className="text-xs text-dark-300 text-center">Perfil</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Entrenamiento del día */}
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-dark-50">Entrenamiento de Hoy</h2>
              <span className="text-xs text-dark-500">
                {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}
              </span>
            </div>

            {workoutCompleted ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-dark-50 mb-2">¡Entrenamiento Completado!</h3>
                <p className="text-dark-400 text-sm">Excelente trabajo. Sigue así 💪</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-dark-50 mb-2">{MOCK_DATA.todayWorkout.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-dark-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      {MOCK_DATA.todayWorkout.type}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {MOCK_DATA.todayWorkout.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      {MOCK_DATA.todayWorkout.exercises} ejercicios
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 py-3 px-4 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors">
                    Ver Entrenamiento
                  </button>
                  <button
                    onClick={handleCompleteWorkout}
                    className="flex-1 py-3 px-4 bg-dark-800 hover:bg-dark-700 text-dark-200 font-medium rounded-lg transition-colors"
                  >
                    Marcar Realizado
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clases reservadas */}
          <div className="bg-dark-900 border border-dark-800 rounded-lg p-6">
            <h2 className="text-xl font-bold text-dark-50 mb-6">Próximas Clases</h2>

            {MOCK_DATA.bookedClasses.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-dark-400 mb-4">No tienes clases reservadas</p>
                <button className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors">
                  Explorar Clases
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {MOCK_DATA.bookedClasses.map((classItem) => (
                  <div
                    key={classItem.id}
                    className="flex items-start justify-between p-4 bg-dark-800 rounded-lg hover:bg-dark-750 transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-dark-50 mb-1">{classItem.name}</h3>
                      <p className="text-sm text-dark-400 mb-2">con {classItem.trainer}</p>
                      <div className="flex items-center gap-3 text-xs text-dark-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          {new Date(classItem.date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {classItem.time} ({classItem.duration} min)
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleCancelClass(classItem.id)}
                      className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
