import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database, Search, Loader2 } from 'lucide-react';
import { StockManager } from './StockManager';

interface SystemStockTableProps {
  inventarioId: string;
  onUpdate: () => void;
}

export const SystemStockTable: React.FC<SystemStockTableProps> = ({ inventarioId, onUpdate }) => {
  const [stockRecords, setStockRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchStock = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('inventario_stock_sistema')
      .select(`
        id,
        sku,
        stock_sistema,
        created_at
      `)
      .eq('inventario_id', inventarioId)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const skusToFetch = [...new Set(data.map(d => d.sku))];
      const articulosMap = new Map<string, string>();
      
      const chunkSize = 200;
      for (let i = 0; i < skusToFetch.length; i += chunkSize) {
        const chunk = skusToFetch.slice(i, i + chunkSize);
        const { data: articulosData } = await supabase
          .from('articulos')
          .select('sku, nombre')
          .in('sku', chunk);
          
        if (articulosData) {
          articulosData.forEach(a => articulosMap.set(a.sku, a.nombre));
        }
      }

      const enrichedData = data.map(d => ({
        ...d,
        articulos: articulosMap.has(d.sku) ? { nombre: articulosMap.get(d.sku) } : null
      }));
      setStockRecords(enrichedData);
    } else {
      setStockRecords([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStock();
  }, [inventarioId]);

  const handleUpdate = () => {
    fetchStock();
    onUpdate(); // Propagate to parent to update main conciliacion data if needed
  };

  const filteredRecords = stockRecords.filter(r => 
    r.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.articulos?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <StockManager inventarioId={inventarioId} onUpdate={handleUpdate} />

      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-800">Stock Cargado</h3>
              <p className="text-xs text-gray-400 font-medium">{stockRecords.length} registros en esta sesión</p>
            </div>
          </div>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
            <input 
              type="text" 
              placeholder="Buscar SKU o Artículo..."
              className="input-field pl-10 py-2 text-sm w-full sm:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-50/50 rounded-2xl border border-gray-100">
          {loading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm font-medium">No se encontraron registros de stock</p>
            </div>
          ) : (
             <table className="w-full text-left text-sm">
                <thead className="bg-white text-gray-400 uppercase tracking-widest text-[10px] font-bold sticky top-0 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 rounded-tl-2xl">SKU</th>
                    <th className="px-6 py-4">Artículo</th>
                    <th className="px-6 py-4 text-right rounded-tr-2xl">Stock Sistema</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-white transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-gray-600">{record.sku}</td>
                      <td className="px-6 py-4 font-medium text-gray-800">
                        {record.articulos ? record.articulos.nombre : <span className="text-red-400 text-xs italic">SKU no maestro</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-display font-bold text-gray-800">
                        {record.stock_sistema}
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          )}
        </div>
      </div>
    </div>
  );
};
