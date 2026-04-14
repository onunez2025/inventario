import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Articulo } from '../types';
import { X, Save, AlertCircle, Package } from 'lucide-react';

interface ItemModalProps {
  articulo?: Articulo; // If provided, we are editing
  onClose: () => void;
  onSave: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ articulo, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sku: articulo?.sku || '',
    nombre: articulo?.nombre || '',
    categoria: articulo?.categoria || '',
    costo_unitario: articulo?.costo_unitario || 0,
    stock_sistema: articulo?.stock_sistema || 0,
    descripcion: articulo?.descripcion || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (articulo) {
        // Edit
        const { error } = await supabase
          .from('articulos')
          .update(formData)
          .eq('id', articulo.id);
        if (error) throw error;
      } else {
        // Create
        const { error } = await supabase
          .from('articulos')
          .insert([formData]);
        if (error) throw error;
      }
      onSave();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el artículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-primary p-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Package size={24} />
             <h2 className="text-xl font-display">{articulo ? 'Editar Artículo' : 'Nuevo Artículo'}</h2>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-on-surface/50 ml-1">SKU / Código de Barras</label>
            <input 
              required
              className="input-field"
              placeholder="Ej: PROD-123456"
              value={formData.sku}
              onChange={e => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              disabled={!!articulo} // SKU usually shouldn't change
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-on-surface/50 ml-1">Nombre del Producto</label>
            <input 
              required
              className="input-field"
              placeholder="Ej: Laptop Dell XPS 13"
              value={formData.nombre}
              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-on-surface/50 ml-1">Categoría</label>
              <input 
                className="input-field"
                placeholder="Ej: Electrónica"
                value={formData.categoria}
                onChange={e => setFormData({ ...formData, categoria: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-on-surface/50 ml-1">Costo Unitario</label>
              <input 
                type="number"
                step="0.01"
                className="input-field"
                value={formData.costo_unitario}
                onChange={e => setFormData({ ...formData, costo_unitario: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-on-surface/50 ml-1">Stock de Sistema inicial</label>
            <input 
              type="number"
              className="input-field"
              placeholder="0"
              value={formData.stock_sistema}
              onChange={e => setFormData({ ...formData, stock_sistema: Number(e.target.value) })}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4 mt-4"
          >
            <Save size={20} />
            {loading ? 'Guardando...' : 'Guardar Artículo'}
          </button>
        </form>
      </div>
    </div>
  );
};
