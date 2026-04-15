import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis,
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  ChevronRight, 
  Package, 
  MapPin, 
  Activity, 
  TrendingDown, 
  CheckCircle2,
  Download
} from 'lucide-react';
import { excelService } from '../services/excelService';
import type { ConciliacionRecord } from '../types';

interface DashboardIndicatorsProps {
  data: ConciliacionRecord[];
  tiendaNombre?: string;
}

const DashboardIndicators: React.FC<DashboardIndicatorsProps> = ({ data, tiendaNombre }) => {
  // 1. Agregación por Categoría (Grupo de Artículo)
  const categoryMap = data.reduce((acc, curr) => {
    const cat = curr.categoria || 'OTROS';
    acc[cat] = (acc[cat] || 0) + (curr.diferencia_valorizada || 0);
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.value - b.value); // Ordenar por mayor diferencia negativa

  // 2. Agregación por Marca
  const brandMap = data.reduce((acc, curr) => {
    const brand = curr.marca || 'OTROS';
    acc[brand] = (acc[brand] || 0) + (curr.diferencia_valorizada || 0);
    return acc;
  }, {} as Record<string, number>);

  const brandData = Object.entries(brandMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => a.value - b.value);

  // 3. Resultados por Estado
  const statusSummary = {
    Faltante: { 
      skus: 0, 
      confirmados: data.filter(r => r.diferencia_unidades < 0 && r.cantidad_fisica > 0).length, 
      valor: 0 
    },
    Sobrante: { 
      skus: 0, 
      confirmados: data.filter(r => r.diferencia_unidades > 0 && r.cantidad_fisica > 0).length, 
      valor: 0 
    },
    Cuadrado: { 
      skus: 0, 
      confirmados: data.filter(r => r.diferencia_unidades === 0 && r.cantidad_fisica > 0).length, 
      valor: 0 
    }
  };

  data.forEach(r => {
    if (r.diferencia_unidades < 0) {
      statusSummary.Faltante.skus++;
      statusSummary.Faltante.valor += (r.diferencia_valorizada || 0);
    } else if (r.diferencia_unidades > 0) {
      statusSummary.Sobrante.skus++;
      statusSummary.Sobrante.valor += (r.diferencia_valorizada || 0);
    } else {
      statusSummary.Cuadrado.skus++;
      statusSummary.Cuadrado.valor += (r.diferencia_valorizada || 0);
    }
  });

  // 4. Resumen por Local
  const totals = data.reduce((acc, curr) => ({
    sistema: acc.sistema + (curr.stock_sistema || 0),
    inventario: acc.inventario + (curr.cantidad_fisica || 0),
    diferencia: acc.diferencia + (curr.diferencia_unidades || 0),
    valor: acc.valor + (curr.diferencia_valorizada || 0)
  }), { sistema: 0, inventario: 0, diferencia: 0, valor: 0 });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Widget: Resumen por Grupo de Articulo */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px]">
          <div className="p-6 pb-2 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Resumen por Grupo de Artículo</h3>
              <button 
                onClick={() => excelService.exportInventoryReport(data, tiendaNombre || 'S/N')}
                className="mt-2 flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-green-500/20 active:scale-95 transition-all"
              >
                <Download size={12} />
                Exportar Excel
              </button>
            </div>
            <Activity size={18} className="text-primary opacity-20" />
          </div>
          <div className="flex-1 overflow-auto px-6 pb-6 scrollbar-hide">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-50">
                  <th className="py-3 text-[10px] uppercase font-black text-gray-400">Grupo de artículos</th>
                  <th className="py-3 text-[10px] uppercase font-black text-gray-400 text-right">Valor Dif</th>
                  <th className="py-3 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {categoryData.map((cat, idx) => (
                  <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                    <td className="py-4 text-xs font-black text-gray-700 uppercase">{cat.name}</td>
                    <td className={`py-4 text-xs font-bold text-right ${cat.value < 0 ? 'text-red-500' : 'text-green-600'}`}>
                      {formatCurrency(cat.value)}
                    </td>
                    <td className="py-4 text-right">
                      <ChevronRight size={14} className="text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Widget: Grafico de Inventario */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 flex flex-col h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Gráfico de Inventario</h3>
            <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-full">VALOR X DIFERENCIA</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData.slice(0, 10)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fill: '#9ca3af', fontWeight: 800 }} 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.value < 0 ? '#ef4444' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Widget: Resultados por Estado */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Resultados por Estado</h3>
            <CheckCircle2 size={18} className="text-green-500 opacity-20" />
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-50">
                  <th className="pb-3 text-left text-[10px] uppercase font-black text-gray-400">Estados</th>
                  <th className="pb-3 text-center text-[10px] uppercase font-black text-gray-400">SKU</th>
                  <th className="pb-3 text-center text-[10px] uppercase font-black text-gray-400">Confirmado</th>
                  <th className="pb-3 text-right text-[10px] uppercase font-black text-gray-400">Valor Dif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {Object.entries(statusSummary).map(([status, vals]) => (
                  <tr key={status}>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                         <div className={`w-2 h-2 rounded-full ${status === 'Faltante' ? 'bg-red-500' : status === 'Sobrante' ? 'bg-orange-500' : 'bg-green-500'}`} />
                         <span className="font-bold text-gray-700 uppercase tracking-tighter">{status}</span>
                      </div>
                    </td>
                    <td className="py-4 text-center font-bold text-gray-600 font-mono italic">{vals.skus.toLocaleString()}</td>
                    <td className="py-4 text-center font-bold text-gray-600 font-mono italic">{vals.confirmados.toLocaleString()}</td>
                    <td className={`py-4 text-right font-black ${vals.valor < 0 ? 'text-red-500' : 'text-green-600'}`}>{formatCurrency(vals.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Widget: Resumen por Local */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Resumen por Local</h3>
            <div className="w-8 h-8 rounded-2xl bg-primary/5 flex items-center justify-center">
              <MapPin size={16} className="text-primary opacity-60" />
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-[2rem] border border-gray-100 group hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all">
             <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0 group-hover:bg-primary transition-colors">
                <Package size={20} className="text-primary group-hover:text-white transition-colors" />
             </div>
             <div className="min-w-0">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Local Seleccionado</p>
                <p className="text-sm font-black text-gray-800 uppercase leading-tight truncate">{tiendaNombre || 'S/N'}</p>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sistema</p>
                <p className="text-base font-black text-gray-700 font-mono tracking-tighter">
                  {totals.sistema.toLocaleString()}
                  <span className="text-[9px] ml-1 text-gray-300 font-sans uppercase">uds</span>
                </p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inventario</p>
                <p className="text-base font-black text-gray-700 font-mono tracking-tighter">
                  {totals.inventario.toLocaleString()}
                  <span className="text-[9px] ml-1 text-gray-300 font-sans uppercase">uds</span>
                </p>
             </div>
             <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Diferencia</p>
                <p className={`text-base font-black font-mono tracking-tighter ${totals.diferencia < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {totals.diferencia > 0 ? '+' : ''}{totals.diferencia.toLocaleString()}
                  <span className="text-[9px] ml-1 opacity-40 font-sans uppercase font-bold text-gray-400">uds</span>
                </p>
             </div>
             <div className="space-y-1 text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Valorización</p>
                <p className={`text-base font-black tracking-tighter ${totals.valor < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  {formatCurrency(totals.valor)}
                </p>
             </div>
          </div>

          <div className="pt-4 border-t border-gray-50 flex justify-between items-center opacity-60">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Datos sincronizados hoy</p>
             </div>
             <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${totals.diferencia === 0 ? 'bg-green-500' : 'bg-orange-500'}`} />
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  {totals.diferencia === 0 ? 'Cuadrado' : 'Con Diferencias'}
                </p>
             </div>
          </div>
        </div>

        {/* Widget: Resumen por Marca (Nuevo) */}
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-[400px] lg:col-span-2">
           <div className="p-6 pb-2 flex justify-between items-center">
            <div className="flex items-center gap-3">
               <h3 className="text-sm font-black uppercase tracking-widest text-gray-400">Resumen por Marca</h3>
               <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">{brandData.length} Marcas</span>
            </div>
            <TrendingDown size={18} className="text-primary opacity-20" />
          </div>
          <div className="flex-1 overflow-auto px-6 pb-6 scrollbar-hide">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {brandData.map((brand, idx) => (
                 <div key={idx} className="bg-gray-50/50 p-4 rounded-3xl border border-gray-100 flex justify-between items-center group hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 transition-all active:scale-95 cursor-pointer">
                    <div>
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Marca</p>
                       <p className="text-xs font-black text-gray-800 uppercase group-hover:text-primary transition-colors">{brand.name}</p>
                    </div>
                    <div className="text-right">
                       <p className={`text-sm font-black ${brand.value < 0 ? 'text-red-500' : 'text-green-600'}`}>
                          {formatCurrency(brand.value)}
                       </p>
                       <p className="text-[9px] font-bold text-gray-400">VALOR DIF.</p>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardIndicators;
