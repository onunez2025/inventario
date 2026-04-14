import React, { useState } from 'react';
import { Articulo } from '../types';
import { Camera, AlertCircle, Save, X, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VerificationModalProps {
  articulo: Articulo;
  onClose: () => void;
  onSave: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ articulo, onClose, onSave }) => {
  const [conteo, setConteo] = useState<number | string>('');
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);

  const diferencia = Number(conteo) - articulo.stock_sistema;
  const impactoEconomico = diferencia * articulo.costo_unitario;

  const handleSave = async () => {
    setLoading(true);
    let fotoUrl = '';

    if (foto) {
      const fileExt = foto.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data, error: uploadError } = await supabase.storage
        .from('evidencias')
        .upload(fileName, foto);
      
      if (data) fotoUrl = data.path;
    }

    const { error } = await supabase.from('conteos').insert({
      articulo_id: articulo.id,
      cantidad_fisica: Number(conteo),
      observacion,
      foto_url: fotoUrl,
      // Note: In a real app, you'd get the inventario_id and usuario_id from context/state
      inventario_id: 'eb92c81a-6d6c-4b5a-9b4a-1085d168b165' 
    });

    if (!error) onSave();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-widest text-on-surface/50 font-bold">Verificación de Stock</p>
              <h2 className="text-2xl font-display">{articulo.nombre}</h2>
              <p className="text-sm text-primary font-bold">SKU: {articulo.sku}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-surface-container-low rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface-container-low p-4 rounded-2xl">
              <p className="text-[10px] uppercase opacity-50 font-bold">Stock Sistema</p>
              <p className="text-xl font-display">{articulo.stock_sistema} uds</p>
            </div>
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <p className="text-[10px] uppercase text-primary font-bold">Precio Unit.</p>
              <p className="text-xl font-display">S/. {articulo.costo_unitario}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold flex items-center gap-2">
              <Calculator size={16} /> Cantidad Contada
            </label>
            <input 
              type="number" 
              className="input-field text-2xl font-display text-center"
              placeholder="0"
              value={conteo}
              onChange={(e) => setConteo(e.target.value)}
            />
          </div>

          {conteo !== '' && (
            <div className={`p-4 rounded-2xl flex items-center gap-4 animate-in fade-in duration-500 ${diferencia === 0 ? 'bg-secondary-container/20 text-secondary' : 'bg-red-50 text-red-600'}`}>
              <AlertCircle size={24} />
              <div>
                <p className="text-sm font-bold">Diferencia: {diferencia > 0 ? '+' : ''}{diferencia} unidades</p>
                <p className="text-xs opacity-70">Impacto económico: S/. {impactoEconomico.toLocaleString()}</p>
              </div>
            </div>
          )}

          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Observaciones</label>
                <textarea 
                  className="input-field min-h-[80px] text-sm"
                  placeholder="Ej: Producto dañado, error de ubicación..."
                  value={observacion}
                  onChange={(e) => setObservacion(e.target.value)}
                />
              </div>
              <div className="w-20">
                 <label className="text-xs font-bold uppercase opacity-50 mb-1 block">Foto</label>
                 <label className="w-full aspect-square bg-surface-container-high rounded-xl flex items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setFoto(e.target.files[0])} />
                    <Camera size={24} className={foto ? 'text-primary' : 'text-on-surface/30'} />
                 </label>
              </div>
            </div>
          </div>

          <button 
            disabled={loading || conteo === ''}
            onClick={handleSave}
            className="btn-primary w-full flex items-center justify-center gap-2 py-4"
          >
            {loading ? 'Guardando...' : (
              <>
                <Save size={20} />
                Confirmar Hallazgo
              </>
            )}
          </button>
          
          <div className="flex items-center gap-2 text-[10px] text-on-surface/40 bg-surface-container-low p-2 rounded-lg">
            <Info size={12} />
            <p>Asegúrese de revisar los contenedores adyacentes antes de confirmar.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
