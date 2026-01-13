
import * as XLSX from 'xlsx';
import { RawRow, AggregatedData, ProcessingResult, AggregationType } from '../types';

/**
 * Hàm hỗ trợ trích xuất ngày từ một chuỗi hoặc giá trị bất kỳ
 */
const parseFlexibleDate = (value: any): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  
  if (typeof value === 'number') {
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    return isNaN(date.getTime()) ? null : date;
  }

  const str = String(value).trim();
  const dmyRegex = /(\d{1,2})[/-](\d{1,2})[/-](\d{4})/;
  const match = str.match(dmyRegex);
  if (match) {
    return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
  }
  return null;
};

const normalizeClassName = (className: any): string => {
  if (!className) return "N/A";
  return String(className).split('-')[0].trim();
};

/**
 * Trích xuất thông tin Header dựa trên mẫu ảnh (Dòng 2: GV, Dòng 3: Tuần/Ngày)
 * Bỏ qua ô H2 (index 7 dòng 2) và H3 (index 7 dòng 3)
 */
const extractHeaderInfo = (sheet: XLSX.WorkSheet): { teacher: string, week: string, startDate: Date | null } => {
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  let teacher = "Chưa xác định";
  let week = "";
  let startDate: Date | null = null;

  // Dòng 2 (Index 1) - Bỏ qua cột H (Index 7)
  const row2 = rows[1] || [];
  const filteredRow2 = row2.filter((_, idx) => idx !== 7);
  const row2Str = filteredRow2.join(' ');
  const teacherMatch = row2Str.match(/(?:GIÁO VIÊN|Họ và tên giáo viên)[:\s]+([^;,\n|]+)/i);
  if (teacherMatch) teacher = teacherMatch[1].trim();

  // Dòng 3 (Index 2) - Bỏ qua cột H (Index 7)
  const row3 = rows[2] || [];
  row3.forEach((cell, idx) => {
    if (idx === 7) return; // Bỏ qua ô H3
    const val = String(cell);
    if (val.toLowerCase().includes('tuần')) {
        const match = val.match(/\d+/);
        if (match) week = match[0];
    }
    const d = parseFlexibleDate(cell);
    if (d && !startDate) startDate = d;
  });

  return { teacher, week, startDate };
};

export const processExcelFile = async (
  file: File,
  month: number,
  year: number,
  type: AggregationType = AggregationType.CLASS
): Promise<ProcessingResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        let allData: RawRow[] = [];
        let finalTeacher = "Chưa xác định";
        let finalSubject = "Chưa xác định";

        const sheetNames = workbook.SheetNames.slice(1);

        sheetNames.forEach(name => {
          const sheet = workbook.Sheets[name];
          const info = extractHeaderInfo(sheet);
          if (info.teacher !== "Chưa xác định") finalTeacher = info.teacher;

          const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
          let currentRunningDate: Date | null = info.startDate;
          
          // GIỚI HẠN: Chỉ quét đến tối đa dòng 82 (Index 81).
          // Bỏ qua dòng số 5 (Index 4) -> Bắt đầu từ dòng 6 (Index 5).
          const maxRowIndex = Math.min(rows.length, 82);
          
          for (let i = 5; i < maxRowIndex; i++) {
            const row = rows[i];
            if (!row || row.length === 0) continue;

            const colA = String(row[0] || "").trim();
            const colB = String(row[1] || "").trim(); // Tiết (Cột B)
            const colD = String(row[3] || "").trim(); // Lớp (Cột D)
            const colF = String(row[5] || "").trim(); // Tên bài dạy (Cột F)
            const colH = String(row[7] || "").trim(); // Tên thiết bị (Cột H)

            // Kiểm tra hàng Marker Ngày
            const dateInRow = parseFlexibleDate(colA);
            if (dateInRow) {
              currentRunningDate = dateInRow;
              continue;
            }

            // Bỏ qua các dòng rác như "Tiến độ", "Kịp tiến độ", "Trước tiến độ"
            const trashKeywords = ["tiến độ", "kịp tiến độ", "trước tiến độ", "tên bài"];
            if (trashKeywords.some(k => colF.toLowerCase().includes(k))) continue;

            if (currentRunningDate && colD && colF) {
              allData.push({
                "Ngày dạy": new Date(currentRunningDate),
                "Tuần": info.week || name.match(/\d+/)?.[0] || "",
                "Tiết (ppct)": colB,
                "Tên bài dạy": colF,
                "Thiết bị": colH,
                "UDCNTT": colH.toLowerCase().includes('laptop') || colH.toLowerCase().includes('màn hình') ? 'x' : '',
                "DDTuLam": "",
                "TNTH": "",
                "Số lượng": "1",
                "Lớp": colD,
                "Ngày trả": new Date(currentRunningDate).toLocaleDateString('en-CA'),
                "Tình trạng": "Tốt",
                "Môn": finalSubject,
                "Giáo viên": finalTeacher,
                "Số tiết": 1
              });
            }
          }
        });

        allData.sort((a, b) => a["Ngày dạy"].getTime() - b["Ngày dạy"].getTime());

        const filtered = allData.filter(d => {
          const dt = d["Ngày dạy"];
          return (dt.getMonth() + 1 === month && dt.getFullYear() === year);
        });

        const map = new Map<string, number>();
        filtered.forEach(row => {
          const label = type === AggregationType.CLASS ? normalizeClassName(row["Lớp"]) : row["Môn"];
          map.set(label, (map.get(label) || 0) + 1);
        });

        const summary: AggregatedData[] = Array.from(map.entries())
          .map(([label, total]) => ({ label, totalPeriods: total }))
          .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));

        resolve({
          summary,
          details: filtered,
          month,
          year,
          type,
          teacherName: finalTeacher,
          subjectName: finalSubject
        });

      } catch (err) {
        console.error(err);
        reject(new Error("Lỗi cấu trúc Excel."));
      }
    };
    reader.readAsArrayBuffer(file);
  });
};

