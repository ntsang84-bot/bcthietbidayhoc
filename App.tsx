
import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Calendar, 
  Upload, 
  AlertCircle,
  BarChart3,
  Sparkles,
  Loader2,
  ChevronRight,
  LayoutGrid,
  BookOpen,
  User,
  GraduationCap,
  Download,
  Heart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { processExcelFile, exportSummaryExcel, exportDetailedExcel } from './utils/excelProcessor';
import { exportToPDF } from './utils/pdfExporter';
import { ProcessingResult, ExportFormat, AggregationType } from './types';
import { analyzeTeachingData } from './services/geminiService';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [aggType, setAggType] = useState<AggregationType>(AggregationType.CLASS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (file && result) {
      handleProcess();
    }
  }, [aggType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setAiAnalysis(null);
    setError(null);
  };

  const handleProcess = async () => {
    if (!file) {
      setError("Vui lòng chọn file Excel trước.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setAiAnalysis(null);

    try {
      const data = await processExcelFile(file, month, year, aggType);
      if (data.summary.length === 0) {
        setError(`Không tìm thấy dữ liệu cho tháng ${month}/${year}.`);
        setResult(null);
      } else {
        setResult(data);
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi khi xử lý file.");
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (format: ExportFormat) => {
    if (!result) return;
    if (format === ExportFormat.EXCEL_SUMMARY) {
      exportSummaryExcel(result);
    } else if (format === ExportFormat.EXCEL_DETAILED) {
      exportDetailedExcel(result);
    } else {
      exportToPDF(result.summary, month, year, aggType);
    }
  };

  const handleAiAnalysis = async () => {
    if (!result) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeTeachingData(result.summary, month, year, aggType);
      setAiAnalysis(analysis || "Không có kết quả phân tích.");
    } catch (err) {
      setAiAnalysis("Lỗi phân tích AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed', '#db2777', '#0891b2', '#4d7c0f', '#be185d', '#4338ca'];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8">
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
              <FileSpreadsheet className="text-white w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
                Sổ báo cáo thiết bị <span className="text-blue-600">theo tháng</span>
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-slate-500 font-medium text-sm">Công cụ tổng hợp báo cáo chuyên dụng</span>
                <span className="text-slate-300">|</span>
                <span className="text-blue-500 text-xs font-bold uppercase tracking-wider">Tác giả: Thầy Sang - THPT Mang Thít</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-3xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-2xl border border-slate-100">
              <Calendar className="text-slate-400 w-4 h-4" />
              <select 
                className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 outline-none"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
              <span className="text-slate-300">/</span>
              <input 
                type="number" 
                className="w-16 bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-700 outline-none"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
              />
            </div>

            <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button 
                onClick={() => setAggType(AggregationType.CLASS)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  aggType === AggregationType.CLASS ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Theo Lớp
              </button>
              <button 
                onClick={() => setAggType(AggregationType.SUBJECT)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  aggType === AggregationType.SUBJECT ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Theo Môn
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                   <Upload className="w-4 h-4 text-blue-600" />
                </div>
                Tải lên sổ báo giảng
              </h2>
              <div className="space-y-4">
                <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${file ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 hover:border-blue-300'}`}>
                  <input type="file" id="file-upload" className="hidden" accept=".xlsx, .xls" onChange={handleFileChange} />
                  {file ? (
                    <div className="space-y-3">
                      <FileSpreadsheet className="w-10 h-10 text-blue-600 mx-auto" />
                      <p className="font-bold text-slate-800 truncate px-2 text-sm">{file.name}</p>
                      <button onClick={clearFile} className="text-xs font-bold text-red-500 hover:underline">Thay đổi file</button>
                    </div>
                  ) : (
                    <label htmlFor="file-upload" className="cursor-pointer block group">
                      <Upload className="w-10 h-10 text-slate-400 mx-auto mb-4 group-hover:text-blue-500" />
                      <p className="font-bold text-slate-700">Chọn file từ máy tính</p>
                    </label>
                  )}
                </div>
                {error && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</div>}
                <button onClick={handleProcess} disabled={!file || isProcessing} className="w-full py-4 rounded-2xl font-bold bg-slate-900 text-white flex items-center justify-center gap-2 hover:bg-black disabled:bg-slate-100 disabled:text-slate-400 transition-all">
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Bắt đầu xử lý <ChevronRight className="w-4 h-4" /></>}
                </button>
              </div>
            </section>

            {result && (
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Dữ liệu giáo viên</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <User className="w-8 h-8 p-1.5 bg-blue-50 text-blue-600 rounded-lg" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Họ và tên giáo viên</p>
                      <p className="font-bold text-slate-700">{result.teacherName}</p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Về ứng dụng</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Phần mềm được phát triển bởi <strong>Thầy Sang (THPT Mang Thít)</strong> nhằm hỗ trợ đồng nghiệp giảm bớt áp lực hồ sơ sổ sách, tự động hóa quy trình tổng hợp thiết bị dạy học.
              </p>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-8">
            {!result ? (
              <div className="h-[400px] bg-white rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-12">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                   <BarChart3 className="w-10 h-10 text-slate-200" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Sẵn sàng phân tích</h3>
                <p className="text-slate-400 mt-2 max-w-xs text-sm">Tải file lên để hệ thống tự động lọc các tiết dạy có sử dụng thiết bị.</p>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-wrap gap-4">
                  <button onClick={() => handleDownload(ExportFormat.EXCEL_DETAILED)} className="flex-1 min-w-[200px] p-6 bg-white border-2 border-blue-600 rounded-3xl text-blue-600 flex flex-col items-center gap-3 hover:bg-blue-50 transition-all group shadow-sm">
                    <Download className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="font-black text-sm uppercase tracking-wider">Tải Sổ Thiết Bị</span>
                    <span className="text-[10px] text-blue-400 font-medium">Chỉ giữ lại các dòng có thiết bị</span>
                  </button>
                  <button onClick={() => handleDownload(ExportFormat.EXCEL_SUMMARY)} className="flex-1 min-w-[200px] p-6 bg-white border border-slate-200 rounded-3xl text-slate-600 flex flex-col items-center gap-3 hover:bg-slate-50 transition-all group">
                    <FileSpreadsheet className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    <span className="font-black text-sm uppercase tracking-wider">Tải Báo Cáo Tổng Hợp</span>
                  </button>
                </div>

                <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                  <div className="p-8 border-b border-slate-50 flex justify-between items-end">
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 uppercase">Thống kê tháng {month}/{year}</h3>
                      <p className="text-sm text-slate-400 mt-1">Dữ liệu phân tích cho: <b>{result.teacherName}</b></p>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={result.summary}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                          <Bar dataKey="totalPeriods" radius={[6, 6, 6, 6]} barSize={40}>
                            {result.summary.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[32px] text-white shadow-xl">
                  <div className="flex items-center gap-4 mb-6">
                    <Sparkles className="w-10 h-10 p-2 bg-white/10 rounded-2xl text-yellow-300" />
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight">AI Nhận Xét</h3>
                      <p className="text-white/40 text-[10px] font-bold uppercase">Trí tuệ nhân tạo Gemini</p>
                    </div>
                  </div>
                  {aiAnalysis ? (
                    <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl prose prose-invert prose-sm max-w-none text-slate-200">
                      {aiAnalysis}
                    </div>
                  ) : (
                    <button onClick={handleAiAnalysis} disabled={isAnalyzing} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
                      {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Phân tích dữ liệu'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <footer className="text-center py-10 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-t border-slate-100 mt-10 space-y-2">
        <div>Tác giả: Thầy Sang - THPT Mang Thít • Sổ báo cáo thiết bị dạy học theo tháng {new Date().getFullYear()}</div>
        <div className="text-[8px] opacity-60">Sản phẩm dành cho giáo dục Việt Nam</div>
      </footer>
    </div>
  );
};

export default App;