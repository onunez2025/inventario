import React, { useState } from 'react';
import { X, ShieldCheck, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SupervisorAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sku: string;
}

const SupervisorAuthModal: React.FC<SupervisorAuthModalProps> = ({ isOpen, onClose, onSuccess, sku }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('El PIN debe ser de 4 dígitos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Llamada segura a la función de la base de datos
      const { data, error: rpcError } = await supabase.rpc('validar_autorizacion_supervisor', {
        p_pin: pin
      });

      if (rpcError) throw rpcError;

      if (data.success) {
        onSuccess();
        setPin('');
      } else {
        setError(data.error || 'PIN incorrecto. Autorización denegada.');
        setPin('');
      }
    } catch (err: any) {
      setError('Error de conexión o validación. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyClick = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(null);
    }
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="glass w-full max-w-sm rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header Decorator */}
        <div className="h-2 w-full bg-gradient-to-r from-primary via-secondary to-primary" />

        <div className="p-10">
          {/* Header */}
          <div className="text-center space-y-3 mb-10">
            <div className="inline-flex p-4 rounded-3xl bg-primary/10 text-primary border border-primary/10">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-2xl font-display font-black text-on-surface uppercase tracking-tighter">Autorización</h3>
            <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest leading-relaxed">
              Intervención requerida para:<br />
              <span className="text-primary opacity-100 font-black">SKU {sku}</span>
            </p>
          </div>

          {/* PIN Indicators */}
          <div className="flex justify-center gap-4 mb-10">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-14 h-18 border-2 rounded-2xl flex items-center justify-center text-3xl font-black transition-all duration-300 ${
                  pin.length > i 
                    ? 'border-primary text-primary bg-primary/5 shadow-[0_0_15px_rgba(0,49,120,0.1)]' 
                    : 'border-black/5 text-on-surface/5 bg-transparent'
                } ${error ? 'border-red-500/50 text-red-500 bg-red-500/5 animate-pulse' : ''}`}
              >
                {pin.length > i ? '•' : ''}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-[10px] font-black uppercase tracking-widest mb-8 bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyClick(num)}
                className="h-16 glass hover:bg-white text-on-surface text-2xl font-black rounded-3xl active:scale-90 transition-all shadow-sm flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-16 flex items-center justify-center text-[10px] font-black text-on-surface/30 hover:text-red-500 uppercase tracking-widest transition-all"
            >
              LIMPIAR
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('0')}
              className="h-16 glass hover:bg-white text-on-surface text-2xl font-black rounded-3xl active:scale-90 transition-all shadow-sm flex items-center justify-center"
            >
              0
            </button>
            <button
              type="button"
              disabled={loading || pin.length !== 4}
              onClick={handleSubmit}
              className={`h-16 rounded-3xl flex items-center justify-center text-white transition-all shadow-xl active:scale-95 ${
                pin.length === 4 
                  ? 'bg-secondary shadow-secondary/20 font-black' 
                  : 'bg-black/5 text-on-surface/10 grayscale pointer-events-none'
              }`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="text-xs uppercase tracking-[0.2em]">OK</span>
              )}
            </button>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 text-[10px] font-black text-on-surface/20 hover:text-red-500 transition-all uppercase tracking-[0.3em]"
          >
            Cancelar Proceso
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupervisorAuthModal;
