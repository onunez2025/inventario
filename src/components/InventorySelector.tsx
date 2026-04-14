import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight,
  Loader2,
  PackageSearch
} from 'lucide-react';
import type { Inventario } from '../types';

interface InventorySelectorProps {
  onSelect: (inventory: Inventario) => void;
}

export const InventorySelector: React.FC<InventorySelectorProps> = ({ onSelect }) => {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActiveInventories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('inventarios')
        .select('*')
        .eq('estado', 'abierto')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setInventarios(data);
      }
      setLoading(false);
    };

    fetchActiveInventories();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-3">
        <Loader2 className="animate-spin text-primary" size={32} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Buscando sesiones activas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4">
          <PackageSearch className="text-primary" size={32} />
        </div>
        <h2 className="text-2xl font-display font-black text-gray-800">Seleccionar Inventario</h2>
        <p className="text-sm text-gray-500">Para comenzar, selecciona la tienda o almacén donde realizarás el conteo.</p>
      </div>

      <div className="grid gap-3">
        {inventarios.length > 0 ? (
          inventarios.map((inv) => (
            <button
              key={inv.id}
              onClick={() => onSelect(inv)}
              className="flex items-center justify-between p-5 bg-white border border-gray-100 rounded-3xl hover:border-primary hover:shadow-lg hover:shadow-primary/5 transition-all group active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  <MapPin size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-gray-800">{inv.tienda_nombre}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <Calendar size={10} />
                    {new Date(inv.fecha_inicio).toLocaleDateString()}
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <Clock size={10} />
                    {inv.estado}
                  </div>
                </div>
              </div>
              <ChevronRight className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" size={20} />
            </button>
          ))
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <p className="text-sm text-gray-400 font-medium px-6">
              No hay sesiones de inventario abiertas en este momento. 
              Por favor, contacta a un supervisor.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
