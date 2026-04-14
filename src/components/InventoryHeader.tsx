import React from 'react';
import { MapPin, Calendar, Clock, ChevronDown } from 'lucide-react';
import type { Inventario } from '../types';

interface InventoryHeaderProps {
  activeInventory: Inventario;
  onChangeInventory: () => void;
}

export const InventoryHeader: React.FC<InventoryHeaderProps> = ({ activeInventory, onChangeInventory }) => {
  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
          <MapPin size={28} />
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest leading-none mb-1">
            Sesión Activa
          </p>
          <h2 className="text-2xl font-display font-black text-gray-800 leading-none">
            {activeInventory.tienda_nombre}
          </h2>
          <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {new Date(activeInventory.fecha_inicio).toLocaleDateString()}
            </span>
            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
            <span className={`px-2 py-0.5 rounded-full uppercase tracking-widest text-[9px] ${
              activeInventory.estado === 'abierto' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
            }`}>
              {activeInventory.estado}
            </span>
          </div>
        </div>
      </div>

      <button 
        onClick={onChangeInventory}
        className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl font-bold text-sm transition-colors"
      >
        Cambiar Tienda
        <ChevronDown size={16} className="text-gray-400" />
      </button>
    </div>
  );
};
