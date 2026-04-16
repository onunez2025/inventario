import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Articulo } from '../types';
import { X, Save, AlertCircle, Package, Info } from 'lucide-react';
import SearchableSelect from './SearchableSelect';

interface ItemModalProps {
  articulo?: Articulo; // If provided, we are editing
  initialSku?: string; // If provided, pre-fill for new item
  onClose: () => void;
  onSave: () => void;
}

export const ItemModal: React.FC<ItemModalProps> = ({ articulo, initialSku, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    sku: articulo?.sku || initialSku || '',
    nombre: articulo?.nombre || '',
    categoria: articulo?.categoria || '',
    marca: articulo?.marca || '',
    costo_unitario: articulo?.costo_unitario || 0,
    stock_sistema: articulo?.stock_sistema || 0,
    tipo: articulo?.tipo || 'PRODUCTO',
    descripcion: articulo?.descripcion || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);

  React.useEffect(() => {
    fetchAuxData();
  }, []);

  const fetchAuxData = async () => {
    try {
      const { data: catData } = await supabase.rpc('get_unique_categories');
      const { data: brandData } = await supabase.rpc('get_unique_brands');
      
      // Si la RPC no existe aún (la crearé luego), usaremos un select distinct simple
      if (!catData) {
        const { data: res } = await supabase.from('articulos').select('categoria').not('categoria', 'is', null);
        const unique = Array.from(new Set(res?.map(r => r.categoria) || []));
        setCategories(unique as string[]);
      } else {
        setCategories(catData);
      }

      if (!brandData) {
        const { data: res } = await supabase.from('articulos').select('marca').not('marca', 'is', null);
        const unique = Array.from(new Set(res?.map(r => r.marca) || []));
        setBrands(unique as string[]);
      } else {
        setBrands(brandData);
      }
    } catch (e) {
      console.error('Error fetching categories/brands', e);
    }
  };

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 pb-32">
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

          <div className="grid grid-cols-1 gap-4">
            <SearchableSelect
              label="Categoría"
              options={categories}
              value={formData.categoria}
              onChange={(val) => setFormData({ ...formData, categoria: val })}
              placeholder="Seleccionar categoría..."
            />
            
            <SearchableSelect
              label="Marca"
              options={brands}
              value={formData.marca}
              onChange={(val) => setFormData({ ...formData, marca: val })}
              placeholder="Seleccionar marca..."
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-on-surface/50 ml-1">Tipo de Artículo</label>
            <select 
              required
              className="input-field appearance-none"
              value={formData.tipo}
              onChange={e => setFormData({ ...formData, tipo: e.target.value })}
            >
              <option value="PRODUCTO">PRODUCTO</option>
              <option value="SUMINISTRO">SUMINISTRO</option>
              <option value="BONIFICACION">BONIFICACIÓN</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Costo (S/)</label>
              <input 
                type="number"
                step="0.01"
                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                value={formData.costo_unitario}
                onChange={e => setFormData({ ...formData, costo_unitario: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest ml-1">Stock Sistema</label>
              <input 
                type="number"
                className="w-full bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold"
                placeholder="0"
                value={formData.stock_sistema}
                onChange={e => setFormData({ ...formData, stock_sistema: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <p className="text-[10px] text-primary/70 font-medium leading-relaxed">
              Al guardar, este producto formará parte del maestro oficial. Asegúrese de que los datos coincidan con la etiqueta física.
            </p>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold transition-all shadow-lg active:scale-[0.98] ${
              loading ? 'bg-gray-400' : 'bg-primary hover:bg-primary/90 shadow-primary/20'
            }`}
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : (
              <>
                <Save size={20} />
                <span>{articulo ? 'Actualizar Maestro' : 'Registrar en Maestro'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
