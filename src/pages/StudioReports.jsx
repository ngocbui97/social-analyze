import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import Topbar from '../components/Topbar';
import { 
  Upload, FileSpreadsheet, BarChart2, PieChart as PieChartIcon, 
  Settings, Wand2, RefreshCw, AlertCircle, MessageSquare, 
  Send, User, Bot, Trash2, ArrowRight, TrendingUp, Info
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, 
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { useTracker } from '../hooks/useTracker';
import { analyzeExportedData, chatWithExportedData } from '../services/ai';

const COLORS = ['#4f7dff', '#ff3b5c', '#22d3a5', '#f5c542', '#a05bff', '#ff8b4f', '#00b7ff', '#e042d8'];

export default function StudioReports() {
  useTracker('Studio Reports');
  
  const [data, setData] = useState([]);
  const [fileName, setFileName] = useState('');
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  
  const [aiInsight, setAiInsight] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  
  // AI Chat States
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const chatEndRef = useRef(null);

  // Persistence: Load on mount
  useEffect(() => {
    const savedData = localStorage.getItem('studio_report_data');
    const savedFileName = localStorage.getItem('studio_report_filename');
    const savedChat = localStorage.getItem('studio_report_chat');
    
    if (savedData) setData(JSON.parse(savedData));
    if (savedFileName) setFileName(savedFileName);
    if (savedChat) setChatHistory(JSON.parse(savedChat));
  }, []);

  // Persistence: Save on change
  useEffect(() => {
    if (data.length > 0) {
      localStorage.setItem('studio_report_data', JSON.stringify(data));
      localStorage.setItem('studio_report_filename', fileName);
    }
  }, [data, fileName]);

  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem('studio_report_chat', JSON.stringify(chatHistory));
    }
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const clearData = () => {
    setData([]);
    setFileName('');
    setChatHistory([]);
    localStorage.removeItem('studio_report_data');
    localStorage.removeItem('studio_report_filename');
    localStorage.removeItem('studio_report_chat');
  };
   const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setParsing(true);
    setError('');
    setAiInsight('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // Convert to JSON with first row as headers
        const rawData = XLSX.utils.sheet_to_json(ws);
        
        if (rawData.length === 0) {
          throw new Error("Tệp không có dữ liệu!");
        }

        // Header mapping helper
        const findKey = (row, keywords) => {
          const keys = Object.keys(row);
          return keys.find(k => keywords.some(kw => k.toLowerCase().includes(kw.toLowerCase())));
        };

        const firstRow = rawData[0];
        const keyMap = {
          id: findKey(firstRow, ['Nội dung', 'Content', 'Video ID']),
          title: findKey(firstRow, ['Tiêu đề', 'Title']),
          views: findKey(firstRow, ['Số lượt xem', 'Views']),
          watchTime: findKey(firstRow, ['Thời gian xem', 'Watch time']),
          ctr: findKey(firstRow, ['Tỷ lệ nhấp', 'CTR', 'Click-through rate']),
          retention: findKey(firstRow, ['Ở lại xem', 'Retention', 'Average percentage viewed']),
          newViewers: findKey(firstRow, ['Người xem mới', 'New viewers']),
          returningViewers: findKey(firstRow, ['Người xem cũ', 'Returning viewers']),
          subscribers: findKey(firstRow, ['Người đăng ký', 'Subscribers', 'Subs']),
          impressions: findKey(firstRow, ['Lượt hiển thị', 'Impressions'])
        };

        const parsed = rawData
          .filter(row => {
            const idVal = row[keyMap.id] || '';
            const titleVal = row[keyMap.title] || '';
            return idVal && idVal !== 'Tổng' && idVal !== 'Total' && titleVal;
          })
          .map(row => {
            const item = { ...row }; // Keep original data for dynamic table
            item.id = row[keyMap.id];
            item.title = row[keyMap.title];
            item.views = Number(row[keyMap.views] || 0);
            item.watchTime = Number(row[keyMap.watchTime] || 0);
            item.ctr = Number(row[keyMap.ctr] || 0);
            item.retention = Number(row[keyMap.retention] || 0);
            item.newViewers = Number(row[keyMap.newViewers] || 0);
            item.returningViewers = Number(row[keyMap.returningViewers] || 0);
            item.subscribers = Number(row[keyMap.subscribers] || 0);
            item.impressions = Number(row[keyMap.impressions] || 0);
            return item;
          })
          .sort((a, b) => b.views - a.views);

        if (parsed.length === 0) {
          throw new Error("Không thể nhận diện các cột dữ liệu quan trọng. Vui lòng kiểm tra lại định dạng file.");
        }

        setData(parsed);
      } catch (err) {
        setError(err.message || 'Lỗi đọc file. Vui lòng thử file .xlsx hoặc .csv khác.');
        setData([]);
      } finally {
        setParsing(false);
      }
    };
    
    reader.onerror = () => {
      setError("Lỗi đọc file từ máy tính!");
      setParsing(false);
    };

    reader.readAsBinaryString(file);
  };

  const getAIInsight = async () => {
    if (data.length === 0) return;
    
    const apiKey = localStorage.getItem('ai_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError("Vui lòng cấu hình Gemini API Key trong phần Settings trước khi dùng AI Analysis.");
      return;
    }

    setAiLoading(true);
    setError('');
    try {
      const topVidsText = data.slice(0, 10).map(v => 
        `- "${v.title}": ${v.views} views, CTR ${v.ctr}%, Retention ${v.retention}%, Subs Gained: ${v.subscribers}`
      ).join('\n');

      const result = await analyzeExportedData(apiKey, topVidsText);
      
      const initialMessage = { role: 'model', content: result };
      setChatHistory([initialMessage]);
      setChatOpen(true);
      setAiInsight(result); // Legacy support for original UI block
    } catch (err) {
      console.error(err);
      let msg = err.message;
      if (msg.includes('503') || msg.toLowerCase().includes('high demand')) {
        msg = "Hệ thống AI đang quá tải. Đã thử lại nhưng chưa thành công.";
      }
      setError("Lỗi AI: " + msg);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || aiLoading) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setAiLoading(true);

    try {
      const apiKey = localStorage.getItem('ai_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
      const topVidsText = data.slice(0, 10).map(v => 
        `- "${v.title}": ${v.views} views, CTR ${v.ctr}%, Retention ${v.retention}%, Subs Gained: ${v.subscribers}`
      ).join('\n');

      const response = await chatWithExportedData(apiKey, topVidsText, userMsg, chatHistory);
      setChatHistory(prev => [...prev, { role: 'model', content: response }]);
    } catch (err) {
      setError("Lỗi Chat: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Preparation for charts
  const topViewsData = data.slice(0, 5).map(v => ({
    name: v.title.substring(0, 30) + '...',
    views: v.views,
    fullTitle: v.title
  }));

  const scatterData = data.slice(0, 20).map(v => ({
    name: v.title.substring(0, 25) + '...',
    ctr: v.ctr,
    retention: v.retention,
    views: v.views,
    fullTitle: v.title
  }));

  const audienceData = [
    { name: 'Người xem mới', value: data.reduce((acc, curr) => acc + curr.newViewers, 0) },
    { name: 'Người xem cũ', value: data.reduce((acc, curr) => acc + curr.returningViewers, 0) }
  ];

  const CustomChartTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1e1e2e', border: '1px solid var(--border-hover)', padding: '10px', borderRadius: '8px', zIndex: 100 }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', maxWidth: '300px' }}>{payload[0].payload.fullTitle}</div>
          {payload.map((p, i) => (
            <div key={i} style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
              <span style={{ color: 'var(--text-secondary)' }}>{p.name}:</span> {p.value}
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Studio Reports" subtitle="Phân tích báo cáo YouTube Studio (Offline)" />
      
      <div className="page-content">
        
        {/* Upload Section */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={18} style={{ color: 'var(--accent-green)' }} /> Upload Báo cáo
            </span>
          </div>
          
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', width: '100%' }}>
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  flex: 1, maxWidth: '400px', height: '120px',
                  border: '2px dashed var(--border)', borderRadius: '12px',
                  background: 'var(--bg-secondary)', cursor: 'pointer',
                  transition: 'all 0.2s', color: 'var(--text-secondary)'
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <Upload size={28} style={{ marginBottom: '12px', color: 'var(--accent-blue)' }} />
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Chọn file Excel/CSV mới</span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    accept=".xlsx,.xls,.csv" 
                    style={{ display: 'none' }} 
                  />
                </label>

                {fileName && (
                  <div style={{ padding: '16px', background: 'rgba(34, 211, 165, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 211, 165, 0.2)', display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <div style={{ background: 'var(--accent-green)', color: '#000', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)' }}>Đang hiển thị dữ liệu từ</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{fileName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{data.length} hàng dữ liệu</div>
                    </div>
                    <button onClick={clearData} className="btn btn-ghost" style={{ color: 'var(--accent-red)', padding: '8px' }} title="Xóa dữ liệu">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
                
                {parsing && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</div>}
              </div>

          {error && (
            <div className="animate-fade-in" style={{ marginTop: '16px', padding: '12px', background: 'var(--accent-red-dim)', borderRadius: '8px', border: '1px solid rgba(255,59,92,0.3)', color: 'var(--accent-red)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}
        </div>

        {/* Dashboards - Only show when data is loaded */}
        {data.length > 0 && (
          <div className="animate-fade-in">
            {/* Stats Overview */}
            <div className="grid-4" style={{ marginBottom: '24px' }}>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Tổng Lượt xem</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{data.reduce((acc, v) => acc + v.views, 0).toLocaleString()}</div>
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>CTR Trung bình</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-pink)' }}>{(data.reduce((acc, v) => acc + v.ctr, 0) / data.length).toFixed(2)}%</div>
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Người xem mới</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-green)' }}>{data.reduce((acc, v) => acc + v.newViewers, 0).toLocaleString()}</div>
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>Đăng ký mới</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{data.reduce((acc, v) => acc + v.subscribers, 0).toLocaleString()}</div>
              </div>
            </div>

            {/* AI Call To Action & Chat */}
            <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(155, 89, 245, 0.05), rgba(79, 125, 255, 0.05))', borderColor: 'rgba(155, 89, 245, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: chatHistory.length > 0 ? '20px' : 0 }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    <Wand2 size={18} style={{ color: 'var(--accent-purple)' }} /> AI Phân tích & Chat chuyên sâu
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Hỏi AI bất kỳ điều gì về dữ liệu của bạn để tìm ra cơ hội tăng trưởng.</p>
                </div>
                {chatHistory.length === 0 ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={getAIInsight} 
                    disabled={aiLoading}
                    style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', border: 'none' }}
                  >
                    {aiLoading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang xử lý...</> : <><Settings size={14} /> Bắt đầu phân tích</>}
                  </button>
                ) : (
                  <button className="btn btn-ghost" onClick={() => setChatHistory([])} style={{ fontSize: '12px' }}><Trash2 size={14} /> Xóa hội thoại</button>
                )}
              </div>

              {chatHistory.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto', padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: msg.role === 'user' ? 'var(--accent-blue)' : 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      <div style={{ 
                        maxWidth: '80%', padding: '12px 16px', borderRadius: '12px', 
                        background: msg.role === 'user' ? 'rgba(79, 125, 255, 0.1)' : 'var(--bg-secondary)',
                        color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.6,
                        border: '1px solid', borderColor: msg.role === 'user' ? 'rgba(79, 125, 255, 0.2)' : 'var(--border)'
                      }}>
                        {msg.content.split('\n').map((line, i) => (
                          <p key={i} style={{ marginBottom: line.trim() === '' ? '0' : '8px' }}>
                            {line.startsWith('### ') ? <strong style={{color: 'var(--accent-blue)', display: 'block', marginTop: '10px'}}>{line.replace('### ', '')}</strong> : line}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}

              {chatHistory.length > 0 && (
                <form onSubmit={handleSendMessage} style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Hỏi AI thêm về dữ liệu này... (ví dụ: Video nào hút subs nhất?)"
                    style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                  <button type="submit" className="btn btn-primary" disabled={aiLoading || !chatInput.trim()}>
                    {aiLoading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                  </button>
                </form>
              )}
            </div>

            {/* Charts Row 1 */}
            <div className="grid-2" style={{ marginBottom: '24px' }}>
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Top 5 Video Lượt xem Cao nhất</span>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topViewsData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="views" name="Lượt xem" radius={[0,4,4,0]} fill="#ff3b5c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Khán giả Mới vs Cũ</span>
                </div>
                <div style={{ display: 'flex', height: '250px' }}>
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={audienceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                        {audienceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#22d3a5' : '#4f7dff'} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => value.toLocaleString()} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#22d3a5' }} />
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Mới</div>
                        <div style={{ fontWeight: 600 }}>{audienceData[0].value.toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#4f7dff' }} />
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Cũ</div>
                        <div style={{ fontWeight: 600 }}>{audienceData[1].value.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="card" style={{ marginBottom: '24px' }}>
              <div className="card-header">
                <span className="card-title">Tương quan Tỷ lệ Click (CTR) & Ở lại xem (Retention)</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Biểu đồ phân tán (Scatter) giúp bạn tìm ra những video hội tụ cả hình thu nhỏ xuất sắc (CTR cao) và chất lượng nội dung tốt (Retention cao).</p>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" dataKey="ctr" name="CTR (%)" unit="%" tick={{ fill: '#555568', fontSize: 10 }} />
                  <YAxis type="number" dataKey="retention" name="Retention" unit="%" tick={{ fill: '#555568', fontSize: 10 }} />
                  <ZAxis type="number" dataKey="views" range={[50, 400]} name="Lượt xem" />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Videos" data={scatterData} fill="#f5c542" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Data Table */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Dữ liệu chi tiết</span>
              </div>
              <div style={{ overflowX: 'auto', padding: '12px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-hover)' }}>
                      <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tiêu đề Video</th>
                      {Object.keys(data[0] || {}).filter(k => 
                        !['id', 'title'].includes(k) && typeof data[0][k] === 'number'
                      ).map(k => (
                        <th key={k} style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'capitalize' }}>
                          {k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: 500 }}>
                          <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={row.title}>{row.title}</div>
                        </td>
                        {Object.keys(row).filter(k => 
                          !['id', 'title'].includes(k) && typeof row[k] === 'number'
                        ).map(k => (
                          <td key={k} style={{ padding: '12px', fontSize: '13px', color: k.toLowerCase().includes('ctr') || k.toLowerCase().includes('retention') ? 'inherit' : 'var(--text-secondary)' }}>
                            {k.toLowerCase().includes('ctr') || k.toLowerCase().includes('retention') ? `${row[k].toFixed(1)}%` : row[k].toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
