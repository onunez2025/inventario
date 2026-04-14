import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, ArrowRight, Package, Calculator, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (sku: string) => void;
  onCancel: () => void;
}

export const ScannerComponent: React.FC<ScannerProps> = ({ onScan, onCancel }) => {
  const [manualSku, setManualSku] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Success: stop and return SKU
            stopScanner().then(() => onScan(decodedText));
          },
          () => {
            // Failure is normal while searching for a code
          }
        );
        setIsScanning(true);
      } catch (err: any) {
        console.error("Error starting scanner:", err);
        setError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualSku.trim()) {
      stopScanner().then(() => onScan(manualSku.trim()));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-300">
      {/* Scanner Wrapper */}
      <div className="relative w-full max-w-sm aspect-square bg-white/5 rounded-[40px] border-2 border-white/20 overflow-hidden shadow-2xl shadow-primary/10">
        <div id="reader" className="w-full h-full object-cover" />
        
        {!isScanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/50 backdrop-blur-sm">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-sm font-medium opacity-70">Iniciando cámara...</p>
          </div>
        )}

        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-red-950/20 p-8">
               <Camera size={48} className="text-red-500 opacity-50" />
               <p className="text-sm font-bold text-red-500 leading-tight">{error}</p>
               <button onClick={onCancel} className="mt-4 px-6 py-2 bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest">Cerrar</button>
            </div>
        )}

        {/* Overlay Decoration */}
        {isScanning && (
          <>
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_15px_red] animate-bounce" />
            <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none" />
          </>
        )}
      </div>

      <p className="mt-6 text-xs font-display tracking-[0.2em] opacity-50 uppercase font-black">Escaneando...</p>

      {/* Manual Input Section */}
      <div className="mt-12 w-full max-w-xs space-y-8 animate-in slide-in-from-bottom-5 duration-500">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40">O ingresa manualmente</p>
          <div className="relative">
            <input 
              type="text" 
              placeholder="CÓDIGO SKU"
              autoFocus
              className="w-full bg-white/10 border border-white/20 p-5 rounded-2xl text-center text-xl font-black tracking-[0.3em] focus:bg-white/20 focus:border-primary outline-none transition-all placeholder:opacity-20 uppercase"
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value.toUpperCase())}
            />
            {manualSku && (
              <button 
                type="submit"
                className="absolute right-3 top-3 bottom-3 bg-primary px-5 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 active:scale-95 transition-transform"
              >
                <ArrowRight size={24} />
              </button>
            )}
          </div>
        </form>

        <button 
          onClick={() => stopScanner().then(onCancel)}
          className="group flex flex-col items-center gap-2 mx-auto"
        >
          <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
             <span className="text-lg font-bold">×</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100">Cerrar Escáner</span>
        </button>
      </div>

      {/* Footer Decoration */}
      <div className="absolute bottom-12 flex gap-10 opacity-20 pointer-events-none">
         <Calculator size={20} />
         <Package size={20} />
         <Search size={20} />
      </div>
    </div>
  );
};
