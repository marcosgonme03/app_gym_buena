import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/guards/ProtectedRoute';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { MemberDashboard } from '@/pages/MemberDashboard';
import { TrainerDashboard } from '@/pages/TrainerDashboard';
import { Settings } from '@/pages/Settings';
import { WorkoutPlanPage } from '@/features/member/workoutPlan/WorkoutPlanPage';
import { TrainingPage }       from '@/features/training/pages/TrainingPage';
import { WeeklyPlanPage }     from '@/features/training/pages/WeeklyPlanPage';
import { SessionPage }        from '@/features/training/pages/SessionPage';
import { TrainingCreatePage } from '@/features/training/pages/TrainingCreatePage';
import { WorkoutHistoryPage } from '@/features/training/pages/WorkoutHistoryPage';
import { TodayWorkout }       from '@/pages/TodayWorkout';
import { WorkoutSummary }     from '@/pages/WorkoutSummary';
import { ClassesListPage } from '@/pages/ClassesListPage';
import { ClassDetailsPage } from '@/pages/ClassDetailsPage';
import { ProgresoPage } from '@/features/progress/pages/ProgresoPage';
import { NutritionPage } from '@/features/nutrition/pages/NutritionPage';
import { NutritionHistoryPage } from '@/features/nutrition/pages/NutritionHistoryPage';
import { NutritionPlanPage } from '@/features/nutrition/pages/NutritionPlanPage';
import { AdminDashboardPage }  from '@/features/admin/pages/AdminDashboardPage';
import { AdminUsersPage }      from '@/features/admin/pages/AdminUsersPage';
import { AdminWorkoutsPage }   from '@/features/admin/pages/AdminWorkoutsPage';
import { AdminNutritionPage }  from '@/features/admin/pages/AdminNutritionPage';
import { AdminAnalyticsPage }  from '@/features/admin/pages/AdminAnalyticsPage';
import { AdminLogsPage }       from '@/features/admin/pages/AdminLogsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Rutas públicas */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Rutas protegidas por role */}
            <Route
              path="/app"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <MemberDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <MemberDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/workout-plan"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <WorkoutPlanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/workout"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <TrainingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/workout/plan-semanal"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <WeeklyPlanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/workout/sesion/:id"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <SessionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/workout/crear"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <TrainingCreatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/workout/historial"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <WorkoutHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/workout/today"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <TodayWorkout />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/workout/summary/:sessionId"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <WorkoutSummary />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/progress"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <ProgresoPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/nutrition"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <NutritionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/nutrition/history"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <NutritionHistoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/nutrition/plan"
              element={
                <ProtectedRoute allowedRoles={['member']}>
                  <NutritionPlanPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/classes"
              element={
                <ProtectedRoute allowedRoles={['member', 'trainer', 'admin']}>
                  <ClassesListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/classes/:slug"
              element={
                <ProtectedRoute allowedRoles={['member', 'trainer', 'admin']}>
                  <ClassDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes"
              element={
                <ProtectedRoute allowedRoles={['member', 'trainer', 'admin']}>
                  <ClassesListPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/classes/:slug"
              element={
                <ProtectedRoute allowedRoles={['member', 'trainer', 'admin']}>
                  <ClassDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/trainer"
              element={
                <ProtectedRoute allowedRoles={['trainer']}>
                  <TrainerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={<Navigate to="/app/admin" replace />}
            />
            
            {/* Ruta de ajustes (accesible para todos los roles autenticados) */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['admin', 'trainer', 'member']}>
                  <Settings />
                </ProtectedRoute>
              }
            />

            {/* Admin panel (nuevo) */}
            <Route path="/app/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
            <Route path="/app/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsersPage /></ProtectedRoute>} />
            <Route path="/app/admin/workouts" element={<ProtectedRoute allowedRoles={['admin']}><AdminWorkoutsPage /></ProtectedRoute>} />
            <Route path="/app/admin/nutrition" element={<ProtectedRoute allowedRoles={['admin']}><AdminNutritionPage /></ProtectedRoute>} />
            <Route path="/app/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><AdminAnalyticsPage /></ProtectedRoute>} />
            <Route path="/app/admin/logs" element={<ProtectedRoute allowedRoles={['admin']}><AdminLogsPage /></ProtectedRoute>} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};
