import React, { ReactNode } from 'react';

interface AuthCardProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Fondo con gradiente y efectos */}
      <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary-900/20 via-transparent to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-primary-800/10 via-transparent to-transparent" />
      
      {/* Grid pattern sutil */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />
      
      {/* Card */}
      <div className="relative w-full max-w-md">
        <div className="glass-effect rounded-2xl shadow-2xl p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <img
              src="/logo-gymflow.png"
              alt="GymFlow"
              className="w-14 h-14 mx-auto rounded-xl border border-dark-700 bg-dark-900/70 p-2"
            />
            <h1 className="text-3xl font-bold text-dark-50 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-dark-400 text-sm">
                {subtitle}
              </p>
            )}
          </div>
          
          {/* Content */}
          <div className="space-y-4">
            {children}
          </div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary-600/20 to-primary-400/20 rounded-2xl blur-xl -z-10 opacity-50" />
      </div>
    </div>
  );
};
