import * as jspdf from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ConciliacionRecord, Inventario } from '../types';

export const pdfService = {
  async generateInventorySummary(
    inventory: Inventario,
    data: ConciliacionRecord[],
    signatures: { manager: string; supervisor: string }
  ) {
    // Ultra-defensive way to get the constructors
    let JsPDFConstructor = (jspdf as any).jsPDF || (jspdf as any).default || jspdf;
    if (typeof JsPDFConstructor !== 'function' && (JsPDFConstructor as any).default) {
      JsPDFConstructor = (JsPDFConstructor as any).default;
    }
    
    const doc = new (JsPDFConstructor as any)();
    
    let applyAutoTable = (autoTable as any).default || autoTable;
    if (typeof applyAutoTable !== 'function' && (applyAutoTable as any).default) {
      applyAutoTable = (applyAutoTable as any).default;
    }
    
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header
    doc.setFontSize(22);
    doc.setTextColor(0, 49, 120); // Primary color
    doc.text('RESUMEN DE INVENTARIO', pageWidth / 2, 20, { align: 'center' });

    // Inventory Info
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Tienda: ${inventory.tienda_nombre}`, 20, 35);
    doc.text(`Fecha Inicio: ${new Date(inventory.fecha_inicio).toLocaleString()}`, 20, 42);
    doc.text(`Fecha Cierre: ${new Date().toLocaleString()}`, 20, 49);
    doc.text(`ID de Sesión: ${inventory.id}`, 20, 56);

    // Summary Stats
    const totalItems = data.length;
    const itemsCounted = data.filter(d => Number(d.cantidad_fisica) > 0).length;
    const discrepancyItems = data.filter(d => Number(d.stock_sistema) !== Number(d.cantidad_fisica)).length;

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Estadísticas Generales', 20, 70);
    
    // @ts-ignore
    applyAutoTable(doc, {
      startY: 75,
      head: [['Concepto', 'Valor']],
      body: [
        ['Total Productos en Maestro', totalItems],
        ['Productos Auditados', itemsCounted],
        ['Productos con Discrepancia', discrepancyItems],
        ['Porcentaje de Avance', `${((itemsCounted / totalItems) * 100).toFixed(2)}%`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [200, 200, 200], textColor: 0 }
    });

    // Signatures Section
    const currentY = (doc as any).lastAutoTable.finalY + 30;
    
    doc.text('Firmas de Conformidad', 20, currentY);
    
    if (signatures.manager) {
      doc.addImage(signatures.manager, 'PNG', 20, currentY + 5, 60, 30);
      doc.line(20, currentY + 35, 80, currentY + 35);
      doc.setFontSize(10);
      doc.text('Encargado de Tienda', 20, currentY + 40);
    }

    if (signatures.supervisor) {
      doc.addImage(signatures.supervisor, 'PNG', 120, currentY + 5, 60, 30);
      doc.line(120, currentY + 35, 180, currentY + 35);
      doc.setFontSize(10);
      doc.text('Supervisor de Inventario', 120, currentY + 40);
    }

    // Return the blob for sending via email
    return doc.output('blob');
  }
};
