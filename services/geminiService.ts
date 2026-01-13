
import { GoogleGenAI } from "@google/genai";
import { AggregatedData, AggregationType } from "../types";

export const analyzeTeachingData = async (data: AggregatedData[], month: number, year: number, type: AggregationType) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const labelType = type === AggregationType.CLASS ? 'lớp' : 'môn học';
  const dataSummary = data.map(d => `${d.label}: ${d.totalPeriods} tiết`).join(', ');
  
  const prompt = `
    Dưới đây là dữ liệu tổng hợp sổ báo giảng tháng ${month}/${year}, tổng hợp theo ${labelType}. 
    Dữ liệu: ${dataSummary}
    
    Hãy phân tích ngắn gọn:
    1. Tổng số tiết dạy trong tháng.
    2. ${labelType.charAt(0).toUpperCase() + labelType.slice(1)} nào có khối lượng tiết dạy nhiều nhất?
    3. Nhận xét về sự phân bổ tiết dạy giữa các ${labelType}.
    4. Gợi ý điều chỉnh nếu có bất thường (ví dụ tiết quá ít hoặc quá nhiều so với chương trình học thông thường).
    
    Yêu cầu trả về bằng tiếng Việt, định dạng Markdown, súc tích, chuyên nghiệp.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Không thể thực hiện phân tích AI vào lúc này. Vui lòng thử lại sau.";
  }
};
