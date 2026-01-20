import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="glass-effect rounded-2xl p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-dark-50">
              Bienvenido a GymFlow
            </h1>
            <p className="text-dark-400">
              Has iniciado sesión correctamente. Esta es tu zona privada.
            </p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-6 space-y-2">
              <h3 className="text-lg font-semibold text-dark-50">Mis Rutinas</h3>
              <p className="text-sm text-dark-400">Gestiona tus entrenamientos</p>
            </div>
            
            <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-6 space-y-2">
              <h3 className="text-lg font-semibold text-dark-50">Mi Progreso</h3>
              <p className="text-sm text-dark-400">Visualiza tus avances</p>
            </div>
            
            <div className="bg-dark-800/50 border border-dark-700 rounded-lg p-6 space-y-2">
              <h3 className="text-lg font-semibold text-dark-50">Perfil</h3>
              <p className="text-sm text-dark-400">Actualiza tu información</p>
            </div>
          </div>
          
          <div className="pt-6 border-t border-dark-700">
            <Link to="/login">
              <Button variant="ghost">
                Cerrar sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