export const exportDetailedExcel = (result: ProcessingResult) => {
  const { details, month, year, teacherName, subjectName } = result;
  
  // Lọc nghiêm ngặt: Chỉ giữ lại các dòng có nội dung thiết bị
  const filteredDetails = details.filter(d => d["Thiết bị"] && d["Thiết bị"].trim() !== "");

  const header = [
    ["SỔ QUẢN LÝ SỬ DỤNG TBDH, CNTT"],
    [`Họ và tên giáo viên: ${teacherName}`, "", "", "", "", "", "", "", "", "", `Môn dạy: ${subjectName}`],
    [""],
    [
      "Ngày mượn", "Tuần", "Tiết (ppct)", "Tên bài dạy", 
      "Tên thiết bị sử dụng", "UDCNTT", "ĐD TỰ LÀM", "TN-TH", 
      "Số lượng", "Dạy lớp", "Ngày trả", "Tình trạng thiết bị khi trả", "Chữ ký giáo viên"
    ]
  ];

  const dataRows = filteredDetails.map(d => [
    d["Ngày dạy"].toLocaleDateString('en-CA'),
    d["Tuần"],
    d["Tiết (ppct)"],
    d["Tên bài dạy"],
    d["Thiết bị"],
    d["UDCNTT"],
    "", "", "1",
    d["Lớp"],
    d["Ngày trả"],
    d["Tình trạng"],
    ""
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([...header, ...dataRows]);
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 8 }, { wch: 12 }, { wch: 45 }, 
    { wch: 35 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, 
    { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 15 }
  ];
  worksheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 4 } },
    { s: { r: 1, c: 10 }, e: { r: 1, c: 12 } }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "So_Chi_Tiet");
  const safeName = teacherName.replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  XLSX.writeFile(workbook, `SO_THIET_BI_${safeName}_T${month}_${year}.xlsx`);
};

export const exportSummaryExcel = (result: ProcessingResult) => {
  const { summary, month, year, type, teacherName, subjectName } = result;
  const rows = [
    [`BÁO CÁO TỔNG HỢP TIẾT DẠY - THÁNG ${month}/${year}`],
    [`Giáo viên: ${teacherName} | Môn dạy: ${subjectName}`],
    [""],
    [type === AggregationType.CLASS ? "Lớp" : "Môn học", "Tổng số tiết", "Ghi chú"]
  ];
  summary.forEach(item => rows.push([item.label, item.totalPeriods.toString(), ""]));
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Tong_Hop");
  const safeName = teacherName.replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  XLSX.writeFile(workbook, `SBG_TONGHOP_${safeName}_T${month}_${year}.xlsx`);
};
