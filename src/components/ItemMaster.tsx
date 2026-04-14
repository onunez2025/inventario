import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Articulo } from '../types';
import { Search, Plus, Filter, MoreVertical, Package, ArrowLeft } from 'lucide-react';

interface ItemMasterProps {
  onBack: () => void;
}

export const ItemMaster: React.FC<ItemMasterProps> = ({ onBack }) => {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticulos();
  }, []);

  const fetchArticulos = async () => {
    const { data, error } = await supabase
      .from('articulos')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error) setArticulos(data || []);
    setLoading(false);
  };

  const filteredItems = articulos.filter(a => 
    a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface flex flex-col pt-4">
      <header className="px-6 flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-xl">Maestro de Artículos</h2>
      </header>

      <div className="px-6 space-y-4 flex-1 overflow-hidden flex flex-col">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o SKU..."
            className="input-field pl-12 bg-white shadow-sm border-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 pb-2">
           <button className="bg-white px-4 py-2 rounded-full text-xs font-bold shadow-sm border border-outline-variant/10 flex items-center gap-2">
             <Filter size={14} /> Filtrar por Categoría
           </button>
           <button className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm flex items-center gap-2">
             <Plus size={14} /> Nuevo Artículo
           </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-6">
          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-4 border-primary"></div></div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 opacity-30">
              <Package size={64} className="mx-auto mb-4" />
              <p>No se encontraron artículos</p>
            </div>
          ) : filteredItems.map(item => (
            <div key={item.id} className="card p-4 flex items-center gap-4 bg-white hover:bg-surface-container-low transition-colors group">
              <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Package size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{item.nombre}</p>
                <p className="text-[10px] text-on-surface/50 uppercase tracking-widest font-bold">SKU: {item.sku}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-primary">S/. {item.costo_unitario}</p>
                <p className="text-[10px] text-on-surface/40">{item.stock_sistema} en sistema</p>
              </div>
              <button className="p-1 opacity-20 hover:opacity-100">
                <MoreVertical size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
