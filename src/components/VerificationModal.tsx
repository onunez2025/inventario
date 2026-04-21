import React, { useState } from 'react';
import type { Articulo } from '../types';
import { Camera, AlertCircle, Save, X, Info, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VerificationModalProps {
  articulo: Articulo;
  inventarioId: string;
  zonaId?: string;
  usuarioId: string;
  onClose: () => void;
  onSave: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({ 
  articulo, 
  inventarioId,
  zonaId,
  usuarioId,
  onClose, 
  onSave 
}) => {
  const [conteo, setConteo] = useState<number | string>('');
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [foto, setFoto] = useState<File | null>(null);

  const diferencia = Number(conteo) - articulo.stock_sistema;
  const impactoEconomico = diferencia * articulo.costo_unitario;

  const handleSave = async () => {
    if (!inventarioId) {
      alert('Error: No hay un inventario activo seleccionado.');
      return;
    }

    setLoading(true);
    let fotoUrl = '';

    if (foto) {
      const fileExt = foto.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { data } = await supabase.storage
        .from('evidencias')
        .upload(fileName, foto);
      
      if (data) fotoUrl = data.path;
    }

    const { error } = await supabase.from('conteos').insert({
      articulo_id: articulo.id,
      cantidad_fisica: Number(conteo),
      observacion,
      foto_url: fotoUrl,
      inventario_id: inventarioId,
      zona_id: zonaId || null,
      usuario_id: usuarioId
    });

    if (!error) onSave();
    else {
      console.error('Error saving count:', error);
      alert('Error al guardar el conteo');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="p-8 space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-full">Verificación Activa</span>
                <span className="text-[10px] font-bold text-on-surface/60 uppercase tracking-widest">SKU: {articulo.sku}</span>
              </div>
              <h2 className="text-3xl font-display font-black text-on-surface leading-tight">{articulo.nombre}</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-3 bg-white/50 border border-black/5 rounded-2xl hover:bg-white transition-all active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/50 border border-black/5 p-5 rounded-3xl">
              <p className="text-[10px] uppercase opacity-70 font-black tracking-widest mb-1">Stock Sistema</p>
              <div className="flex items-baseline gap-1">
                <p className="text-2xl font-black">{articulo.stock_sistema}</p>
                <p className="text-xs font-bold opacity-60 uppercase">Unid</p>
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/10 p-5 rounded-3xl">
              <p className="text-[10px] uppercase text-primary/60 font-black tracking-widest mb-1">Costo Valorizado</p>
              <div className="flex items-baseline gap-1 py-1">
                <p className="text-xs font-bold text-primary/60">S/.</p>
                <p className="text-2xl font-black text-primary">{articulo.costo_unitario.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Input Section */}
          <div className="space-y-3">
            <label className="text-xs font-black uppercase tracking-[0.2em] text-on-surface/60 px-1">
               Cantidad Detectada Física
            </label>
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-on-surface/40 group-focus-within:text-primary transition-colors">
                <Calculator size={24} />
              </div>
              <input 
                type="number" 
                autoFocus
                className="w-full bg-white/50 border border-black/5 p-7 pl-16 rounded-[2rem] text-3xl font-black focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all outline-none"
                placeholder="0"
                value={conteo}
                onChange={(e) => setConteo(e.target.value)}
              />
            </div>
          </div>

          {/* Difference & Impact Container */}
          {conteo !== '' && (
            <div className={`p-6 rounded-[2rem] border animate-in slide-in-from-top-4 duration-500 ${diferencia === 0 ? 'bg-secondary/5 border-secondary/10' : 'bg-red-500/5 border-red-500/10'}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl ${diferencia === 0 ? 'bg-secondary/20 text-secondary' : 'bg-red-500/20 text-red-500'}`}>
                  <AlertCircle size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-black uppercase tracking-widest ${diferencia === 0 ? 'text-secondary' : 'text-red-500'}`}>
                      {diferencia === 0 ? 'Stock Conciliado' : `Discrepancia: ${diferencia > 0 ? '+' : ''}${diferencia} Unid.`}
                    </p>
                    {diferencia !== 0 && (
                      <span className="text-xs font-black px-2 py-0.5 bg-red-500/10 text-red-500 rounded-md">Alerta de Merma</span>
                    )}
                  </div>
                  <p className="text-xs opacity-70 mt-1 font-medium italic">
                    {diferencia === 0 ? 'Los datos coinciden plenamente con el sistema.' : `Impacto proyectado en inventario: S/. ${Math.abs(impactoEconomico).toLocaleString()}`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Observations & Photo */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/60 px-1">Notas de Campo</label>
              <textarea 
                className="w-full bg-white/50 border border-black/5 p-4 rounded-3xl min-h-[100px] text-sm focus:bg-white outline-none transition-all placeholder:opacity-30"
                placeholder="Describa el estado físico, ubicación o anomalías..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />
            </div>
            <div className="w-24 space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-on-surface/60 px-1">Evidencia</label>
               <label className="relative block w-full aspect-square bg-white/50 border border-black/5 rounded-3xl overflow-hidden cursor-pointer hover:bg-white hover:border-primary/20 transition-all group">
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files && setFoto(e.target.files[0])} />
                  {foto ? (
                    <div className="absolute inset-0 flex items-center justify-center p-2 bg-primary/5 text-primary text-[10px] font-black uppercase text-center">
                      Imagen Cargada
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-on-surface/40 group-hover:text-primary transition-colors">
                      <Camera size={28} />
                    </div>
                  )}
               </label>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex flex-col gap-4">
            <button 
              disabled={loading || conteo === ''}
              onClick={handleSave}
              className="btn-premium w-full flex items-center justify-center gap-3 py-5 text-sm"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  PROCESANDO...
                </div>
              ) : (
                <>
                  <Save size={18} />
                  CONFIRMAR REGISTRO
                </>
              )}
            </button>
            
            <div className="flex items-center justify-center gap-2 py-2 opacity-60">
              <Info size={14} />
              <p className="text-[9px] font-bold uppercase tracking-widest">Dato asegurado con auditoría biométrica y GPS</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
