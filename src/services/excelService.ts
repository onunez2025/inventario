import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ConciliacionRecord } from '../types';

export const excelService = {
  private_generateWorkbook: async (data: ConciliacionRecord[], tiendaNombre: string) => {
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

    const brandMap = data.reduce((acc, curr) => {
      const brand = curr.marca || 'OTROS';
      const valor = Number(curr.diferencia_valorizada || 0);
      acc[brand] = (acc[brand] || 0) + valor;
      return acc;
    }, {} as Record<string, number>);

    const typeMap = data.reduce((acc, curr) => {
      const type = curr.tipo || 'PRODUCTO';
      const valor = Number(curr.diferencia_valorizada || 0);
      acc[type] = (acc[type] || 0) + valor;
      return acc;
    }, {} as Record<string, number>);

    const statusSummary = {
      Faltante: { skus: 0, valor: 0 },
      Sobrante: { skus: 0, valor: 0 },
      Cuadrado: { skus: 0, valor: 0 }
    };

    const totals = data.reduce((acc, curr) => {
      const dif = Number(curr.diferencia_unidades || 0);
      const val = Number(curr.diferencia_valorizada || 0);

      if (dif < 0) {
        statusSummary.Faltante.skus++;
        statusSummary.Faltante.valor += val;
      } else if (dif > 0) {
        statusSummary.Sobrante.skus++;
        statusSummary.Sobrante.valor += val;
      } else {
        statusSummary.Cuadrado.skus++;
        statusSummary.Cuadrado.valor += val;
      }

      return {
        sistema: acc.sistema + Number(curr.stock_sistema || 0),
        inventario: acc.inventario + Number(curr.cantidad_fisica || 0),
        diferencia: acc.diferencia + dif,
        valor: acc.valor + val
      };
    }, { sistema: 0, inventario: 0, diferencia: 0, valor: 0 });

    // SHEET 1: RESUMEN EJECUTIVO
    const wsSummary = workbook.addWorksheet('Resumen Ejecutivo', {
      views: [{ showGridLines: false }]
    });

    wsSummary.getColumn('A').width = 4;
    wsSummary.getColumn('B').width = 30;
    wsSummary.getColumn('C').width = 20;
    wsSummary.getColumn('D').width = 20;
    wsSummary.getColumn('E').width = 20;

    const applyTableHeader = (cellRange: string, bgColor: string = 'FF64748B') => {
      const [start, end] = cellRange.split(':');
      const startCol = start[0];
      const endCol = end[0];
      const row = parseInt(start.substring(1));
      for (let i = startCol.charCodeAt(0); i <= endCol.charCodeAt(0); i++) {
        const cell = wsSummary.getCell(`${String.fromCharCode(i)}${row}`);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center' };
      }
    };

    const titleCell = wsSummary.getCell('B2');
    titleCell.value = 'INFORME DE AUDITORÍA DE INVENTARIO';
    titleCell.font = { name: 'Arial Black', size: 18, color: { argb: 'FF1E3A8A' } };
    wsSummary.mergeCells('B2:E2');

    wsSummary.getCell('B4').value = 'TIENDA:';
    wsSummary.getCell('B4').font = { bold: true };
    wsSummary.getCell('C4').value = tiendaNombre.toUpperCase();
    
    wsSummary.getCell('B5').value = 'FECHA REPORTE:';
    wsSummary.getCell('B5').font = { bold: true };
    wsSummary.getCell('C5').value = new Date().toLocaleDateString();

    const kpiHeader = wsSummary.getCell('B7');
    kpiHeader.value = 'INDICADORES PRINCIPALES';
    kpiHeader.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    kpiHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    wsSummary.mergeCells('B7:E7');

    const kpiData = [
      ['Stock en Sistema', totals.sistema, 'uds'],
      ['Stock Físico (Auditor)', totals.inventario, 'uds'],
      ['Diferencia Total', totals.sistema - totals.inventario, 'uds'],
      ['Valorización Total Diferencia', totals.valor, 'PEN']
    ];

    kpiData.forEach((row, kpiIdx) => {
      const rowIndex = 8 + kpiIdx;
      const label = wsSummary.getCell(`B${rowIndex}`);
      const val = wsSummary.getCell(`C${rowIndex}`);
      label.value = row[0];
      label.font = { bold: true };
      val.value = row[1];
      if (row[2] === 'PEN') val.numFmt = '"S/ " #,##0.00;[Red]"-S/ " #,##0.00';
      else val.numFmt = '#,##0';
      val.font = { bold: true, color: { argb: Number(row[1]) < 0 ? 'FFEF4444' : 'FF065F46' } };
    });

    const statusStart = 14;
    wsSummary.getCell(`B${statusStart}`).value = 'RESUMEN POR ESTADO DE SKU';
    wsSummary.getCell(`B${statusStart}`).font = { bold: true, color: { argb: 'FF1E3A8A' } };
    wsSummary.getRow(statusStart + 1).values = ['', 'Estado', 'Cantidad SKUs', 'Valorización'];
    applyTableHeader(`B${statusStart + 1}:D${statusStart + 1}`, 'FF1E3A8A');

    const statuses = [
      ['Faltante', statusSummary.Faltante.skus, statusSummary.Faltante.valor],
      ['Sobrante', statusSummary.Sobrante.skus, statusSummary.Sobrante.valor],
      ['Cuadrado', statusSummary.Cuadrado.skus, statusSummary.Cuadrado.valor]
    ];

    statuses.forEach((st, i) => {
      const rowIndex = statusStart + 2 + i;
      const row = wsSummary.getRow(rowIndex);
      row.getCell(2).value = st[0];
      row.getCell(3).value = st[1];
      const vCell = row.getCell(4);
      vCell.value = st[2];
      vCell.numFmt = '"S/ " #,##0.00;[Red]"-S/ " #,##0.00';
      vCell.font = { color: { argb: Number(st[2]) < 0 ? 'FFEF4444' : 'FF065F46' } };
    });

    const typeStart = 22;
    wsSummary.getCell(`B${typeStart}`).value = 'RESUMEN POR TIPO DE ARTÍCULO';
    wsSummary.getCell(`B${typeStart}`).font = { bold: true, color: { argb: 'FF1E3A8A' } };
    wsSummary.getRow(typeStart + 1).values = ['', 'Tipo', 'Valorización Dif.'];
    applyTableHeader(`B${typeStart + 1}:C${typeStart + 1}`, 'FF1E3A8A');

    Object.entries(typeMap).forEach(([name, value], i) => {
      const rowIndex = typeStart + 2 + i;
      const row = wsSummary.getRow(rowIndex);
      row.getCell(2).value = name.toUpperCase();
      const vCell = row.getCell(3);
      vCell.value = value;
      vCell.numFmt = '"S/ " #,##0.00;[Red]"-S/ " #,##0.00';
      vCell.font = { color: { argb: value < 0 ? 'FFEF4444' : 'FF065F46' } };
    });

    let currentIdx = typeStart + 2 + Object.keys(typeMap).length + 2;
    // (Categorization logic...)

    // SHEET 2: DETALLE DE DIFERENCIAS
    const wsDetail = workbook.addWorksheet('Detalle de Diferencias');
    wsDetail.columns = [
      { header: 'Estatus', key: 'status', width: 12 },
      { header: 'SKU', key: 'sku', width: 18 },
      { header: 'Nombre del Artículo', key: 'nombre', width: 45 },
      { header: 'Marca', key: 'marca', width: 15 },
      { header: 'Tipo', key: 'tipo', width: 15 },
      { header: 'Categoría', key: 'categoria', width: 20 },
      { header: 'Costo Unit.', key: 'costo', width: 12 },
      { header: 'Stock Sis.', key: 'sistema', width: 12 },
      { header: 'Físico', key: 'fisico', width: 12 },
      { header: 'Diferencia', key: 'dif', width: 12 },
      { header: 'Valor Dif.', key: 'valor', width: 15 },
      { header: 'Observación', key: 'obs', width: 30 },
    ];

    wsDetail.getRow(1).height = 25;
    wsDetail.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsDetail.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    wsDetail.getRow(1).eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
    });

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
        tipo: (r.tipo || 'PRODUCTO').toUpperCase(),
        categoria: (r.categoria || 'S/N').toUpperCase(),
        costo: Number(r.costo_unitario),
        sistema: Number(r.stock_sistema),
        fisico: Number(r.cantidad_fisica),
        dif: dif,
        valor: Number(r.diferencia_valorizada),
        obs: r.ultima_observacion || ''
      });

      const statusCell = row.getCell(1);
      if (status === 'FALTANTE') statusCell.font = { color: { argb: 'FF991B1B' }, bold: true };
      else if (status === 'SOBRANTE') statusCell.font = { color: { argb: 'FF065F46' }, bold: true };
      
      row.getCell(6).numFmt = '"S/ " #,##0.00';
      row.getCell(10).numFmt = '"S/ " #,##0.00;[Red]"-S/ " #,##0.00';
    });

    return workbook;
  },

  exportInventoryReport: async (data: ConciliacionRecord[], tiendaNombre: string) => {
    // @ts-ignore
    const workbook = await excelService.private_generateWorkbook(data, tiendaNombre);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Reporte_Inventario_${tiendaNombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  },

  getInventoryReportBase64: async (data: ConciliacionRecord[], tiendaNombre: string) => {
    // @ts-ignore
    const workbook = await excelService.private_generateWorkbook(data, tiendaNombre);
    const buffer = await workbook.xlsx.writeBuffer();
    // Use an alternative to btoa for large buffers in modern browsers if needed, 
    // but for simple strings it works. For binary, we use Uint8Array + reduce.
    const uint8Array = new Uint8Array(buffer as ArrayBuffer);
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return window.btoa(binary);
  }
};
