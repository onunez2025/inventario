import React, { useState } from 'react';
import { Package, TrendingDown, Download } from 'lucide-react';
import { InventoryHeader } from '../components/InventoryHeader';
import { InventorySelector } from '../components/InventorySelector';
import DashboardIndicators from '../components/DashboardIndicators';
import { SystemStockTable } from '../components/SystemStockTable';
import { PhysicalCountsTable } from '../components/PhysicalCountsTable';
import { excelService } from '../services/excelService';
import type { Inventario, ConciliacionRecord, Perfil, PermissionKey } from '../types';

interface StatusPageProps {
  activeInventory: Inventario | null;
  data: ConciliacionRecord[];
  recentCounts: any[];
  perfil: Perfil | null;
  permisos: PermissionKey[];
  onSelectInventory: (inv: Inventario) => void;
  onChangeInventory: () => void;
  onScan: (sku: string) => void;
  setShowScanner: (show: boolean) => void;
  fetchData: () => void;
}

const StatusPage: React.FC<StatusPageProps> = ({
  activeInventory,
  data,
  recentCounts,
  perfil,
  permisos,
  onSelectInventory,
  onChangeInventory,
  onScan,
  setShowScanner,
  fetchData
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'system_stock' | 'physical_counts'>('summary');
  const hasPermission = (key: PermissionKey) => permisos.includes(key);

  const progreso = {
    total: activeInventory ? (data.length || 0) : 0,
    completados: data.filter(d => Number(d.cantidad_fisica) > 0).length
  };

  if (!activeInventory) {
    return <InventorySelector onSelect={onSelectInventory} />;
  }

  return (
    <main className="p-3 sm:p-4 max-w-4xl mx-auto space-y-4 sm:space-y-6 pb-32 flex-1">
      <InventoryHeader 
        activeInventory={activeInventory} 
        onChangeInventory={onChangeInventory} 
      />

      <section className="bg-primary p-6 rounded-[2rem] text-white shadow-xl shadow-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -m-8 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="flex justify-between items-end mb-4 relative z-10">
          <div>
            <h3 className="text-base sm:text-lg font-bold">Progreso Toma Física</h3>
            <p className="text-[10px] sm:text-xs text-blue-100 line-clamp-1">Tienda: {activeInventory?.tienda_nombre}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-display font-black">
              {progreso.total > 0 ? Math.round((progreso.completados / progreso.total) * 100) : 0}
              <span className="text-sm ml-1">%</span>
            </p>
          </div>
        </div>
        <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden relative z-10">
          <div 
            className="bg-secondary h-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,161,222,0.5)]" 
            style={{ width: `${progreso.total > 0 ? (progreso.completados / progreso.total) * 100 : 0}%` }}
          />
        </div>
        <p className="mt-3 text-[10px] uppercase font-bold text-blue-200 tracking-widest">{progreso.completados} de {progreso.total} productos auditados</p>
      </section>

      <div className="flex bg-gray-100 p-1 rounded-2xl overflow-x-auto no-scrollbar sticky top-[68px] z-30 shadow-sm border border-gray-200/50">
        <button 
          onClick={() => setActiveTab('summary')}
          className={`flex-1 min-w-[100px] px-3 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'summary' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Resumen Cruce
        </button>
        {hasPermission('view_master') && (
          <button 
            onClick={() => setActiveTab('system_stock')}
            className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'system_stock' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Stock Sistema
          </button>
        )}
        <button 
          onClick={() => setActiveTab('physical_counts')}
          className={`flex-1 min-w-[120px] px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'physical_counts' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Conteos Detalle
        </button>
        {hasPermission('view_dashboard') && (
          <button 
            onClick={() => excelService.exportInventoryReport(data, activeInventory.tienda_nombre)}
            className="ml-2 px-3 py-2 bg-green-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-green-600 transition-all shadow-sm active:scale-95 flex-shrink-0"
            title="Exportar a Excel"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        )}
      </div>

      {activeTab === 'system_stock' && hasPermission('view_master') && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <SystemStockTable inventarioId={activeInventory.id} onUpdate={fetchData} />
        </div>
      )}

      {activeTab === 'physical_counts' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
           <PhysicalCountsTable inventarioId={activeInventory.id} />
        </div>
      )}

      {(activeTab === 'summary' || perfil?.rol === 'operario') && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {hasPermission('view_dashboard') && (
            <DashboardIndicators data={data} tiendaNombre={activeInventory?.tienda_nombre} />
          )}

          <section className="space-y-4">
            <h3 className="text-lg px-2">Actividad de Inventario</h3>
            <div className="space-y-3">
                {recentCounts.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                    <Package size={48} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-400 font-medium">No se han registrado conteos hoy</p>
                    <button 
                      onClick={() => setShowScanner(true)}
                      className="mt-4 text-primary font-bold text-xs uppercase tracking-widest bg-white px-4 py-2 rounded-full shadow-sm"
                    >
                      Empezar a Escanear
                    </button>
                  </div>
                ) : (
                  recentCounts.map(count => (
                    <div 
                      key={count.id} 
                      className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group active:scale-[0.98] transition-all cursor-pointer hover:border-secondary/30" 
                      onClick={() => onScan(count.articulos?.sku)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center transition-colors">
                          <Package size={24} />
                        </div>
                        <div className="max-w-[180px]">
                          <p className="text-sm font-bold text-gray-800 line-clamp-1">{count.articulos?.nombre}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{count.articulos?.sku}</p>
                            <span className="text-[8px] text-gray-300 font-bold">•</span>
                            <p className="text-[9px] text-gray-400 font-bold">{new Date(count.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-lg font-display font-bold text-secondary">{count.cantidad_fisica}</span>
                          <span className="text-[10px] text-gray-400 font-bold uppercase">uds</span>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-on-surface/30 truncate max-w-[80px]">
                          {count.observacion || 'Conteo'}
                        </p>
                      </div>
                    </div>
                  ))
                )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default StatusPage;
