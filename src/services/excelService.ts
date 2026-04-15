import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ConciliacionRecord } from '../types';

export const excelService = {
  exportInventoryReport: async (data: ConciliacionRecord[], tiendaNombre: string) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Invent-IA';
    workbook.lastModifiedBy = 'Invent-IA';
    workbook.created = new Date();
    
    // 1. Calculations
    const categoryMap = data.reduce((acc, curr) => {
      const cat = curr.categoria || 'OTROS';
      const valor = Number(curr.diferencia_valorizada || 0);
      acc[cat] = (acc[cat] || 0) + valor;
      return acc;
    }, {} as Record<string, number>);

    const totals = data.reduce((acc, curr) => {
      const dif = Number(curr.diferencia_unidades || 0);
      const val = Number(curr.diferencia_valorizada || 0);
      return {
        sistema: acc.sistema + Number(curr.stock_sistema || 0),
        inventario: acc.inventario + Number(curr.cantidad_fisica || 0),
        diferencia: acc.diferencia + dif,
        valor: acc.valor + val
      };
    }, { sistema: 0, inventario: 0, diferencia: 0, valor: 0 });

    // ---------------------------------------------------------
    // SHEET 1: RESUMEN EJECUTIVO
    // ---------------------------------------------------------
    const wsSummary = workbook.addWorksheet('Resumen Ejecutivo', {
      views: [{ showGridLines: false }]
    });

    // Column Widths
    wsSummary.getColumn('A').width = 4;
    wsSummary.getColumn('B').width = 25;
    wsSummary.getColumn('C').width = 20;
    wsSummary.getColumn('D').width = 20;
    wsSummary.getColumn('E').width = 20;

    // Title
    const titleCell = wsSummary.getCell('B2');
    titleCell.value = 'INFORME DE AUDITORÍA DE INVENTARIO';
    titleCell.font = { name: 'Arial Black', size: 18, color: { argb: 'FF1E3A8A' } };
    wsSummary.mergeCells('B2:E2');

    // Store Info
    wsSummary.getCell('B4').value = 'TIENDA:';
    wsSummary.getCell('B4').font = { bold: true };
    wsSummary.getCell('C4').value = tiendaNombre.toUpperCase();
    
    wsSummary.getCell('B5').value = 'FECHA REPORTE:';
    wsSummary.getCell('B5').font = { bold: true };
    wsSummary.getCell('C5').value = new Date().toLocaleDateString();

    // KPI Section Container
    const kpiHeader = wsSummary.getCell('B7');
    kpiHeader.value = 'INDICADORES PRINCIPALES';
    kpiHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    wsSummary.mergeCells('B7:E7');

    const kpiData = [
      ['Stock en Sistema', totals.sistema, 'uds'],
      ['Stock Físico (Auditor)', totals.inventario, 'uds'],
      ['Diferencia Neta', totals.diferencia, 'uds'],
      ['Valorización Total Diferencia', totals.valor, 'PEN']
    ];

    kpiData.forEach((row, i) => {
      const rowIndex = 8 + i;
      const label = wsSummary.getCell(`B${rowIndex}`);
      const val = wsSummary.getCell(`C${rowIndex}`);
      
      label.value = row[0];
      label.font = { bold: true };
      label.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
      
      val.value = row[1];
      if (row[2] === 'PEN') val.numFmt = '"S/ " #,##0.00;[Red]"-S/ " #,##0.00';
      else val.numFmt = '#,##0';
      val.font = { bold: true, color: { argb: Number(row[1]) < 0 ? 'FFEF4444' : 'FF065F46' } };
      val.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
    });

    // Summary Tables - Category
    const catStart = 14;
    wsSummary.getCell(`B${catStart}`).value = 'RESUMEN POR GRUPO DE ARTÍCULO';
    wsSummary.getCell(`B${catStart}`).font = { bold: true, color: { argb: 'FF1E3A8A' } };
    
    wsSummary.getRow(catStart + 1).values = ['', 'Categoría', 'Valorización Dif.'];
    const tableHeader = wsSummary.getRow(catStart + 1);
    tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    ['B', 'C'].forEach(col => {
      const cell = wsSummary.getCell(`${col}${catStart + 1}`);
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF64748B' } };
      cell.alignment = { horizontal: 'center' };
    });

    let currentIdx = catStart + 2;
    Object.entries(categoryMap).sort((a, b) => a[1] - b[1]).forEach(([cat, val]) => {
      const row = wsSummary.getRow(currentIdx);
      row.getCell(2).value = cat.toUpperCase();
      const valCell = row.getCell(3);
      valCell.value = val;
      valCell.numFmt = '"S/ " #,##0.00;[Red]"-S/ " #,##0.00';
      valCell.font = { color: { argb: val < 0 ? 'FFEF4444' : 'FF065F46' } };
      
      // Zebra striping
      if (currentIdx % 2 === 0) {
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
        row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
      }
      currentIdx++;
    });

    // ---------------------------------------------------------
    // SHEET 2: DETALLE DE DIFERENCIAS
    // ---------------------------------------------------------
    const wsDetail = workbook.addWorksheet('Detalle de Diferencias');
    wsDetail.columns = [
      { header: 'Estatus', key: 'status', width: 12 },
      { header: 'SKU', key: 'sku', width: 18 },
      { header: 'Nombre del Artículo', key: 'nombre', width: 45 },
      { header: 'Marca', key: 'marca', width: 15 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Costo Unit.', key: 'costo', width: 12 },
      { header: 'Stock Sis.', key: 'sistema', width: 12 },
      { header: 'Físico', key: 'fisico', width: 12 },
      { header: 'Diferencia', key: 'dif', width: 12 },
      { header: 'Valor Dif.', key: 'valor', width: 15 },
      { header: 'Observación', key: 'obs', width: 30 },
    ];

    // Style Header Detail
    wsDetail.getRow(1).height = 25;
    wsDetail.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsDetail.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    wsDetail.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    });

    // Add Data
    data.forEach(r => {
      const dif = Number(r.diferencia_unidades);
      let status = 'CUADRADO';
      if (dif < 0) status = 'FALTANTE';
      else if (dif > 0) status = 'SOBRANTE';

      const row = wsDetail.addRow({
        status,
        sku: r.sku,
        nombre: r.articulo_nombre.toUpperCase(),
        marca: (r.marca || 'S/N').toUpperCase(),
        categoria: (r.categoria || 'S/N').toUpperCase(),
        costo: Number(r.costo_unitario),
        sistema: Number(r.stock_sistema),
        fisico: Number(r.cantidad_fisica),
        dif: dif,
        valor: Number(r.diferencia_valorizada),
        obs: r.ultima_observacion || ''
      });

      // Conditional Formatting logic
      const statusCell = row.getCell(1);
      if (status === 'FALTANTE') statusCell.font = { color: { argb: 'FF991B1B' }, bold: true };
      else if (status === 'SOBRANTE') statusCell.font = { color: { argb: 'FF065F46' }, bold: true };
      else statusCell.font = { color: { argb: 'FF6B7280' } };

      row.getCell(6).numFmt = '"S/ " #,##0.00';
      row.getCell(10).numFmt = '"S/ " #,##0.00;[Red]"-S/ " #,##0.00';
      
      const difCell = row.getCell(9);
      if (dif !== 0) {
        difCell.font = { bold: true, color: { argb: dif < 0 ? 'FFEF4444' : 'FF10B981' } };
      }
    });

    // Final touches for detail sheet
    wsDetail.autoFilter = 'A1:K1';
    wsDetail.views = [{ state: 'frozen', ySplit: 1 }];

    // 3. Generate and Save
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_Inventario_${tiendaNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  }
};
