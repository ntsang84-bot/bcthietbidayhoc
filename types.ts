
export interface RawRow {
  "Ngày dạy": Date;
  "Tuần": string;
  "Tiết (ppct)": string;
  "Tên bài dạy": string;
  "Thiết bị": string;
  "UDCNTT": string;
  "DDTuLam": string;
  "TNTH": string;
  "Số lượng": string;
  "Lớp": string;
  "Ngày trả": string;
  "Tình trạng": string;
  "Môn": string;
  "Giáo viên": string;
  "Số tiết": number; // Trường ảo tính toán để thống kê
}

export interface AggregatedData {
  label: string; 
  totalPeriods: number;
}

export enum AggregationType {
  CLASS = 'class',
  SUBJECT = 'subject'
}

export interface ProcessingResult {
  summary: AggregatedData[];
  details: RawRow[];
  month: number;
  year: number;
  type: AggregationType;
  teacherName: string;
  subjectName: string;
}

export enum ExportFormat {
  EXCEL_SUMMARY = 'excel_summary',
  EXCEL_DETAILED = 'excel_detailed',
  PDF = 'pdf'
}
