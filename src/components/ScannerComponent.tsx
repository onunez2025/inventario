import React, { useState } from 'react';
import { Camera, Search, ArrowRight, Package, Calculator } from 'lucide-react';

interface ScannerProps {
  onScan: (sku: string) => void;
  onCancel: () => void;
}

export const ScannerComponent: React.FC<ScannerProps> = ({ onScan, onCancel }) => {
  const [manualSku, setManualSku] = useState('');

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="w-64 h-64 border-2 border-white/50 rounded-3xl relative flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_red] animate-pulse" />
        <Camera size={48} className="text-white/20" />
        <p className="mt-4 text-xs font-display tracking-widest opacity-50 uppercase">Escaneando...</p>
      </div>

      <div className="mt-12 w-full max-w-xs space-y-6">
        <div className="space-y-2">
          <p className="text-sm font-display opacity-70">¿Problemas con el escáner?</p>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ingresar SKU manualmente"
              className="w-full bg-white/10 border border-white/20 p-4 rounded-xl text-center font-bold tracking-widest focus:bg-white/20 outline-none transition-all"
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value.toUpperCase())}
            />
            {manualSku && (
              <button 
                onClick={() => onScan(manualSku)}
                className="absolute right-2 top-2 bottom-2 bg-primary px-4 rounded-lg flex items-center justify-center"
              >
                <ArrowRight size={20} />
              </button>
            )}
          </div>
        </div>

        <button 
          onClick={onCancel}
          className="text-white/50 font-display text-sm uppercase tracking-widest hover:text-white"
        >
          Cancelar
        </button>
      </div>

      <div className="absolute bottom-10 flex gap-4">
         <div className="bg-white/10 p-3 rounded-full"><Calculator size={24} /></div>
         <div className="bg-white/10 p-3 rounded-full"><Package size={24} /></div>
         <div className="bg-white/10 p-3 rounded-full"><Search size={24} /></div>
      </div>
    </div>
  );
};
