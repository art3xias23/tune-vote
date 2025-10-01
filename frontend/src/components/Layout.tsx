import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useUser();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="backdrop-blur-sm bg-white/90 shadow-soft border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center shadow-medium">
                  <span className="text-xl">🎵</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Tune Vote
                  </h1>
                  <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">
                    Music Discovery Platform
                  </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-music-100 to-primary-100 text-music-700 shadow-soft">
                  <span className="w-2 h-2 bg-music-500 rounded-full mr-2 animate-pulse"></span>
                  TuneSquad
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-xl px-4 py-2 shadow-soft border border-white/20">
                <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-soft">
                  <span className="text-lg">{user?.avatar}</span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800">
                    {user?.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {user?.isAdmin ? 'Administrator' : 'Member'}
                  </div>
                </div>
                {user?.isAdmin && (
                  <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-accent-100 to-rating-100 text-accent-700 shadow-soft">
                    Admin
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900
                          bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-white/20
                          hover:border-slate-200 rounded-lg transition-all duration-200
                          shadow-soft hover:shadow-medium"
              >
                Switch User
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ✅ Added Dashboard link here */}
      <nav className="backdrop-blur-sm bg-white/70 border-b border-white/20 shadow-soft">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex space-x-1">
            <Link
              to="/dashboard"
              className={`relative px-6 py-4 font-semibold text-sm transition-all duration-300 rounded-t-xl ${
                isActive('/dashboard')
                  ? 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-medium transform -translate-y-0.5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className="text-lg">🏠</span>
                <span>Dashboard</span>
              </span>
              {isActive('/dashboard') && (
                <div className="absolute inset-x-0 -bottom-px h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
              )}
            </Link>

            <Link
              to="/vote"
              className={`relative px-6 py-4 font-semibold text-sm transition-all duration-300 rounded-t-xl ${
                isActive('/vote')
                  ? 'bg-gradient-vote text-white shadow-vote transform -translate-y-0.5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className="text-lg">🗳️</span>
                <span>Vote</span>
              </span>
              {isActive('/vote') && (
                <div className="absolute inset-x-0 -bottom-px h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
              )}
            </Link>

            <Link
              to="/database"
              className={`relative px-6 py-4 font-semibold text-sm transition-all duration-300 rounded-t-xl ${
                isActive('/database')
                  ? 'bg-gradient-music text-white shadow-glow transform -translate-y-0.5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <span className="text-lg">🎵</span>
                <span>Database</span>
              </span>
              {isActive('/database') && (
                <div className="absolute inset-x-0 -bottom-px h-1 bg-gradient-to-r from-transparent via-white to-transparent"></div>
              )}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      <footer className="mt-auto py-8 bg-white/30 backdrop-blur-sm border-t border-white/20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-center items-center space-x-6 text-sm text-slate-500">
            <span className="flex items-center space-x-2">
              <span>🎵</span>
              <span>Powered by TuneSquad</span>
            </span>
            <span>•</span>
            <span>Music Discovery & Voting</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
