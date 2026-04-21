import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  MapPin, 
  ChevronDown, 
  Check, 
  Map as MapIcon, 
  UserCheck, 
  Loader2,
  Settings
} from 'lucide-react';
import type { Zona } from '../types';

interface ZoneSelectorProps {
  inventoryId: string;
  selectedZone: Zona | null;
  onSelectZone: (zona: Zona | null) => void;
  currentUserEmail: string | null;
}

export const ZoneSelector: React.FC<ZoneSelectorProps> = ({ 
  inventoryId, 
  selectedZone, 
  onSelectZone,
  currentUserEmail
}) => {
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'suggested' | 'manual'>('suggested');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchZonasAndUser();
  }, [inventoryId]);

  const fetchZonasAndUser = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data, error } = await supabase
        .from('zonas')
        .select('*')
        .eq('inventario_id', inventoryId)
        .order('nombre');

      if (error) throw error;
      setZonas(data || []);
      
      // If there are suggested zones, default to suggested mode
      const hasSuggested = data?.some(z => z.usuario_asignado_id === user?.id);
      if (!hasSuggested) setMode('manual');

    } catch (err) {
      console.error('Error fetching zones:', err);
    } finally {
      setLoading(false);
    }
  };

  const suggestedZonas = zonas.filter(z => z.usuario_asignado_id === currentUserId);
  const displayZonas = mode === 'suggested' ? suggestedZonas : zonas;

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-2xl">
        <Loader2 className="animate-spin text-gray-400" size={14} />
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cargando Zonas...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all ${selectedZone ? 'bg-primary/5 border-primary/20 text-primary shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200 shadow-sm'}`}
      >
        <div className={`p-1.5 rounded-lg ${selectedZone ? 'bg-primary text-white' : 'bg-gray-50 text-gray-300'}`}>
          <MapPin size={14} />
        </div>
        <div className="text-left">
          <p className="text-[9px] font-black uppercase tracking-widest opacity-60">Zona de Conteo</p>
          <p className="text-xs font-bold truncate max-w-[120px]">
            {selectedZone ? selectedZone.nombre : 'Sin Zona Seleccionada'}
          </p>
        </div>
        <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[150]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full mt-3 right-0 w-72 bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden z-[160] animate-in slide-in-from-top-2 duration-300">
            
            {/* Mode Switcher */}
            <div className="p-2 border-b border-gray-50 flex gap-1">
              <button 
                onClick={() => setMode('suggested')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'suggested' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <UserCheck size={12} />
                Sugerido
              </button>
              <button 
                onClick={() => setMode('manual')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'manual' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                <Settings size={12} />
                Manual
              </button>
            </div>

            {/* List */}
            <div className="max-h-64 overflow-y-auto p-2">
              {displayZonas.length > 0 ? (
                <div className="grid gap-1">
                  {displayZonas.map((zona) => (
                    <button
                      key={zona.id}
                      onClick={() => {
                        onSelectZone(zona);
                        setIsOpen(false);
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl text-left transition-all ${selectedZone?.id === zona.id ? 'bg-primary/5 text-primary' : 'hover:bg-gray-50 text-gray-700'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${selectedZone?.id === zona.id ? 'bg-primary text-white' : 'bg-gray-50 text-gray-300'}`}>
                          <MapIcon size={14} />
                        </div>
                        <span className="text-xs font-bold">{zona.nombre}</span>
                      </div>
                      {selectedZone?.id === zona.id && <Check size={14} />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100 m-1">
                  <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                    {mode === 'suggested' ? 'No tienes zonas sugeridas' : 'No hay zonas configuradas'}
                  </p>
                </div>
              )}
            </div>

            {/* Clear selection */}
            {selectedZone && (
              <div className="p-2 border-t border-gray-50">
                <button 
                  onClick={() => {
                    onSelectZone(null);
                    setIsOpen(false);
                  }}
                  className="w-full py-2.5 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 rounded-xl transition-all"
                >
                  Deseleccionar Zona
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
