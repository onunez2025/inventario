import * as XLSX from 'xlsx';
import type { ConciliacionRecord } from '../types';

export const excelService = {
  exportInventoryReport: (data: ConciliacionRecord[], tiendaNombre: string) => {
    // 1. Prepare Summary Data (Pestaña 1)
    const categoryMap = data.reduce((acc, curr) => {
      const cat = curr.categoria || 'OTROS';
      acc[cat] = (acc[cat] || 0) + (curr.diferencia_valorizada || 0);
      return acc;
    }, {} as Record<string, number>);

    const brandMap = data.reduce((acc, curr) => {
      const brand = curr.marca || 'OTROS';
      acc[brand] = (acc[brand] || 0) + (curr.diferencia_valorizada || 0);
      return acc;
    }, {} as Record<string, number>);

    const statusSummary = {
      Faltante: { skus: 0, valor: 0 },
      Sobrante: { skus: 0, valor: 0 },
      Cuadrado: { skus: 0, valor: 0 }
    };

    const totals = data.reduce((acc, curr) => {
      if (curr.diferencia_unidades < 0) {
        statusSummary.Faltante.skus++;
        statusSummary.Faltante.valor += (curr.diferencia_valorizada || 0);
      } else if (curr.diferencia_unidades > 0) {
        statusSummary.Sobrante.skus++;
        statusSummary.Sobrante.valor += (curr.diferencia_valorizada || 0);
      } else {
        statusSummary.Cuadrado.skus++;
        statusSummary.Cuadrado.valor += (curr.diferencia_valorizada || 0);
      }

      return {
        sistema: acc.sistema + (curr.stock_sistema || 0),
        inventario: acc.inventario + (curr.cantidad_fisica || 0),
        diferencia: acc.diferencia + (curr.diferencia_unidades || 0),
        valor: acc.valor + (curr.diferencia_valorizada || 0)
      };
    }, { sistema: 0, inventario: 0, diferencia: 0, valor: 0 });

    // Prepare Summary Rows
    const summaryRows: any[] = [
      ['RESUMEN DE INDICADORES - INVENTARIO'],
      ['TIENDA:', tiendaNombre],
      ['FECHA:', new Date().toLocaleDateString()],
      [],
      ['TOTALES GENERALES'],
      ['Stock Sistema', totals.sistema],
      ['Stock Inventario', totals.inventario],
      ['Diferencia Unidades', totals.diferencia],
      ['Valorización Diferencia', totals.valor],
      [],
      ['RESUMEN POR ESTADO'],
      ['Estado', 'SKUs', 'Valor Diferencia'],
      ['Faltante', statusSummary.Faltante.skus, statusSummary.Faltante.valor],
      ['Sobrante', statusSummary.Sobrante.skus, statusSummary.Sobrante.valor],
      ['Cuadrado', statusSummary.Cuadrado.skus, statusSummary.Cuadrado.valor],
      [],
      ['RESUMEN POR CATEGORÍA'],
      ['Categoría', 'Valor Diferencia'],
      ...Object.entries(categoryMap).map(([name, value]) => [name, value]),
      [],
      ['RESUMEN POR MARCA'],
      ['Marca', 'Valor Diferencia'],
      ...Object.entries(brandMap).map(([name, value]) => [name, value])
    ];

    // 2. Prepare Detail Data (Pestaña 2)
    const detailRows = data.map(r => {
      let status = 'Cuadra';
      if (r.diferencia_unidades < 0) status = 'Faltante';
      else if (r.diferencia_unidades > 0) status = 'Sobrante';

      return {
        'Número de Artículo': r.sku,
        'Descripción': r.articulo_nombre,
        'Marca': r.marca || 'S/N',
        'Categoría': r.categoria || 'S/N',
        'Valor x Und': r.costo_unitario,
        'Stock Sistema': r.stock_sistema,
        'Stock Inventario': r.cantidad_fisica,
        'Diferencia': r.diferencia_unidades,
        'Valor x Diferencia': r.diferencia_valorizada,
        'Absoluto': Math.abs(r.diferencia_valorizada),
        'Estado': status,
        'Observación': r.ultima_observacion || ''
      };
    });

    // Create workbook and worksheets
    const wb = XLSX.utils.book_new();
    
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
    const wsDetail = XLSX.utils.json_to_sheet(detailRows);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Indicadores');
    XLSX.utils.book_append_sheet(wb, wsDetail, 'Detalle Diferencias');

    // Save File
    XLSX.writeFile(wb, `Reporte_Inventario_${tiendaNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
};
