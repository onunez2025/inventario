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
    const { data, error } = await supabase
      .from('conteos')
      .select(`
        id,
        articulo_id,
        usuario_id,
        cantidad_fisica,
        observacion,
        foto_url,
        created_at
      `)
      .eq('inventario_id', inventarioId)
      .order('created_at', { ascending: false })
      .limit(10000);

    if (error) {
      console.error("Error fetching counts:", error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const articuloIds = [...new Set(data.map(d => d.articulo_id))];
      const usuarioIds = [...new Set(data.map(d => d.usuario_id))];
      
      const articulosMap = new Map<string, any>();
      const perfilesMap = new Map<string, any>();

      // Fetch Articulos in chunks
      const articuloChunkSize = 200;
      for (let i = 0; i < articuloIds.length; i += articuloChunkSize) {
        const chunk = articuloIds.slice(i, i + articuloChunkSize);
        const { data: articulosData } = await supabase
          .from('articulos')
          .select('id, sku, nombre')
          .in('id', chunk);
        if (articulosData) {
          articulosData.forEach(a => articulosMap.set(a.id, { sku: a.sku, nombre: a.nombre }));
        }
      }

      // Fetch Perfiles in chunks
      const perfilChunkSize = 200;
      for (let i = 0; i < usuarioIds.length; i += perfilChunkSize) {
        const chunk = usuarioIds.slice(i, i + perfilChunkSize);
        const { data: perfilesData } = await supabase
          .from('perfiles')
          .select('id, nombre')
          .in('id', chunk);
        if (perfilesData) {
          perfilesData.forEach(p => perfilesMap.set(p.id, { nombre: p.nombre }));
        }
      }

      const enrichedData = data.map(d => ({
        ...d,
        articulos: articulosMap.get(d.articulo_id) || { sku: 'N/A', nombre: 'Artículo no encontrado' },
        perfiles: perfilesMap.get(d.usuario_id) || { nombre: 'Desconocido' }
      }));
      setCounts(enrichedData);
    } else {
      setCounts([]);
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
    <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 shadow-sm border border-gray-100 flex flex-col h-[600px]">
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
          <>
            {/* Mobile Card View (Deck) */}
            <div className="block sm:hidden space-y-4 p-3 sm:p-4">
              {filteredCounts.map((record) => (
                <div key={record.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <User size={14} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-gray-800 leading-tight">{record.perfiles?.nombre || 'Desconocido'}</p>
                        <p className="text-[9px] text-gray-400 font-medium">{new Date(record.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-gray-100 rounded-lg font-display font-black text-gray-800 text-sm">
                        {record.cantidad_fisica}
                      </span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <p className="font-bold text-gray-800 text-xs line-clamp-1">{record.articulos?.nombre}</p>
                    <p className="text-[9px] uppercase font-mono tracking-tighter text-gray-400">{record.articulos?.sku}</p>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-1">
                    {record.observacion && (
                      <div className="flex items-center gap-1.5 text-amber-600">
                        <MessageSquare size={14} />
                        <span className="text-[10px] font-medium truncate max-w-[150px]">{record.observacion}</span>
                      </div>
                    )}
                    {record.foto_url && (
                      <a 
                        href={`${supabase.storage.from('evidencias').getPublicUrl(record.foto_url).data.publicUrl}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 px-2 py-1 bg-primary/5 text-primary rounded-lg text-[10px] font-bold"
                      >
                        <ImageIcon size={12} /> Ver Foto
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet/Desktop Table View */}
            <div className="hidden sm:block">
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
            </div>
          </>
        )}
      </div>
    </div>
  );
};
