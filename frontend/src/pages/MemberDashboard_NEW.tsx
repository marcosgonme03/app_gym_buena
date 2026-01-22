import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@/components/common/Avatar';
import { BottomNav } from '@/components/layout/BottomNav';
import ActiveGoal from '@/components/member/ActiveGoal';
import WeeklySummary from '@/components/member/WeeklySummary';
import QuickActions from '@/components/member/QuickActions';
import MotivationalFeedback from '@/components/member/MotivationalFeedback';
import WeeklyInsights from '@/components/member/WeeklyInsights';
import StreakTracker from '@/components/member/StreakTracker';
import { UserGoal, WeeklySummary as WeeklySummaryType, MotivationalMessage, WeeklyInsight, StreakData } from '@/types/member';

// Datos simulados - preparados para reemplazar con backend
const MOCK_DATA = {
  userGoal: {
    id: '1',
    userId: 'user-1',
    goalType: 'muscle_gain',
    targetDate: '2026-06-01',
    startDate: '2026-01-01',
    currentProgress: 35,
    metrics: {
      startWeight: 75,
      targetWeight: 80,
      currentWeight: 76.5,
      startBodyFat: 18,
      targetBodyFat: 15,
      currentBodyFat: 17
    },
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-22T00:00:00Z'
  } as UserGoal,
  weeklySummary: {
    weekStart: '2026-01-20',
    weekEnd: '2026-01-26',
    todayWorkout: {
      name: 'Fuerza - Tren Superior',
      type: 'Hipertrofia',
      duration: 60,
      completed: false
    },
    tomorrowWorkout: {
      name: 'Cardio HIIT',
      type: 'Resistencia',
      duration: 45
    },
    nextClass: {
      id: '1',
      name: 'Spinning Avanzado',
      date: '2026-01-22T10:00:00Z',
      instructor: 'Carlos Pérez',
      spotsLeft: 3
    },
    weekStats: {
      workoutsCompleted: 3,
      workoutsPlanned: 5,
      classesAttended: 2,
      totalMinutes: 180
    }
  } as WeeklySummaryType,
  motivationalMessages: [
    {
      id: '1',
      type: 'achievement',
      message: '¡5 días de racha! Estás en fuego 🔥',
      context: 'Has completado 5 entrenamientos consecutivos',
      timestamp: '2026-01-22T08:00:00Z',
      priority: 'high'
    },
    {
      id: '2',
      type: 'encouragement',
      message: 'Solo te falta 1 entrenamiento para tu objetivo semanal',
      context: '3 de 4 entrenamientos completados',
      timestamp: '2026-01-22T09:00:00Z',
      priority: 'medium'
    }
  ] as MotivationalMessage[],
  weeklyInsights: [
    {
      type: 'improvement',
      metric: 'Entrenamientos completados',
      currentValue: 4,
      previousValue: 3,
      change: 33,
      message: 'Has entrenado más que la semana pasada',
      icon: 'trending-up'
    },
    {
      type: 'improvement',
      metric: 'Volumen total de entrenamiento',
      currentValue: 240,
      previousValue: 180,
      change: 33,
      message: 'Tu volumen de entrenamiento ha aumentado',
      icon: 'trending-up'
    },
    {
      type: 'milestone',
      metric: 'Racha personal',
      currentValue: 5,
      previousValue: 3,
      change: 67,
      message: '¡Nueva racha personal!',
      icon: 'award'
    }
  ] as WeeklyInsight[],
  streakData: {
    current: 5,
    longest: 12,
    lastWorkoutDate: '2026-01-22',
    achievements: [
      {
        id: '1',
        type: 'streak',
        title: 'Racha de 5 días',
        description: 'Has completado entrenamientos durante 5 días consecutivos',
        unlockedAt: '2026-01-22T00:00:00Z',
        icon: 'flame',
        rarity: 'common'
      },
      {
        id: '2',
        type: 'workout',
        title: '20 Entrenamientos',
        description: 'Has completado 20 entrenamientos totales',
        unlockedAt: '2026-01-20T00:00:00Z',
        icon: 'dumbbell',
        rarity: 'rare'
      },
      {
        id: '3',
        type: 'milestone',
        title: 'Primera semana completa',
        description: 'Has completado tu objetivo semanal por primera vez',
        unlockedAt: '2026-01-15T00:00:00Z',
        icon: 'trophy',
        rarity: 'epic'
      }
    ]
  } as StreakData,
  membership: {
    plan: 'Premium',
    status: 'active' as const,
    renewalDate: '2026-02-15',
    daysRemaining: 26
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
  notifications: [
    {
      id: '1',
      type: 'warning' as const,
      message: 'Tu membresía vence en 26 días'
    },
    {
      id: '2',
      type: 'info' as const,
      message: 'Nueva clase de CrossFit disponible los martes'
    }
  ]
};

export const MemberDashboard: React.FC = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [workoutCompleted, setWorkoutCompleted] = useState(MOCK_DATA.weeklySummary.todayWorkout?.completed || false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const handleCompleteWorkout = () => {
    setWorkoutCompleted(true);
    // TODO: Guardar en backend
  };

  const handleChangeWorkout = () => {
    // TODO: Implementar cambio de entrenamiento
    console.log('Cambiar entrenamiento');
  };

  const handleBookClass = () => {
    navigate('/app/classes');
  };

  const handleAddNote = () => {
    // TODO: Implementar modal de notas
    console.log('Añadir nota post-entreno');
  };

  const handleViewPlanning = () => {
    navigate('/app/workout');
  };

  const handleEditGoal = () => {
    // TODO: Implementar modal de edición de objetivo
    console.log('Editar objetivo');
  };

  const handleViewAchievements = () => {
    // TODO: Implementar página de logros
    console.log('Ver todos los logros');
  };

  const handleCancelClass = (classId: string) => {
    // TODO: Implementar cancelación
    console.log('Cancelar clase:', classId);
  };

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-dark-950 dark:bg-dark-950 light:bg-gray-50 pb-20 lg:pb-0">
      {/* Header Desktop/Mobile Responsive */}
      <header className="bg-gradient-to-br from-dark-900 to-dark-950 dark:from-dark-900 dark:to-dark-950 light:from-white light:to-gray-50 border-b border-dark-800/50 dark:border-dark-800/50 light:border-gray-200 sticky top-0 z-40">
        <div className="px-4 lg:px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                src={profile.avatar_url}
                name={`${profile.name} ${profile.last_name}`}
                size="lg"
              />
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-dark-50 dark:text-dark-50 light:text-gray-900">
                  Hola, {profile.name} 👋
                </h1>
                <p className="text-xs lg:text-sm text-dark-400 dark:text-dark-400 light:text-gray-600">
                  {MOCK_DATA.weeklySummary.weekStats.workoutsCompleted} de {MOCK_DATA.weeklySummary.weekStats.workoutsPlanned} entrenamientos esta semana
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/settings')}
                className="hidden lg:flex p-2 bg-dark-800 hover:bg-dark-700 text-dark-200 dark:bg-dark-800 dark:hover:bg-dark-700 dark:text-dark-200 light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-900 rounded-lg transition-colors"
                title="Ajustes"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 lg:px-4 lg:py-2 bg-dark-800/50 hover:bg-dark-800 text-dark-400 dark:bg-dark-800/50 dark:hover:bg-dark-800 dark:text-dark-400 light:bg-gray-200 light:hover:bg-gray-300 light:text-gray-600 rounded-lg transition-colors lg:flex lg:items-center lg:gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden lg:inline text-dark-200 dark:text-dark-200 light:text-gray-900 font-medium">Cerrar sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 lg:px-8 py-6 max-w-lg lg:max-w-7xl mx-auto">
        {/* Desktop: Layout de 2 columnas | Mobile: Stack vertical */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Columna Izquierda - Principal (2/3 en desktop) */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            {/* Notificaciones (si existen) */}
            {MOCK_DATA.notifications.length > 0 && (
              <div className="space-y-3">
                {MOCK_DATA.notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 p-3 lg:p-4 rounded-xl border ${
                      notification.type === 'warning'
                        ? 'bg-yellow-500/5 border-yellow-500/20 dark:bg-yellow-500/5 dark:border-yellow-500/20 light:bg-yellow-50 light:border-yellow-200'
                        : 'bg-blue-500/5 border-blue-500/20 dark:bg-blue-500/5 dark:border-blue-500/20 light:bg-blue-50 light:border-blue-200'
                    }`}
                  >
                    <svg
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        notification.type === 'warning' 
                          ? 'text-yellow-400 dark:text-yellow-400 light:text-yellow-600' 
                          : 'text-blue-400 dark:text-blue-400 light:text-blue-600'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className={`text-sm ${
                      notification.type === 'warning' 
                        ? 'text-yellow-200 dark:text-yellow-200 light:text-yellow-800' 
                        : 'text-blue-200 dark:text-blue-200 light:text-blue-800'
                    }`}>
                      {notification.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Feedback Motivacional */}
            <MotivationalFeedback 
              messages={MOCK_DATA.motivationalMessages}
              streakDays={MOCK_DATA.streakData.current}
              progressPercentage={MOCK_DATA.userGoal.currentProgress}
            />

            {/* Acciones Rápidas */}
            <QuickActions
              onCompleteWorkout={handleCompleteWorkout}
              onChangeWorkout={handleChangeWorkout}
              onBookClass={handleBookClass}
              onAddNote={handleAddNote}
              workoutCompleted={workoutCompleted}
            />

            {/* Resumen Semanal */}
            <WeeklySummary
              summary={MOCK_DATA.weeklySummary}
              onViewPlanning={handleViewPlanning}
            />

            {/* Weekly Insights */}
            <WeeklyInsights insights={MOCK_DATA.weeklyInsights} />

            {/* Clases reservadas (Mobile) */}
            <div className="lg:hidden bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 rounded-xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-dark-50 mb-4">Próximas Clases</h2>

              {MOCK_DATA.bookedClasses.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400 dark:text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-dark-400 text-sm mb-4">No tienes clases reservadas</p>
                  <button 
                    onClick={() => navigate('/app/classes')}
                    className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors text-sm font-medium"
                  >
                    Explorar Clases
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {MOCK_DATA.bookedClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-dark-800/50 rounded-xl border border-gray-200 dark:border-dark-700/50 hover:border-gray-300 dark:hover:border-dark-600 transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-dark-50 text-sm truncate">{classItem.name}</h3>
                        <p className="text-xs text-gray-600 dark:text-dark-400">con {classItem.trainer}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-dark-500">
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
                        className="p-2 text-gray-500 dark:text-dark-500 hover:text-red-400 transition-colors"
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
          </div>

          {/* Columna Derecha - Sidebar (1/3 en desktop, oculto en mobile) */}
          <div className="hidden lg:block space-y-6">
            {/* Objetivo Activo */}
            <ActiveGoal 
              goal={MOCK_DATA.userGoal} 
              onEditGoal={handleEditGoal}
            />

            {/* Racha y Logros */}
            <StreakTracker 
              streakData={MOCK_DATA.streakData}
              onViewAchievements={handleViewAchievements}
            />

            {/* Clases reservadas (Desktop) */}
            <div className="bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 dark:text-dark-50 mb-4">Próximas Clases</h2>

              {MOCK_DATA.bookedClasses.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-gray-100 dark:bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400 dark:text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600 dark:text-dark-400 text-sm mb-4">No tienes clases reservadas</p>
                  <button 
                    onClick={() => navigate('/app/classes')}
                    className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl transition-colors text-sm font-medium"
                  >
                    Explorar Clases
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {MOCK_DATA.bookedClasses.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="p-4 bg-gray-50 dark:bg-dark-800/50 rounded-xl border border-gray-200 dark:border-dark-700/50 hover:border-gray-300 dark:hover:border-dark-600 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-dark-50 text-sm">{classItem.name}</h3>
                        <button
                          onClick={() => handleCancelClass(classItem.id)}
                          className="p-1 text-gray-500 dark:text-dark-500 hover:text-red-400 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-dark-400 mb-2">con {classItem.trainer}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-dark-500">
                        <span>
                          {new Date(classItem.date).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        <span>•</span>
                        <span>{classItem.time}</span>
                        <span>•</span>
                        <span>{classItem.duration} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Membership Card */}
            <div className="bg-white dark:bg-dark-900 border border-gray-100 dark:border-dark-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-medium text-gray-600 dark:text-dark-400 mb-4">Membresía</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-dark-50">{MOCK_DATA.membership.plan}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border mt-1 ${
                      MOCK_DATA.membership.status === 'active' 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20 light:bg-green-50 light:text-green-700 light:border-green-200'
                        : MOCK_DATA.membership.status === 'expiring-soon'
                        ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20 light:bg-yellow-50 light:text-yellow-700 light:border-yellow-200'
                        : 'bg-red-500/10 text-red-400 border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 light:bg-red-50 light:text-red-700 light:border-red-200'
                    }`}>
                      {MOCK_DATA.membership.status === 'active' ? 'Activa' : MOCK_DATA.membership.status === 'expiring-soon' ? 'Próxima a vencer' : 'Caducada'}
                    </span>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-dark-800">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-dark-400">Vencimiento</span>
                    <span className="font-medium text-gray-900 dark:text-dark-200">
                      {new Date(MOCK_DATA.membership.renewalDate).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-dark-400">Días restantes</span>
                    <span className="font-bold text-primary-400">{MOCK_DATA.membership.daysRemaining}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation - Solo visible en móvil */}
      <div className="lg:hidden">
        <BottomNav />
      </div>
    </div>
  );
};

export default MemberDashboard;
