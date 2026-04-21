import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  X, 
  Plus, 
  Upload, 
  Trash2, 
  Users, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  MapPin,
  Search,
  FileText
} from 'lucide-react';
import type { Zona, Perfil } from '../types';

interface ZoneManagementModalProps {
  inventoryId: string;
  inventoryName: string;
  onClose: () => void;
}

export const ZoneManagementModal: React.FC<ZoneManagementModalProps> = ({ 
  inventoryId, 
  inventoryName,
  onClose 
}) => {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [inventoryId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [zonasRes, perfilesRes] = await Promise.all([
        supabase.from('zonas').select('*').eq('inventario_id', inventoryId).order('nombre'),
        supabase.from('perfiles').select('*').order('nombre')
      ]);

      if (zonasRes.error) throw zonasRes.error;
      if (perfilesRes.error) throw perfilesRes.error;

      setZonas(zonasRes.data || []);
      setPerfiles(perfilesRes.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    setIsAdding(true);
    const { data, error } = await supabase
      .from('zonas')
      .insert({
        inventario_id: inventoryId,
        nombre: newZoneName,
        estado: 'pendiente'
      })
      .select()
      .single();

    if (error) {
      setError(error.message);
    } else {
      setZonas([...zonas, data].sort((a, b) => a.nombre.localeCompare(b.nombre)));
      setNewZoneName('');
      setIsAdding(false);
    }
    setIsAdding(false);
  };

  const handleAssignUser = async (zoneId: string, userId: string | null) => {
    const { error } = await supabase
      .from('zonas')
      .update({ usuario_asignado_id: userId || null })
      .eq('id', zoneId);

    if (error) {
      setError(error.message);
    } else {
      setZonas(zonas.map(z => z.id === zoneId ? { ...z, usuario_asignado_id: userId || undefined } : z));
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    const { error } = await supabase
      .from('zonas')
      .delete()
      .eq('id', zoneId);

    if (error) {
      setError('No se puede eliminar la zona. Podría tener conteos asociados.');
    } else {
      setZonas(zonas.filter(z => z.id !== zoneId));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if it exists
        const dataRows = lines[0].toLowerCase().includes('nombre') ? lines.slice(1) : lines;

        const newZonas = [];
        for (const row of dataRows) {
          const [nombre, email] = row.split(',').map(s => s.trim());
          if (!nombre) continue;

          let userId = null;
          if (email) {
            const perfil = perfiles.find(p => p.email.toLowerCase() === email.toLowerCase());
            userId = perfil?.id || null;
          }

          newZonas.push({
            inventario_id: inventoryId,
            nombre,
            usuario_asignado_id: userId,
            estado: 'pendiente'
          });
        }

        if (newZonas.length === 0) throw new Error('No se encontraron datos válidos en el archivo.');

        const { error: insertError } = await supabase.from('zonas').insert(newZonas);
        if (insertError) throw insertError;

        fetchData();
      } catch (err: any) {
        setError('Error al importar CSV: ' + err.message);
      } finally {
        setImporting(false);
        if (e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const filteredZonas = zonas.filter(z => 
    z.nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <MapPin className="text-primary" size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-display font-black tracking-tight text-gray-800">Gestionar Zonificación</h3>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{inventoryName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-gray-100 text-gray-400 rounded-full hover:bg-gray-200 hover:text-gray-600 transition-all"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-500 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Actions Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Add Zone */}
            <form onSubmit={handleAddZone} className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Agregar Zona Individual</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Ej: Rack A-01, Zona Fríos..."
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3.5 text-sm font-bold placeholder:text-gray-300 outline-none focus:border-primary transition-all"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={isAdding || !newZoneName.trim()}
                  className="px-6 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {isAdding ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  Crear
                </button>
              </div>
            </form>

            {/* Import CSV */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-black text-gray-400 tracking-widest ml-1">Carga Masiva (CSV)</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                  disabled={importing}
                />
                <label 
                  htmlFor="csv-upload"
                  className={`flex items-center justify-center gap-3 w-full py-3.5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${importing ? 'bg-gray-50 border-gray-200' : 'bg-gray-50 border-primary/20 hover:border-primary/50 hover:bg-primary/5 group'}`}
                >
                  {importing ? (
                    <Loader2 className="animate-spin text-primary" size={20} />
                  ) : (
                    <Upload className="text-primary group-hover:scale-110 transition-transform" size={20} />
                  )}
                  <span className="text-sm font-bold text-gray-600">
                    {importing ? 'Importando datos...' : 'Seleccionar archivo .csv'}
                  </span>
                </label>
                <p className="text-[9px] text-gray-400 font-medium mt-1 text-center">Formato: nombre_zona, email_usuario</p>
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          {/* Zone List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users size={20} className="text-gray-400" />
                <h4 className="text-lg font-black text-gray-800">Zonificación Actual ({zonas.length})</h4>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar zona..."
                  className="w-full bg-white border border-gray-100 rounded-xl pl-9 pr-3 py-2 text-xs font-bold outline-none focus:border-primary/30 transition-all"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Sincronizando zonas...</p>
              </div>
            ) : filteredZonas.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredZonas.map((zona) => (
                  <div 
                    key={zona.id}
                    className="p-4 bg-white border border-gray-100 rounded-[24px] hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all flex items-center justify-between group"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <span className="font-bold text-gray-800">{zona.nombre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users size={12} className="text-gray-400" />
                        <select 
                          className="bg-transparent text-[11px] font-bold text-gray-500 outline-none cursor-pointer border-b border-transparent hover:border-gray-200"
                          value={zona.usuario_asignado_id || ''}
                          onChange={(e) => handleAssignUser(zona.id, e.target.value || null)}
                        >
                          <option value="">Sin asignar</option>
                          {perfiles.map(p => (
                            <option key={p.id} value={p.id}>{p.nombre || p.email}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleDeleteZone(zona.id)}
                      className="p-2.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                      title="Eliminar Zona"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center bg-gray-50/50 rounded-[32px] border-2 border-dashed border-gray-100">
                <MapPin className="mx-auto mb-3 text-gray-200" size={48} />
                <p className="text-sm font-bold text-gray-400">No hay zonas configuradas</p>
                <p className="text-[10px] text-gray-300 uppercase tracking-widest">Agrega o importa zonas para comenzar</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-8 bg-primary/5 border-t border-primary/10 flex gap-4 items-center">
          <div className="p-2 bg-white rounded-xl shadow-sm">
            <FileText className="text-primary" size={20} />
          </div>
          <p className="text-xs text-primary/70 font-bold leading-relaxed">
            La zonificación divide el trabajo físico. Al asignar un usuario, este verá la zona como "Sugerida" al iniciar su conteo, pero cualquier usuario podrá elegir cualquier zona en modo manual.
          </p>
        </div>
      </div>
    </div>
  );
};
