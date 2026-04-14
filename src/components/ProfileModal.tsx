import React from 'react';
import { User, Mail, Shield, Calendar, LogOut, X } from 'lucide-react';
import type { Perfil } from '../types';

interface ProfileModalProps {
  perfil: Perfil | null;
  session: any;
  onClose: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ perfil, session, onClose, onLogout }) => {
  const userEmail = perfil?.email || session?.user?.email || 'No disponible';
  const userName = perfil?.nombre || session?.user?.user_metadata?.full_name || 'Mi Cuenta';
  const userRole = perfil?.rol || 'Usuario';
  const createdAt = perfil?.created_at || session?.user?.created_at;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4 min-h-[100dvh]">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-primary p-8 text-white relative">
          <div className="absolute top-4 right-4">
            <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors text-white">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-4 border-4 border-white/10">
              <User size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-display font-black tracking-tight">{userName}</h2>
            <div className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full border border-white/20 ${userRole === 'administrador' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'bg-secondary'}`}>
              <Shield size={12} className="text-white" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-white">{userRole}</span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-primary transition-colors">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Email Corporativo</p>
                <p className="text-sm font-bold text-gray-700">{userEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 group">
              <div className="w-10 h-10 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-primary transition-colors">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Cuenta creada</p>
                <p className="text-sm font-bold text-gray-700">
                  {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
             <button 
                onClick={onLogout}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-all active:scale-95"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
          </div>
          
          <p className="text-[10px] text-center text-gray-400 font-medium">
            Invent-IA v1.0.2 - NoCode Creator
          </p>
        </div>
      </div>
    </div>
  );
};
