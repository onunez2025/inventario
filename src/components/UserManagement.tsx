import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, 
  Shield, 
  Search, 
  Edit2, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Lock
} from 'lucide-react';
import type { Perfil, UserRole } from '../types';

export const UserManagement: React.FC = () => {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ nombre: string; rol: UserRole }>({
    nombre: '',
    rol: 'operario'
  });

  const roles: UserRole[] = ['administrador', 'supervisor', 'operario'];

  useEffect(() => {
    fetchPerfiles();
  }, []);

  const fetchPerfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfiles')
      .select('*')
      .order('rol', { ascending: true });

    if (error) {
      setError('Error al cargar perfiles: ' + error.message);
    } else {
      setPerfiles(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (perfil: Perfil) => {
    setEditingId(perfil.id);
    setEditForm({
      nombre: perfil.nombre || '',
      rol: perfil.rol
    });
  };

  const handleUpdate = async (id: string) => {
    const { error } = await supabase
      .from('perfiles')
      .update({
        nombre: editForm.nombre,
        rol: editForm.rol
      })
      .eq('id', id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
    } else {
      setEditingId(null);
      fetchPerfiles();
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'administrador': return 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
      case 'supervisor': return 'bg-primary/10 text-primary border-primary/20';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  const filteredPerfiles = perfiles.filter(p => 
    p.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.nombre?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && perfiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-white/40 font-bold uppercase tracking-widest text-xs">Cargando Usuarios...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/20 rounded-2xl">
              <Users className="text-primary" size={24} />
            </div>
            <h1 className="text-3xl font-display font-black tracking-tight text-white">Gestión de Usuarios</h1>
          </div>
          <p className="text-white/40 font-medium">Administra accesos y roles de la plataforma Invent-IA</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o email..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-primary/50 transition-all placeholder:text-white/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Users List */}
      <div className="grid gap-4">
        {filteredPerfiles.map((perfil) => (
          <div 
            key={perfil.id} 
            className={`group relative bg-white/5 border rounded-[32px] p-6 transition-all duration-300 ${editingId === perfil.id ? 'border-primary ring-4 ring-primary/10' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.07]'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                  <span className="text-xl font-black text-white/20">
                    {perfil.nombre?.charAt(0) || perfil.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {editingId === perfil.id ? (
                    <input 
                      type="text" 
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-lg font-bold outline-none focus:border-primary"
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      {perfil.nombre || 'Sin nombre'}
                      {perfil.rol === 'administrador' && <Shield size={14} className="text-amber-500" />}
                    </h3>
                  )}
                  <p className="text-sm text-white/40 font-medium">{perfil.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {editingId === perfil.id ? (
                  <div className="flex items-center gap-3">
                    <select 
                      className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-bold text-white outline-none focus:border-primary appearance-none"
                      value={editForm.rol}
                      onChange={(e) => setEditForm({...editForm, rol: e.target.value as UserRole})}
                    >
                      {roles.map(r => <option key={r} value={r} className="bg-slate-900 text-white capitalize">{r}</option>)}
                    </select>
                    
                    <button 
                      onClick={() => handleUpdate(perfil.id)}
                      className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className={`text-[10px] uppercase font-black tracking-widest px-4 py-1.5 rounded-full border ${getRoleBadgeColor(perfil.rol)}`}>
                      {perfil.rol}
                    </span>
                    <button 
                      onClick={() => handleEdit(perfil)}
                      className="p-3 bg-white/5 text-white/40 rounded-xl hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredPerfiles.length === 0 && (
          <div className="text-center py-20 opacity-20">
            <Search className="mx-auto mb-4" size={48} />
            <p className="font-bold uppercase tracking-widest">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* RBAC Info */}
      <div className="bg-secondary/30 border border-white/10 rounded-[32px] p-8 space-y-4">
        <div className="flex items-center gap-3 text-secondary-foreground text-opacity-100 mb-2">
          <Lock size={18} className="text-primary" />
          <h4 className="text-sm font-black uppercase tracking-widest">Niveles de Acceso (RBAC)</h4>
        </div>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="space-y-1">
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest">Administrador</p>
            <p className="text-xs text-white/40 leading-relaxed">Acceso total, gestión de usuarios, auditoría y KPIs financieros.</p>
          </div>
          <div className="space-y-1">
            <p className="text-primary text-xs font-bold uppercase tracking-widest">Supervisor</p>
            <p className="text-xs text-white/40 leading-relaxed">Gestión de artículos, visualización de KPIs y auditoría.</p>
          </div>
          <div className="space-y-1">
            <p className="text-white/20 text-xs font-bold uppercase tracking-widest">Operario</p>
            <p className="text-xs text-white/40 leading-relaxed">Acceso limitado solo a la toma de física (escaneo y conteo).</p>
          </div>
        </div>
      </div>
    </div>
  );
};
