import React from 'react';
import { LogOut, User, TrendingDown, Database, Camera, Calendar, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Perfil, PermissionKey } from '../types';

interface MainLayoutProps {
  perfil: Perfil | null;
  permisos: PermissionKey[];
  onLogout: () => void;
  setShowProfile: (show: boolean) => void;
  setShowScanner: (show: boolean) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ 
  perfil, 
  permisos, 
  onLogout, 
  setShowProfile, 
  setShowScanner 
}) => {
  const hasPermission = (key: PermissionKey) => permisos.includes(key);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="bg-primary-container px-4 py-3 sm:p-4 text-white shadow-lg sticky top-0 z-50 transition-all">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Invent-IA" className="w-10 h-10 object-contain rounded-xl shadow-lg shadow-black/20" />
            <h1 className="text-xl sm:text-2xl font-display font-black tracking-tighter text-white flex-shrink-0">
              Invent<span className="text-secondary">-IA</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => setShowProfile(true)}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-all px-2 py-1 sm:px-3 sm:py-1.5 rounded-2xl active:scale-95 border border-white/5 min-w-0"
            >
              <div className="text-right hidden xs:block">
                <p className="text-[9px] sm:text-[10px] uppercase font-bold text-blue-200 leading-none tracking-widest mb-0.5">{perfil?.rol}</p>
                <p className="text-xs font-bold text-white truncate max-w-[80px] sm:max-w-[120px]">{perfil?.nombre?.split(' ')[0] || 'Mi Cuenta'}</p>
              </div>
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-secondary rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <User size={14} className="text-white sm:hidden" />
                <User size={16} className="text-white hidden sm:block" />
              </div>
            </button>
            <button 
              onClick={onLogout}
              className="w-9 h-9 sm:w-10 sm:h-10 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center hover:bg-red-500/80 transition-all group border border-white/5 flex-shrink-0"
              title="Cerrar Sesión"
            >
              <LogOut size={16} className="sm:hidden group-hover:scale-110 transition-transform" />
              <LogOut size={18} className="hidden sm:block group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <Outlet />

      {/* Floating Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-100 pb-6 flex items-end z-[140] shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <div className="flex-1 flex justify-around items-center pb-2 px-2">
          <NavLink 
            to="/"
            className={({ isActive }) => `flex flex-col items-center flex-1 transition-all ${isActive ? 'text-primary scale-110 font-black' : 'text-gray-400 font-medium'}`}
          >
            <TrendingDown size={22} />
            <span className="text-[10px] uppercase mt-1.5 tracking-tighter">Status</span>
          </NavLink>
          
          {hasPermission('view_master') && (
            <NavLink 
              to="/master"
              className={({ isActive }) => `flex flex-col items-center flex-1 transition-all ${isActive ? 'text-primary scale-110 font-black' : 'text-gray-400 font-medium'}`}
            >
              <Database size={22} />
              <span className="text-[10px] uppercase mt-1.5 tracking-tighter">Maestro</span>
            </NavLink>
          )}
        </div>

        <div className="flex-none w-24 flex justify-center pb-6">
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-primary p-5 rounded-[2.5rem] -mb-4 shadow-[0_15px_30px_rgba(0,49,120,0.3)] border-[8px] border-surface text-white active:scale-90 transition-all hover:bg-primary-container z-10 relative group"
          >
            <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-active:scale-100 transition-transform duration-300"></div>
            <Camera size={30} className="relative z-10" />
          </button>
        </div>

        <div className="flex-1 flex justify-around items-center pb-2 px-2">
          {hasPermission('view_inventory_sessions') && (
            <NavLink 
              to="/inventory"
              className={({ isActive }) => `flex flex-col items-center flex-1 transition-all ${isActive ? 'text-primary scale-110 font-black' : 'text-gray-400 font-medium'}`}
            >
              <Calendar size={22} />
              <span className="text-[10px] uppercase mt-1.5 tracking-tighter">Programar</span>
            </NavLink>
          )}

          {hasPermission('view_users') ? (
            <NavLink 
              to="/users"
              className={({ isActive }) => `flex flex-col items-center flex-1 transition-all ${isActive ? 'text-primary scale-110 font-black' : 'text-gray-400 font-medium'}`}
            >
              <Users size={22} />
              <span className="text-[10px] uppercase mt-1.5 tracking-tighter">Usuarios</span>
            </NavLink>
          ) : (
            <div className="flex-1"></div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
