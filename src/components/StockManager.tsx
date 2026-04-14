import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Database, 
  Upload, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  FileSpreadsheet,
  X
} from 'lucide-react';

interface StockManagerProps {
  inventarioId: string;
  onUpdate: () => void;
}

export const StockManager: React.FC<StockManagerProps> = ({ inventarioId, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,sku,cantidad\nEJEMPLO-001,100\nEJEMPLO-002,50";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_stock_sistema.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };



  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        // Skip header if it exists (detecting 'sku' in first line)
        let startIndex = 0;
        if (lines[0].toLowerCase().includes('sku')) {
          startIndex = 1;
        }

        const records = lines.slice(startIndex).map(line => {
          const [sku, cantidad] = line.split(',').map(item => item.trim());
          if (!sku) throw new Error('Formato de CSV inválido: falta SKU');
          return {
            inventario_id: inventarioId,
            sku: sku,
            stock_sistema: parseInt(cantidad, 10) || 0
          };
        });

        if (records.length === 0) {
          throw new Error('El archivo está vacío o no tiene registros válidos');
        }

        // Batch upsert into inventario_stock_sistema
        // Using upsert on (inventario_id, sku) would be ideal but requires a unique constraint
        // For simplicity, we'll delete and re-insert, or just handle it as requested.
        // Direct insert is faster if we cleared before.
        
        const { error: insertError } = await supabase
          .from('inventario_stock_sistema')
          .insert(records);

        if (insertError) {
          throw new Error(insertError.message);
        }

        setSuccess(`Se han importado ${records.length} registros correctamente`);
        onUpdate();
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        setError('Error al procesar el archivo: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Error al leer el archivo');
      setLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Database className="text-primary" size={24} />
        </div>
        <div>
          <h4 className="font-bold text-gray-800">Gestión de Stock Sistema</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Control de carga masiva</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Import Button */}
        <div className="relative">
          <input 
            type="file" 
            accept=".csv"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="hidden"
            id="csv-upload"
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-secondary text-white py-4 rounded-2xl font-bold shadow-lg shadow-secondary/20 hover:bg-secondary-container transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
            Importar CSV
          </button>
        </div>

        {/* Download Template Button */}
        <button 
          onClick={handleDownloadTemplate}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-4 rounded-2xl font-bold border border-blue-100 hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-50"
        >
          <FileSpreadsheet size={20} />
          Descargar Plantilla
        </button>


      </div>

      {/* Feedback Messages */}
      {error && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center justify-between gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="flex-shrink-0" />
            <p className="text-xs font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center justify-between gap-3 text-green-600 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="flex-shrink-0" />
            <p className="text-xs font-medium">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)}><X size={16} /></button>
        </div>
      )}

      <div className="bg-gray-50 rounded-2xl p-4 flex items-start gap-3">
        <FileSpreadsheet className="text-gray-400 mt-1" size={16} />
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Instrucciones</p>
          <p className="text-[9px] text-gray-400 leading-tight">
            Sube un archivo .csv con columnas <span className="font-bold">sku, cantidad</span>. 
            El stock cargado solo afectará a los cálculos de esta sesión de inventario.
          </p>
        </div>
      </div>
    </div>
  );
};
