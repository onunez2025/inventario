import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  Plus, 
  Play, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Shield, 
  AlertCircle,
  Loader2,
  ChevronRight,
  Power
} from 'lucide-react';
import type { Inventario } from '../types';

interface InventorySessionsProps {
  activeInventoryId: string | null;
  onSelectInventory: (inventory: Inventario) => void;
}

export const InventorySessions: React.FC<InventorySessionsProps> = ({ 
  activeInventoryId, 
  onSelectInventory 
}) => {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTienda, setNewTienda] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchInventarios();
  }, []);

  const fetchInventarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError('Error al cargar inventarios: ' + error.message);
    } else {
      setInventarios(data || []);
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTienda.trim()) return;

    setActionLoading('creating');
    const { data, error } = await supabase
      .from('inventarios')
      .insert({
        tienda_nombre: newTienda,
        estado: 'abierto',
        fecha_inicio: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      alert('Error al crear inventario: ' + error.message);
    } else {
      setNewTienda('');
      setIsCreating(false);
      fetchInventarios();
      if (data) onSelectInventory(data);
    }
    setActionLoading(null);
  };

  const handleCloseInventory = async (inv: Inventario) => {
    if (!window.confirm(`¿Está seguro que desea cerrar el inventario de "${inv.tienda_nombre}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    setActionLoading(inv.id);
    const { error } = await supabase
      .from('inventarios')
      .update({
        estado: 'cerrado',
        fecha_fin: new Date().toISOString()
      })
      .eq('id', inv.id);

    if (error) {
      alert('Error al cerrar inventario: ' + error.message);
    } else {
      fetchInventarios();
    }
    setActionLoading(null);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'abierto': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'cerrado': return 'bg-gray-100 text-gray-500 border-gray-200';
      default: return 'bg-blue-100 text-blue-500';
    }
  };

  if (loading && inventarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 gap-4">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Cargando Sesiones...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-secondary/10 rounded-2xl">
              <Calendar className="text-secondary" size={24} />
            </div>
            <h1 className="text-3xl font-display font-black tracking-tight text-gray-800">Programación</h1>
          </div>
          <p className="text-gray-500 font-medium">Gestiona las sesiones de toma física e inventarios por tienda</p>
        </div>

        <button 
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center justify-center gap-2 px-6 py-4 shadow-xl shadow-primary/20"
        >
          <Plus size={20} />
          Programar Nuevo
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-500">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Creation Form Modal-like */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[210] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-display font-bold mb-6">Programar Inventario</h3>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Nombre de la Tienda / Ubicación</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input 
                    type="text" 
                    placeholder="Ej: Almacén Central, Tienda Lima..."
                    className="input-field pl-12"
                    value={newTienda}
                    onChange={(e) => setNewTienda(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 bg-gray-100 text-gray-500 font-bold py-4 rounded-2xl hover:bg-gray-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={actionLoading === 'creating'}
                  className="flex-[2] btn-primary py-4 flex items-center justify-center gap-2"
                >
                  {actionLoading === 'creating' ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  Iniciar Sesión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="grid gap-4">
        {inventarios.map((inv) => (
          <div 
            key={inv.id} 
            className={`group bg-white border rounded-[32px] p-6 transition-all duration-300 ${activeInventoryId === inv.id ? 'border-primary ring-4 ring-primary/10 shadow-xl' : 'border-gray-100 hover:border-gray-200 hover:shadow-md'}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${activeInventoryId === inv.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-300'}`}>
                  {inv.estado === 'abierto' ? <Clock size={28} /> : <CheckCircle2 size={28} />}
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-800">{inv.tienda_nombre}</h3>
                    <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full border ${getStatusBadge(inv.estado)}`}>
                      {inv.estado}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(inv.fecha_inicio).toLocaleDateString()}
                    </span>
                    {inv.fecha_fin && (
                      <span className="flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Cerrado: {new Date(inv.fecha_fin).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {inv.estado === 'abierto' && (
                  <>
                    {activeInventoryId !== inv.id ? (
                      <button 
                        onClick={() => onSelectInventory(inv)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary/10 text-primary rounded-xl font-bold text-sm hover:bg-primary hover:text-white transition-all group"
                      >
                        <Play size={16} className="group-hover:fill-current" />
                        Seleccionar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20">
                        <CheckCircle2 size={16} />
                        Activo
                      </div>
                    )}
                    
                    <button 
                      onClick={() => handleCloseInventory(inv)}
                      disabled={actionLoading === inv.id}
                      className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Cerrar Inventario"
                    >
                      {actionLoading === inv.id ? <Loader2 className="animate-spin" size={20} /> : <Power size={20} />}
                    </button>
                  </>
                )}
                {inv.estado === 'cerrado' && (
                   <button 
                    onClick={() => onSelectInventory(inv)}
                    className="p-2.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                    title="Ver Resultados"
                  >
                    <ChevronRight size={24} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {inventarios.length === 0 && (
          <div className="text-center py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100">
            <Calendar className="mx-auto mb-4 text-gray-200" size={64} />
            <p className="font-bold text-gray-400 uppercase tracking-widest text-sm">No hay inventarios programados</p>
            <button 
              onClick={() => setIsCreating(true)}
              className="mt-4 text-primary font-bold text-xs underline underline-offset-4"
            >
              Crea el primero ahora
            </button>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gray-50/50 border border-gray-100 rounded-[32px] p-8 flex gap-6 items-start">
        <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-50">
          <Shield className="text-primary" size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-gray-800">Control de Sesiones</h4>
          <p className="text-sm text-gray-500 leading-relaxed">
            Solo una sesión abierta puede estar "Activa" para la toma física. Al cerrar un inventario, se congela la conciliación para auditoría externa y ya no se podrán añadir nuevos hallazgos.
          </p>
        </div>
      </div>
    </div>
  );
};
