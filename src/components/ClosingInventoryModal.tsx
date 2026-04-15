import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Mail, PenTool, CheckCircle2, X, Loader2, FileText, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { pdfService } from '../services/pdfService';
import { excelService } from '../services/excelService';
import type { ConciliacionRecord, Inventario } from '../types';

interface ClosingInventoryModalProps {
  inventory: Inventario;
  data?: ConciliacionRecord[]; // Optional, will fetch if not provided
  onClose: () => void;
  onSuccess: () => void;
}

export const ClosingInventoryModal: React.FC<ClosingInventoryModalProps> = ({
  inventory,
  data: initialData,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState(1);
  const [emails, setEmails] = useState('');
  const [loading, setLoading] = useState(false);
  const [localData, setLocalData] = useState<ConciliacionRecord[]>(initialData || []);
  const [fetchingData, setFetchingData] = useState(!initialData);
  
  const managerSigPad = useRef<SignatureCanvas>(null);
  const supervisorSigPad = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (!initialData) {
      fetchData();
    }
  }, [inventory.id]);

  const fetchData = async () => {
    setFetchingData(true);
    let allRecords: ConciliacionRecord[] = [];
    let from = 0;
    const batchSize = 1000;

    while (true) {
      const { data: batch, error } = await supabase
        .from('vista_conciliacion')
        .select('*')
        .eq('inventario_id', inventory.id)
        .range(from, from + batchSize - 1);

      if (error) {
        console.error('Error fetching data for modal:', error);
        break;
      }

      allRecords = [...allRecords, ...(batch || [])];
      if (!batch || batch.length < batchSize) break;
      from += batchSize;
    }
    setLocalData(allRecords);
    setFetchingData(false);
  };

  const handleFinish = async () => {
    if (!emails.trim()) {
      alert('Por favor ingrese al menos un correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      const emailList = emails.split(',').map(e => e.trim()).filter(e => e.length > 0);
      
      const signatures = {
        manager: managerSigPad.current?.getTrimmedCanvas().toDataURL('image/png') || '',
        supervisor: supervisorSigPad.current?.getTrimmedCanvas().toDataURL('image/png') || ''
      };

      // 1. Generate PDF (as blob and as base64)
      const pdfBlob = await pdfService.generateInventorySummary(inventory, localData, signatures, emailList);
      const pdfBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(pdfBlob);
      });
      
      // 2. Generate Excel as base64
      const excelBase64 = await excelService.getInventoryReportBase64(localData, inventory.tienda_nombre);
      
      // 3. Update Inventory Status in Supabase
      const { error: updateError } = await supabase
        .from('inventarios')
        .update({
          estado: 'cerrado',
          fecha_fin: new Date().toISOString(),
          metadata: {
            closed_by_emails: emailList,
            has_signatures: true
          }
        })
        .eq('id', inventory.id);

      if (updateError) throw updateError;

      // 4. Send Email via Edge Function
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('send-inventory-report', {
        body: {
          emails: emailList,
          pdfBase64,
          excelBase64,
          inventoryName: inventory.tienda_nombre,
          date: new Date().toLocaleString()
        }
      });

      if (edgeError) {
        console.warn('Correo no enviado (Edge Function error):', edgeError);
        alert('Inventario cerrado localmente, pero hubo un problema enviando el correo. Puede exportar los archivos manualmente.');
      } else {
        alert('Inventario cerrado exitosamente. El reporte ha sido enviado a: ' + emails);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Error al cerrar inventario: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-display font-black text-gray-800">Cierre de Inventario</h2>
            <p className="text-gray-500 text-sm font-medium">{inventory.tienda_nombre} • {new Date().toLocaleDateString()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Step 1: Emails */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-primary">
              <Mail size={20} />
              <h3 className="font-bold uppercase tracking-widest text-xs">Destinatarios del Reporte</h3>
            </div>
            <p className="text-sm text-gray-500">Ingrese los correos separados por coma para enviar el PDF y Excel final.</p>
            <textarea 
              placeholder="admin@empresa.com, supervisor@tienda.com"
              className="w-full h-24 p-4 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-medium"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
            />
          </div>

          {/* Step 2: Signatures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Manager Signature */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-secondary">
                <PenTool size={20} />
                <h3 className="font-bold uppercase tracking-widest text-xs">Firma Encargado Tienda</h3>
              </div>
              <div className="border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
                <SignatureCanvas 
                  ref={managerSigPad}
                  penColor="#003178"
                  canvasProps={{ className: 'w-full h-40' }}
                />
                <button 
                  onClick={() => managerSigPad.current?.clear()}
                  className="w-full py-2 bg-gray-100 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors"
                >
                  Limpiar Firma
                </button>
              </div>
            </div>

            {/* Supervisor Signature */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-secondary">
                <PenTool size={20} />
                <h3 className="font-bold uppercase tracking-widest text-xs">Firma Supervisor</h3>
              </div>
              <div className="border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
                <SignatureCanvas 
                  ref={supervisorSigPad}
                  penColor="#003178"
                  canvasProps={{ className: 'w-full h-40' }}
                />
                <button 
                  onClick={() => supervisorSigPad.current?.clear()}
                  className="w-full py-2 bg-gray-100 text-[10px] font-black uppercase text-gray-400 hover:text-red-500 transition-colors"
                >
                  Limpiar Firma
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-gray-100 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-4 px-6 rounded-2xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleFinish}
            disabled={loading}
            className="flex-[2] py-4 px-6 rounded-2xl font-bold text-white bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Send size={20} />
                Finalizar y Enviar Reporte
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
