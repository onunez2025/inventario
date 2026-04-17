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
  const [flash, setFlash] = useState<'success' | 'error' | null>(null);
  const [lastScanFeedback, setLastScanFeedback] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedSkuRef = useRef<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);

  const triggerFlash = (type: 'success' | 'error') => {
    setFlash(type);
    setTimeout(() => setFlash(null), 600);
  };

  useEffect(() => {
    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 280, height: 280 },
          },
          (decodedText) => {
            handleAutoScan(decodedText);
          },
          () => {}
        );
        setIsScanning(true);
      } catch (err: any) {
        console.error("Error starting scanner:", err);
        setError("Acceso denegado a la cámara. Revisa los permisos.");
      }
    };

    startScanner();
    return () => { stopScanner(); };
  }, [isBarrido]);

  const isBarridoRef = useRef(isBarrido);
  useEffect(() => {
    isBarridoRef.current = isBarrido;
  }, [isBarrido]);

  const handleAutoScan = (decodedText: string) => {
    const now = Date.now();
    if (isBarridoRef.current && decodedText === lastScannedSkuRef.current && (now - lastScanTimeRef.current < 2000)) {
      return;
    }

    lastScannedSkuRef.current = decodedText;
    lastScanTimeRef.current = now;

    if (isBarridoRef.current) {
      triggerFlash('success');
      setLastScanFeedback(decodedText);
      setTimeout(() => setLastScanFeedback(null), 1500);
      onScan(decodedText, 'barrido');
    } else {
      triggerFlash('success');
      setTimeout(() => {
        stopScanner().then(() => onScan(decodedText, 'standard'));
      }, 300);
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
      triggerFlash('success');
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
    <div className="fixed inset-0 bg-black/95 z-[200] flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-500 overflow-hidden">
      
      {/* Dynamic Background Decoration */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full pointer-events-none" />

      {/* Mode Selector */}
      <div className="absolute top-10 left-0 right-0 flex justify-center px-6 z-20">
        <div className="bg-white/5 backdrop-blur-2xl p-1.5 rounded-3xl flex gap-2 border border-white/10 w-full max-w-xs shadow-2xl">
          <button 
            onClick={() => setIsBarrido(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${!isBarrido ? 'bg-white text-primary shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' : 'text-white/40 hover:text-white/60'}`}
          >
            <Calculator size={16} />
            Manual
          </button>
          <button 
            onClick={() => setIsBarrido(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${isBarrido ? 'bg-secondary text-white shadow-[0_0_20px_rgba(0,107,95,0.4)] scale-105' : 'text-white/40 hover:text-white/60'}`}
          >
            <Zap size={16} />
            Barrido
          </button>
        </div>
      </div>

      {/* Scanner Container */}
      <div className={`relative w-full max-w-md aspect-square rounded-[3rem] border-2 overflow-hidden shadow-2xl transition-all duration-700 ${isBarrido ? 'border-secondary/40 shadow-secondary/5' : 'border-white/10 shadow-primary/5'}`}>
        <div id="reader" className="w-full h-full flex items-center justify-center bg-black overflow-hidden [&_video]:object-cover" />
        
        {/* Flash Overlays */}
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${flash === 'success' ? 'animate-flash-success opacity-100' : 'opacity-0'}`} />
        <div className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${flash === 'error' ? 'animate-flash-error opacity-100' : 'opacity-0'}`} />

        {/* Scan Feedback UI */}
        {lastScanFeedback && (
          <div className="absolute inset-0 glass-dark flex flex-col items-center justify-center animate-in zoom-in duration-300 pointer-events-none">
            <div className="bg-secondary/20 p-6 rounded-[2.5rem] border border-secondary/30 mb-4">
               <Zap size={48} className="text-secondary fill-secondary/20" />
            </div>
            <p className="font-black text-2xl tracking-[0.2em] text-white uppercase text-shadow">¡REGISTRADO!</p>
            <p className="text-sm font-bold opacity-60 mt-1 uppercase tracking-widest">{lastScanFeedback}</p>
          </div>
        )}

        {!isScanning && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 backdrop-blur-md">
            <Loader2 className="animate-spin text-primary" size={48} />
            <p className="text-xs font-black uppercase tracking-[0.3em] opacity-40">Activando Visión</p>
          </div>
        )}

        {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-red-950/40 backdrop-blur-xl p-10">
               <div className="bg-red-500/10 p-5 rounded-full border border-red-500/20">
                <Camera size={48} className="text-red-500" />
               </div>
               <p className="text-sm font-black text-red-500 uppercase tracking-widest leading-relaxed">{error}</p>
               <button onClick={onCancel} className="btn-premium bg-red-500">Volver</button>
            </div>
        )}

        {/* Scanner Ornaments */}
        {isScanning && (
          <>
            <div className="absolute top-0 bottom-0 left-0 right-0 pointer-events-none">
              <div className={`absolute left-0 right-0 h-[2px] shadow-[0_0_20px] animate-scanner-laser ${isBarrido ? 'bg-secondary shadow-secondary' : 'bg-primary shadow-primary'}`} />
            </div>
            
            {/* Corner Markers */}
            <div className="absolute inset-x-8 inset-y-8 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="flex justify-between">
                <div className={`w-10 h-10 border-t-4 border-l-4 rounded-tl-3xl ${isBarrido ? 'border-secondary' : 'border-white'}`} />
                <div className={`w-10 h-10 border-t-4 border-r-4 rounded-tr-3xl ${isBarrido ? 'border-secondary' : 'border-white'}`} />
              </div>
              <div className="flex justify-between">
                <div className={`w-10 h-10 border-b-4 border-l-4 rounded-bl-3xl ${isBarrido ? 'border-secondary' : 'border-white'}`} />
                <div className={`w-10 h-10 border-b-4 border-r-4 rounded-br-3xl ${isBarrido ? 'border-secondary' : 'border-white'}`} />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Manual Input Section */}
      <div className="mt-10 w-full max-w-xs space-y-8 animate-in slide-in-from-bottom-10 duration-700">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="SKU"
              className="w-full bg-white/5 border border-white/10 p-6 rounded-[2rem] text-center text-2xl font-black tracking-[0.4em] focus:bg-white/10 focus:border-white/30 outline-none transition-all placeholder:text-white/10 uppercase"
              value={manualSku}
              onChange={(e) => setManualSku(e.target.value.toUpperCase())}
            />
            {manualSku && (
              <button 
                type="submit"
                className={`absolute right-3 top-3 bottom-3 px-6 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all ${isBarrido ? 'bg-secondary' : 'bg-primary'}`}
              >
                {isBarrido ? <Zap size={28} /> : <ArrowRight size={28} />}
              </button>
            )}
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-30">
            {isBarrido ? 'Modo Barrido Activo (Registro 1x1)' : 'Apunta al código para escanear'}
          </p>
        </form>

        <button 
          onClick={() => stopScanner().then(onCancel)}
          className="group flex flex-col items-center gap-3 mx-auto transition-all hover:scale-110"
        >
          <div className="px-8 py-3 rounded-full border border-white/10 bg-white/5 hover:bg-red-500/10 hover:border-red-500/30 transition-all flex items-center gap-3">
             <span className="text-xs font-black uppercase tracking-widest text-white/60">Finalizar Sesión</span>
          </div>
        </button>
      </div>

      {/* Decorative Brand Dots */}
      <div className="absolute bottom-10 flex gap-3 opacity-20">
         <div className="w-1.5 h-1.5 rounded-full bg-primary" />
         <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
         <div className="w-1.5 h-1.5 rounded-full bg-white" />
      </div>
    </div>
  );
};
