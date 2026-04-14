import React, { useState, useEffect, useRef } from 'react';
import { Camera, Search, ArrowRight, Package, Calculator, Loader2, Zap, Layout } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface ScannerProps {
  onScan: (sku: string, mode: 'standard' | 'barrido') => void;
  onCancel: () => void;
}

export const ScannerComponent: React.FC<ScannerProps> = ({ onScan, onCancel }) => {
  const [manualSku, setManualSku] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isBarrido, setIsBarrido] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastScanFeedback, setLastScanFeedback] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedSkuRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

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
            handleAutoScan(decodedText);
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
  }, [isBarrido]); // Re-start if mode changes? Actually, we don't need to restart, but the callback closure needs the latest isBarrido.
  // Better use a ref for isBarrido to avoid effect dependency or wrap handleAutoScan.

  const isBarridoRef = useRef(isBarrido);
  useEffect(() => {
    isBarridoRef.current = isBarrido;
  }, [isBarrido]);

  const handleAutoScan = (decodedText: string) => {
    const now = Date.now();
    // Cooldown de 2 segundos para el mismo SKU en modo barrido
    if (isBarridoRef.current && decodedText === lastScannedSkuRef.current && (now - lastScanTimeRef.current < 2000)) {
      return;
    }

    lastScannedSkuRef.current = decodedText;
    lastScanTimeRef.current = now;

    if (isBarridoRef.current) {
      // Feedback visual inmediato
      setLastScanFeedback(decodedText);
      setTimeout(() => setLastScanFeedback(null), 1000);
      onScan(decodedText, 'barrido');
    } else {
      stopScanner().then(() => onScan(decodedText, 'standard'));
    }
  };

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
      const mode = isBarrido ? 'barrido' : 'standard';
      if (mode === 'standard') {
        stopScanner().then(() => onScan(manualSku.trim(), 'standard'));
      } else {
        onScan(manualSku.trim(), 'barrido');
        setManualSku('');
        setLastScanFeedback(manualSku.trim());
        setTimeout(() => setLastScanFeedback(null), 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-300">
      
      {/* Mode Selector */}
      <div className="absolute top-8 left-0 right-0 flex justify-center px-6 z-10">
        <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl flex gap-1 border border-white/10 w-full max-w-xs shadow-2xl">
          <button 
            onClick={() => setIsBarrido(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isBarrido ? 'bg-white text-primary shadow-lg scale-105' : 'text-white/40 hover:text-white/60'}`}
          >
            <Calculator size={14} />
            Manual
          </button>
          <button 
            onClick={() => setIsBarrido(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isBarrido ? 'bg-secondary text-white shadow-lg shadow-secondary/20 scale-105' : 'text-white/40 hover:text-white/60'}`}
          >
            <Zap size={14} />
            Barrido
          </button>
        </div>
      </div>

      {/* Scanner Wrapper */}
      <div className={`relative w-full max-w-sm aspect-square rounded-[40px] border-2 overflow-hidden shadow-2xl transition-all duration-500 ${isBarrido ? 'border-secondary/50 shadow-secondary/10' : 'border-white/20 shadow-primary/10'}`}>
        <div id="reader" className="w-full h-full flex items-center justify-center bg-black overflow-hidden [&_video]:object-contain" />
        
        {/* Flash Feedback */}
        {lastScanFeedback && (
          <div className="absolute inset-0 bg-secondary/20 backdrop-blur-[2px] flex flex-col items-center justify-center animate-out fade-out duration-1000 pointer-events-none">
            <div className="bg-secondary text-white p-4 rounded-3xl shadow-2xl scale-125 animate-in zoom-in duration-300">
               <Zap size={32} className="fill-current" />
            </div>
            <p className="mt-4 font-black text-xl tracking-widest text-secondary text-shadow-lg">¡REGISTRADO!</p>
            <p className="text-sm font-bold opacity-70">{lastScanFeedback}</p>
          </div>
        )}

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
            <div className={`absolute top-1/2 left-4 right-4 h-0.5 shadow-[0_0_15px] animate-pulse ${isBarrido ? 'bg-secondary shadow-secondary' : 'bg-red-500 shadow-red-500'}`} />
            <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none" />
            {/* Corner Brackets */}
            <div className={`absolute top-10 left-10 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg transition-colors ${isBarrido ? 'border-secondary' : 'border-white/30'}`} />
            <div className={`absolute top-10 right-10 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg transition-colors ${isBarrido ? 'border-secondary' : 'border-white/30'}`} />
            <div className={`absolute bottom-10 left-10 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg transition-colors ${isBarrido ? 'border-secondary' : 'border-white/30'}`} />
            <div className={`absolute bottom-10 right-10 w-8 h-8 border-b-4 border-r-4 rounded-br-lg transition-colors ${isBarrido ? 'border-secondary' : 'border-white/30'}`} />
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-1">
        <p className={`text-xs font-display tracking-[0.2em] uppercase font-black transition-colors ${isBarrido ? 'text-secondary opacity-100' : 'opacity-50'}`}>
          {isBarrido ? 'Modo Barrido Activo' : 'Escaneando...'}
        </p>
        {isBarrido && <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Registrando 1x1 automáticamente</p>}
      </div>

      {/* Manual Input Section */}
      <div className="mt-8 w-full max-w-xs space-y-6 animate-in slide-in-from-bottom-5 duration-500">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-widest text-white/40">O ingresa manualmente</p>
          <div className="relative">
            <input 
              type="text" 
              placeholder="CÓDIGO SKU"
              className="w-full bg-white/10 border border-white/20 p-5 rounded-2xl text-center text-xl font-black tracking-[0.3em] focus:bg-white/20 focus:border-primary outline-none transition-all placeholder:opacity-20 uppercase"
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value.toUpperCase())}
            />
            {manualSku && (
              <button 
                type="submit"
                className={`absolute right-3 top-3 bottom-3 px-5 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all ${isBarrido ? 'bg-secondary shadow-secondary/20' : 'bg-primary shadow-primary/20'}`}
              >
                {isBarrido ? <Zap size={24} /> : <ArrowRight size={24} />}
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
         <Layout size={20} />
         <Search size={20} />
      </div>
    </div>
  );
};
