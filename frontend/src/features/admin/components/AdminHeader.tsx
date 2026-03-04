import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar } from '@/components/common/Avatar';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
  actions?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title, subtitle, onMenuToggle, actions,
}) => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const fullName = profile
    ? `${profile.name ?? ''} ${profile.last_name ?? ''}`.trim()
    : (user?.email ?? '');

  return (
    <header className="sticky top-0 z-30 bg-dark-950/90 backdrop-blur border-b border-dark-800 px-5 py-3.5">
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-dark-400 hover:text-dark-200 hover:bg-dark-800 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-dark-100 leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-xs text-dark-500 truncate">{subtitle}</p>}
        </div>

        {/* Actions slot */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {/* User block */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-medium text-dark-200 leading-tight">{fullName}</span>
            <span className="text-xs text-dark-500">Administrador</span>
          </div>
          <Avatar
            src={profile?.avatar_url}
            name={fullName}
            size="sm"
          />
          <button
            onClick={handleSignOut}
            title="Cerrar sesión"
            className="p-2 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};
