import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Topbar from '../components/Topbar';
import { Upload, FileSpreadsheet, BarChart2, PieChart as PieChartIcon, Settings, Wand2, RefreshCw, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell } from 'recharts';
import { useTracker } from '../hooks/useTracker';
import { analyzeExportedData } from '../services/ai';

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

        // Vietnamese column parsing logic
        const parsed = rawData
          .filter(row => row['Nội dung'] && row['Nội dung'] !== 'Tổng' && row['Tiêu đề video'])
          .map(row => {
            return {
              id: row['Nội dung'],
              title: row['Tiêu đề video'],
              views: Number(row['Số lượt xem'] || 0),
              watchTime: Number(row['Thời gian xem (giờ)'] || 0),
              ctr: Number(row['Tỷ lệ nhấp của số lượt hiển thị hình thu nhỏ (%)'] || 0),
              retention: Number(row['Ở lại xem (%)'] || 0),
              newViewers: Number(row['Người xem mới'] || 0),
              returningViewers: Number(row['Người xem cũ'] || 0),
              subscribers: Number(row['Số người đăng ký'] || 0),
              impressions: Number(row['Lượt hiển thị hình thu nhỏ'] || 0)
            };
          })
          .sort((a, b) => b.views - a.views);

        if (parsed.length === 0) {
          throw new Error("Không tìm thấy video hợp lệ trong file. Vui lòng đảm bảo bạn đang dùng file export từ YouTube Studio (tiếng Việt).");
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
    setError(''); // Clear previous errors
    try {
      // Get top 10 videos to send to AI
      const topVidsText = data.slice(0, 10).map(v => 
        `- "${v.title}": ${v.views} views, CTR ${v.ctr}%, Retention ${v.retention}%, Subs Gained: ${v.subscribers}`
      ).join('\n');

      const result = await analyzeExportedData(apiKey, topVidsText);
      setAiInsight(result);
    } catch (err) {
      console.error(err);
      let msg = err.message;
      if (msg.includes('503') || msg.toLowerCase().includes('high demand')) {
        msg = "Hệ thống AI đang quá tải (503). Chúng tôi đã tự động thử lại nhiều lần nhưng chưa thành công. Vui lòng thử lại sau ít phút hoặc kiểm tra lại API Key.";
      }
      setError("Lỗi khi kết nối AI: " + msg);
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
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              width: '100%', maxWidth: '400px', height: '120px',
              border: '2px dashed var(--border)', borderRadius: '12px',
              background: 'var(--bg-secondary)', cursor: 'pointer',
              transition: 'all 0.2s', color: 'var(--text-secondary)'
            }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <Upload size={28} style={{ marginBottom: '12px', color: 'var(--accent-blue)' }} />
              <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>Chọn file Excel/CSV</span>
              <span style={{ fontSize: '12px', marginTop: '4px' }}>Hỗ trợ file xuất từ YouTube Studio</span>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                accept=".xlsx,.xls,.csv" 
                style={{ display: 'none' }} 
              />
            </label>

            {fileName && (
              <div style={{ padding: '16px', background: 'rgba(34, 211, 165, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 211, 165, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--accent-green)', color: '#000', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)' }}>Đã đọc thành công</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{fileName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Phân tích được {data.length} hàng dữ liệu</div>
                </div>
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
            
            {/* AI Call To Action */}
            <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(155, 89, 245, 0.1), rgba(79, 125, 255, 0.1))', borderColor: 'rgba(155, 89, 245, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    <Wand2 size={18} style={{ color: 'var(--accent-purple)' }} /> AI Phân tích chuyên sâu
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Biến số liệu khô khan thành chiến lược thực tế nhờ sự hỗ trợ của Gemini AI.</p>
                </div>
                <button 
                  className="btn btn-primary" 
                  onClick={getAIInsight} 
                  disabled={aiLoading}
                  style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', border: 'none' }}
                >
                  {aiLoading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> Đang phân tích...</> : <><Settings size={14} /> Bắt đầu phân tích</>}
                </button>
              </div>

              {aiInsight && (
                <div className="animate-fade-in" style={{ marginTop: '20px', padding: '20px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '14px', lineHeight: 1.6 }}>
                  {aiInsight.split('\n').map((line, idx) => {
                    if (line.startsWith('### ')) return <h3 key={idx} style={{ marginTop: idx===0?0:'16px', marginBottom: '8px', color: 'var(--accent-blue)', fontSize: '16px' }}>{line.replace('### ', '')}</h3>;
                    if (line.startsWith('**')) return <strong key={idx} style={{ display: 'block', marginTop: '8px' }}>{line.replace(/\*\*/g, '')}</strong>;
                    if (line.startsWith('- ')) return <li key={idx} style={{ marginLeft: '16px', color: 'var(--text-secondary)' }}>{line.substring(2)}</li>;
                    if (line.trim() === '') return <br key={idx} />;
                    return <p key={idx} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>{line}</p>;
                  })}
                </div>
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
                      <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Lượt xem</th>
                      <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>CTR (%)</th>
                      <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Giữ chân (%)</th>
                      <th style={{ padding: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Subs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: 500 }}>
                          <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.title}</div>
                        </td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.views.toLocaleString()}</td>
                        <td style={{ padding: '12px', fontSize: '13px', color: row.ctr > 5 ? 'var(--accent-green)' : 'inherit' }}>{row.ctr.toFixed(2)}%</td>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{row.retention.toFixed(2)}%</td>
                        <td style={{ padding: '12px', fontSize: '13px', color: row.subscribers > 0 ? 'var(--accent-green)' : row.subscribers < 0 ? 'var(--accent-red)' : 'inherit' }}>
                          {row.subscribers > 0 ? '+' : ''}{row.subscribers}
                        </td>
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
