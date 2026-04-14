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
      const { data, error: fetchError } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', 'PIN_SUPERVISOR')
        .single();

      if (fetchError || !data) {
        throw new Error('No se pudo validar el PIN');
      }

      if (data.valor === pin) {
        onSuccess();
        setPin('');
      } else {
        setError('PIN incorrecto. Autorización denegada.');
      }
    } catch (err: any) {
      setError(err.message);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" />
            <h3 className="font-semibold text-lg">Autorización</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-1">Se requiere autorización de supervisor para registrar:</p>
            <p className="font-mono font-bold text-primary bg-blue-50 py-1 rounded-lg">{sku}</p>
          </div>

          <div className="flex justify-center gap-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-12 h-16 border-2 rounded-xl flex items-center justify-center text-3xl font-bold transition-all duration-200 ${
                  pin.length > i ? 'border-primary text-primary bg-blue-50 shadow-inner' : 'border-gray-200 text-gray-300'
                } ${error ? 'border-red-400 text-red-500 bg-red-50' : ''}`}
              >
                {pin.length > i ? '•' : ''}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm mb-6 bg-red-50 p-3 rounded-lg border border-red-100 animate-shake">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeyClick(num)}
                className="h-14 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xl font-bold rounded-xl active:bg-primary active:text-white transition-all shadow-sm active:shadow-inner"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              className="h-14 text-sm font-semibold text-gray-500 hover:text-red-500 transition-colors"
            >
              Borrar
            </button>
            <button
              type="button"
              onClick={() => handleKeyClick('0')}
              className="h-14 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xl font-bold rounded-xl active:bg-primary active:text-white transition-all shadow-sm active:shadow-inner"
            >
              0
            </button>
            <button
              type="button"
              disabled={loading || pin.length !== 4}
              onClick={handleSubmit}
              className={`h-14 rounded-xl flex items-center justify-center text-white transition-all shadow-lg ${
                pin.length === 4 ? 'bg-secondary hover:bg-secondary/90 active:scale-95' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              {loading ? <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div> : 'Validar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupervisorAuthModal;
