import React, { useState, useEffect } from 'react';
import { supabase, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { 
  Users, 
  Shield, 
  Search, 
  Edit2, 
  Check, 
  X, 
  Loader2, 
  AlertCircle,
  Lock,
  Plus,
  Mail,
  Key
} from 'lucide-react';
import type { Perfil, UserRole } from '../types';
import { RolePermissions } from './RolePermissions';


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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [addForm, setAddForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'operario' as UserRole
  });

  const roles: UserRole[] = ['administrador', 'supervisor', 'operario'];

  useEffect(() => {
    fetchPerfiles();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      // Create a temporary client that doesn't persist the session,
      // avoiding kicking out the current user admin
      const tempClient = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
      });

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: addForm.email,
        password: addForm.password,
        options: {
          data: {
            full_name: addForm.nombre,
          }
        }
      });

      if (authError) throw authError;

      if (!authData.user?.id) {
         throw new Error("No se pudo crear el usuario en Auth.");
      }

      // Wait a moment for trigger to execute if any
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Attempt to upsert the role manually to make sure it's saved correctly
      const { error: dbError } = await supabase.from('perfiles').upsert({
         id: authData.user.id,
         email: addForm.email,
         nombre: addForm.nombre,
         rol: addForm.rol
      });

      if (dbError) {
         console.warn("No se pudo insertar en perfiles directamente. Intentando update...", dbError);
         // If RLS prevents upsert, we just use update (assuming the trigger inserted the row)
         await supabase.from('perfiles').update({
             nombre: addForm.nombre,
             rol: addForm.rol
         }).eq('id', authData.user.id);
      }

      setAddForm({ nombre: '', email: '', password: '', rol: 'operario' });
      setIsAddModalOpen(false);
      fetchPerfiles();

    } catch (err: any) {
      setError('Error al crear usuario: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

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
      case 'administrador': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'supervisor': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
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
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando Usuarios...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-32">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <Users className="text-primary" size={24} />
            </div>
            <h1 className="text-3xl font-display font-black tracking-tight text-gray-800">Gestión de Usuarios</h1>
          </div>
          <p className="text-gray-500 font-medium">Administra accesos y roles de la plataforma Invent-IA</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o email..."
              className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-800 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all placeholder:text-gray-300 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="w-full sm:w-auto px-6 py-4 bg-primary text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            <Plus size={20} />
            Nuevo Usuario
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-500">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Users List */}
      <div className="grid gap-4">
        {filteredPerfiles.map((perfil) => (
          <div 
            key={perfil.id} 
            className={`group relative bg-white border rounded-[32px] p-6 transition-all duration-300 ${editingId === perfil.id ? 'border-primary ring-4 ring-primary/10 shadow-xl' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden">
                  <span className="text-xl font-black text-gray-300">
                    {perfil.nombre?.charAt(0) || perfil.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <div className="space-y-1">
                  {editingId === perfil.id ? (
                    <input 
                      type="text" 
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-1.5 text-gray-800 text-lg font-bold outline-none focus:border-primary w-full"
                      value={editForm.nombre}
                      onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                      autoFocus
                    />
                  ) : (
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      {perfil.nombre || 'Sin nombre'}
                      {perfil.rol === 'administrador' && <Shield size={14} className="text-amber-500" />}
                    </h3>
                  )}
                  <p className="text-sm text-gray-400 font-medium">{perfil.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {editingId === perfil.id ? (
                  <div className="flex items-center gap-3">
                    <select 
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 outline-none focus:border-primary appearance-none cursor-pointer"
                      value={editForm.rol}
                      onChange={(e) => setEditForm({...editForm, rol: e.target.value as UserRole})}
                    >
                      {roles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                    </select>
                    
                    <button 
                      onClick={() => handleUpdate(perfil.id)}
                      className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Check size={20} />
                    </button>
                    <button 
                      onClick={() => setEditingId(null)}
                      className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-all"
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
                      className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-primary hover:bg-primary/5 transition-all"
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
            <Search className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="font-bold uppercase tracking-widest text-gray-800">No se encontraron usuarios</p>
          </div>
        )}
      </div>

      {/* Matriz de Permisos (RBAC) */}
      <RolePermissions />


      {/* Modal for Creating User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => !isCreating && setIsAddModalOpen(false)}
          />
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Shield className="text-primary" size={20} />
                </div>
                <h3 className="text-xl font-display font-black tracking-tight text-gray-800">Nueva Identidad</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-600 transition-colors"
                disabled={isCreating}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 tracking-widest">Nombre del Responsable</label>
                <input 
                  type="text" 
                  required
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-gray-800 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium placeholder:text-gray-300"
                  placeholder="Ej: Oscar Núñez"
                  value={addForm.nombre}
                  onChange={(e) => setAddForm({...addForm, nombre: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 tracking-widest">Correo Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="email" 
                    required
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-gray-800 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium placeholder:text-gray-300"
                    placeholder="nombre@empresa.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({...addForm, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 tracking-widest">Contraseña Inicial</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="password" 
                    required
                    minLength={6}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 pl-11 pr-4 text-gray-800 outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all text-sm font-medium placeholder:text-gray-300"
                    placeholder="••••••••"
                    value={addForm.password}
                    onChange={(e) => setAddForm({...addForm, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-gray-400 ml-1 tracking-widest">Perfil de Seguridad</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3.5 px-4 text-gray-800 text-sm font-bold outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all appearance-none cursor-pointer"
                  value={addForm.rol}
                  onChange={(e) => setAddForm({...addForm, rol: e.target.value as UserRole})}
                >
                  {roles.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>

              <button 
                type="submit" 
                disabled={isCreating}
                className="w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 mt-4 text-white bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                {isCreating ? 'Procesando identidades...' : 'Confirmar Usuario'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
