
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AggregatedData, AggregationType } from '../types';

export const exportToPDF = (data: AggregatedData[], month: number, year: number, type: AggregationType) => {
  const doc = new jsPDF();
  
  const titleType = type === AggregationType.CLASS ? 'THEO LỚP' : 'THEO MÔN HỌC';
  const labelHeader = type === AggregationType.CLASS ? 'Lớp' : 'Môn học';

  // Title
  doc.setFontSize(18);
  doc.text(`BÁO CÁO TỔNG HỢP SỔ BÁO GIẢNG ${titleType}`, 105, 15, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text(`Tháng: ${month} / Năm: ${year}`, 105, 25, { align: 'center' });

  const tableData = data.map(d => [d.label, d.totalPeriods]);

  autoTable(doc, {
    startY: 35,
    head: [[labelHeader, 'Tổng số tiết']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: '#1e40af' },
    styles: { font: 'helvetica', fontSize: 10 },
  });

  const fileName = `BAO_CAO_SBG_${type.toUpperCase()}_THANG_${month.toString().padStart(2, '0')}_${year}.pdf`;
  doc.save(fileName);
};
