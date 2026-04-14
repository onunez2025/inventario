import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Articulo } from '../types';
import { Search, Plus, Filter, MoreVertical, Package, ArrowLeft, Trash2, Edit2 } from 'lucide-react';
import { ItemModal } from './ItemModal';

interface ItemMasterProps {
  onBack: () => void;
}

export const ItemMaster: React.FC<ItemMasterProps> = ({ onBack }) => {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  // New States
  const [showModal, setShowModal] = useState(false);
  const [editingArticulo, setEditingArticulo] = useState<Articulo | undefined>(undefined);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');

  useEffect(() => {
    fetchArticulos();
  }, []);

  const fetchArticulos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('articulos')
      .select('*')
      .order('nombre', { ascending: true });

    if (!error) setArticulos(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este artículo?')) {
      const { error } = await supabase.from('articulos').delete().eq('id', id);
      if (!error) fetchArticulos();
    }
    setActiveMenu(null);
  };

  const categories = ['Todas', ...new Set(articulos.filter(a => a.categoria).map(a => a.categoria!))];

  const filteredItems = articulos.filter(a => {
    const matchesSearch = a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         a.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || a.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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

        <div className="flex gap-2 pb-2 overflow-x-auto no-scrollbar">
           <div className="relative flex-shrink-0">
             <select 
               className="appearance-none bg-white px-8 py-2 rounded-full text-xs font-bold shadow-sm border border-outline-variant/10 focus:outline-none"
               value={selectedCategory}
               onChange={(e) => setSelectedCategory(e.target.value)}
             >
               {categories.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
             <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface/50" />
           </div>
           
           <button 
             onClick={() => { setEditingArticulo(undefined); setShowModal(true); }}
             className="bg-primary text-white px-4 py-2 rounded-full text-xs font-bold shadow-sm flex items-center gap-2 flex-shrink-0"
           >
             <Plus size={14} /> Nuevo Artículo
           </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-24">
          {loading ? (
            <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-8 w-8 border-b-4 border-primary"></div></div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 opacity-30">
              <Package size={64} className="mx-auto mb-4" />
              <p>No se encontraron artículos</p>
            </div>
          ) : filteredItems.map(item => (
            <div key={item.id} className="card p-4 flex items-center gap-4 bg-white hover:bg-surface-container-low transition-colors group relative">
              <div className="w-12 h-12 bg-surface-container-low rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                <Package size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{item.nombre}</p>
                <div className="flex gap-2 mt-1">
                  <p className="text-[10px] text-on-surface/50 uppercase tracking-widest font-bold">SKU: {item.sku}</p>
                  {item.categoria && <p className="text-[9px] bg-secondary/10 text-secondary px-1.5 rounded">{item.categoria}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-primary">S/. {item.costo_unitario}</p>
                <p className="text-[10px] text-on-surface/40">{item.stock_sistema} en sistema</p>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === item.id ? null : item.id)}
                  className="p-1 opacity-20 hover:opacity-100"
                >
                  <MoreVertical size={16} />
                </button>
                
                {activeMenu === item.id && (
                  <div className="absolute right-0 top-8 w-32 bg-white rounded-xl shadow-2xl border border-outline-variant/10 z-20 overflow-hidden animate-in slide-in-from-top-2 duration-150">
                    <button 
                      onClick={() => { setEditingArticulo(item); setShowModal(true); setActiveMenu(null); }}
                      className="w-full p-3 text-left text-xs flex items-center gap-2 hover:bg-surface-container-low"
                    >
                      <Edit2 size={14} /> Editar
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="w-full p-3 text-left text-xs flex items-center gap-2 hover:bg-red-50 text-red-600"
                    >
                      <Trash2 size={14} /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <ItemModal 
          articulo={editingArticulo}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            fetchArticulos();
          }}
        />
      )}
    </div>
  );
};
