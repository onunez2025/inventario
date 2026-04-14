import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  History, 
  Search, 
  Loader2, 
  User, 
  Image as ImageIcon,
  MessageSquare
} from 'lucide-react';

interface PhysicalCountsTableProps {
  inventarioId: string;
}

export const PhysicalCountsTable: React.FC<PhysicalCountsTableProps> = ({ inventarioId }) => {
  const [counts, setCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCounts = async () => {
    setLoading(true);
    // Join with articulos to get SKU and Name, and perfiles (or auth.users if available via view)
    // Supabase allows joins on foreign keys.
    const { data, error } = await supabase
      .from('conteos')
      .select(`
        id,
        cantidad_fisica,
        observacion,
        foto_url,
        created_at,
        articulos ( sku, nombre ),
        perfiles ( nombre )
      `)
      .eq('inventario_id', inventarioId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCounts(data);
    } else if (error) {
       console.error("Error fetching counts:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCounts();
  }, [inventarioId]);

  const filteredCounts = counts.filter(r => {
    const term = searchTerm.toLowerCase();
    const sku = r.articulos?.sku || '';
    const name = r.articulos?.nombre || '';
    const userName = r.perfiles?.nombre || '';
    
    return sku.toLowerCase().includes(term) || 
           name.toLowerCase().includes(term) || 
           userName.toLowerCase().includes(term);
  });

  return (
    <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col h-[600px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
            <History size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Historial Detallado de Conteos</h3>
            <p className="text-xs text-gray-400 font-medium">{counts.length} registros de escaneo</p>
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
          <input 
            type="text" 
            placeholder="Buscar SKU, Artículo o Pasillo..."
            className="input-field pl-10 py-2 text-sm w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-50/50 rounded-2xl border border-gray-100">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : filteredCounts.length === 0 ? (
          <div className="text-center py-20 opacity-40">
            <History size={48} className="mx-auto mb-4" />
            <p className="text-gray-500 font-medium">No hay conteos registrados aún</p>
          </div>
        ) : (
           <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-400 uppercase tracking-widest text-[10px] font-bold sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl">Fecha / Hora</th>
                  <th className="px-6 py-4">Usuario</th>
                  <th className="px-6 py-4">Artículo</th>
                  <th className="px-6 py-4 text-center">Detalle</th>
                  <th className="px-6 py-4 text-right rounded-tr-2xl">Cantidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCounts.map((record) => (
                  <tr key={record.id} className="hover:bg-white transition-colors group">
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800">{new Date(record.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{new Date(record.created_at).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                           <User size={12} />
                         </div>
                         <span className="font-medium text-gray-700">{record.perfiles?.nombre || 'Desconocido'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-800 line-clamp-1">{record.articulos?.nombre}</p>
                      <p className="text-[10px] uppercase font-mono tracking-tighter text-gray-400">{record.articulos?.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                          {record.observacion && (
                            <div className="group/tooltip relative">
                               <MessageSquare size={16} className="text-amber-500" />
                               <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block w-48 bg-gray-800 text-white text-[10px] p-2 rounded-lg z-20">
                                 {record.observacion}
                               </div>
                            </div>
                          )}
                          {record.foto_url && (
                             <a 
                               href={`${supabase.storage.from('evidencias').getPublicUrl(record.foto_url).data.publicUrl}`} 
                               target="_blank" 
                               rel="noreferrer"
                               className="text-primary hover:scale-110 transition-transform"
                             >
                                <ImageIcon size={16} />
                             </a>
                          )}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg font-display font-black text-gray-800">
                         {record.cantidad_fisica}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
           </table>
        )}
      </div>
    </div>
  );
};
