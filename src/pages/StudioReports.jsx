import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTracker } from '../hooks/useTracker';
import { FileSpreadsheet, Upload, Trash2, RefreshCw, AlertCircle, Wand2, Settings, User, Bot, Send, BarChart2, Search, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import * as XLSX from 'xlsx';
import Topbar from '../components/Topbar';
import { analyzeExportedData, chatWithExportedData } from '../services/ai';
import './StudioReports.css';

export default function StudioReports() {
  const { t } = useTranslation();
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
  
  // Search, Filter, Sort States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'views', direction: 'desc' });

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
          throw new Error(t('studio.errorNoData'));
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
          impressions: findKey(firstRow, ['Lượt hiển thị', 'Impressions']),
          publishDate: findKey(firstRow, ['Ngày xuất bản', 'Publish date', 'Published', 'Ngày'])
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
            item.publishDate = row[keyMap.publishDate] || '';
            return item;
          })
          .sort((a, b) => b.views - a.views);

        if (parsed.length === 0) {
          throw new Error(t('studio.errorHeader'));
        }

        setData(parsed);
      } catch (err) {
        setError(err.message || t('studio.errorRead'));
        setData([]);
      } finally {
        setParsing(false);
      }
    };
    
    reader.onerror = () => {
      setError(t('studio.errorLocal'));
      setParsing(false);
    };

    reader.readAsBinaryString(file);
  };

  const getAIInsight = async () => {
    if (data.length === 0) return;
    
    const apiKey = localStorage.getItem('ai_api_key') || import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setError(t('studio.errorAiConfig'));
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
        msg = t('studio.aiOverloaded');
      }
      setError("AI Error: " + msg);
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
      setError("Chat Error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };
  
  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedData = React.useMemo(() => {
    let result = [...data];

    // Search
    if (searchTerm) {
      result = result.filter(v => 
        v.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter
    if (filterType === 'highViews') {
      result = result.filter(v => v.views > 1000);
    } else if (filterType === 'highCtr') {
      result = result.filter(v => v.ctr > 5);
    } else if (filterType === 'highRetention') {
      result = result.filter(v => v.retention > 40);
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      
      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [data, searchTerm, filterType, sortConfig]);

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
    { name: t('studio.new'), value: data.reduce((acc, curr) => acc + curr.newViewers, 0) },
    { name: t('studio.returning'), value: data.reduce((acc, curr) => acc + curr.returningViewers, 0) }
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
      <Topbar title={t('common.studioReports')} subtitle={t('studio.titleSubtitle', 'Analysis of YouTube Studio Reports (Offline)')} />
      
      <div className="page-content">
        
        {/* Upload Section */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="card-header" style={{ marginBottom: '16px' }}>
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={18} style={{ color: 'var(--accent-green)' }} /> {t('studio.uploadTitle')}
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
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{t('studio.uploadDashed')}</span>
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
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)' }}>{t('studio.displayingDataFrom')}</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{fileName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{data.length} {t('studio.rowsOfData')}</div>
                    </div>
                    <button onClick={clearData} className="btn btn-ghost" style={{ color: 'var(--accent-red)', padding: '8px' }} title={t('common.delete')}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
                
                {parsing && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('studio.processing')}</div>}
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
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>{t('studio.totalViews')}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-blue)' }}>{data.reduce((acc, v) => acc + v.views, 0).toLocaleString()}</div>
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>{t('studio.avgCtr')}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-pink)' }}>{(data.reduce((acc, v) => acc + v.ctr, 0) / data.length).toFixed(2)}%</div>
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>{t('studio.newViewers')}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-green)' }}>{data.reduce((acc, v) => acc + v.newViewers, 0).toLocaleString()}</div>
              </div>
              <div className="card" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '4px' }}>{t('studio.subscribers')}</div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>{data.reduce((acc, v) => acc + v.subscribers, 0).toLocaleString()}</div>
              </div>
            </div>

            {/* AI Call To Action & Chat */}
            <div className="card" style={{ marginBottom: '24px', background: 'linear-gradient(135deg, rgba(155, 89, 245, 0.05), rgba(79, 125, 255, 0.05))', borderColor: 'rgba(155, 89, 245, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: chatHistory.length > 0 ? '20px' : 0 }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    <Wand2 size={18} style={{ color: 'var(--accent-purple)' }} /> {t('studio.aiAnalysisTitle')}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('studio.aiAnalysisDesc')}</p>
                </div>
                {chatHistory.length === 0 ? (
                  <button 
                    className="btn btn-primary" 
                    onClick={getAIInsight} 
                    disabled={aiLoading}
                    style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', border: 'none' }}
                  >
                    {aiLoading ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> {t('studio.processing')}</> : <><Settings size={14} /> {t('studio.startAnalysis')}</>}
                  </button>
                ) : (
                  <button className="btn btn-ghost" onClick={() => setChatHistory([])} style={{ fontSize: '12px' }}><Trash2 size={14} /> {t('studio.clearChat')}</button>
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
                    placeholder={t('studio.chatPlaceholder')}
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
                  <span className="card-title">{t('studio.top5Views')}</span>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topViewsData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} width={120} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar dataKey="views" name={t('studio.views', 'Views')} radius={[0,4,4,0]} fill="#ff3b5c" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">{t('studio.newVsReturning')}</span>
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
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('studio.new')}</div>
                        <div style={{ fontWeight: 600 }}>{audienceData[0].value.toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#4f7dff' }} />
                      <div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('studio.returning')}</div>
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
                <span className="card-title">{t('studio.ctrRetentionCorrelation')}</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>{t('studio.scatterDesc')}</p>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis type="number" dataKey="ctr" name="CTR (%)" unit="%" tick={{ fill: '#555568', fontSize: 10 }} />
                  <YAxis type="number" dataKey="retention" name="Retention" unit="%" tick={{ fill: '#555568', fontSize: 10 }} />
                  <ZAxis type="number" dataKey="views" range={[50, 400]} name={t('studio.views', 'Views')} />
                  <Tooltip content={<CustomChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter name="Videos" data={scatterData} fill="#f5c542" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Data Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BarChart2 size={18} style={{ color: 'var(--accent-blue)' }} /> {t('studio.detailedData')}
                  <span style={{ fontSize: '11px', fontWeight: 'normal', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    {t('studio.scrollRight')}
                  </span>
                </span>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Search */}
                  <div style={{ position: 'relative', minWidth: '200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t('studio.searchPlaceholder')}
                      style={{ 
                        padding: '8px 12px 8px 32px', background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', borderRadius: '6px', 
                        fontSize: '13px', color: 'var(--text-primary)', width: '100%' 
                      }}
                    />
                  </div>

                  {/* Filter */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value)}
                      style={{ 
                        padding: '8px 12px', background: 'var(--bg-secondary)', 
                        border: '1px solid var(--border)', borderRadius: '6px', 
                        fontSize: '13px', color: 'var(--text-primary)', cursor: 'pointer'
                      }}
                    >
                      <option value="all">{t('studio.filterAll')}</option>
                      <option value="highViews">{t('studio.filterHighViews')}</option>
                      <option value="highCtr">{t('studio.filterHighCtr')}</option>
                      <option value="highRetention">{t('studio.filterHighRetention')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="custom-table-container" style={{ 
                overflowX: 'auto', 
                overflowY: 'auto',
                maxHeight: '600px', 
                position: 'relative',
                background: 'var(--bg-card)'
              }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'separate', 
                  borderSpacing: 0,
                  textAlign: 'left', 
                  minWidth: Math.max(1000, (Object.keys(data[0] || {}).length * 130)) + 'px'
                }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-card)' }}>
                    <tr>
                      <th 
                        onClick={() => handleSort('title')}
                        style={{ 
                          padding: '14px 24px', 
                          fontSize: '12px', 
                          color: 'var(--text-primary)', 
                          fontWeight: 700,
                          background: 'var(--bg-secondary)',
                          borderBottom: '2px solid var(--border-hover)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 11,
                          whiteSpace: 'nowrap',
                          boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {t('studio.videoTitle')}
                          {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                        </div>
                      </th>
                      {Object.keys(data[0] || {}).filter(k => 
                        !['id', 'title'].includes(k) && (typeof data[0][k] === 'number' || k === 'publishDate')
                      ).map(k => {
                        let displayKey = k.replace(/_/g, ' ');
                        if (k === 'views') displayKey = t('studio.totalViews');
                        if (k === 'watchTime') displayKey = t('studio.watchTimeHours');
                        if (k === 'ctr') displayKey = t('studio.avgCtr') + ' (CTR)';
                        if (k === 'retention') displayKey = t('studio.returning') + ' (%)';
                        if (k === 'newViewers') displayKey = t('studio.newViewers');
                        if (k === 'returningViewers') displayKey = t('studio.returning');
                        if (k === 'subscribers') displayKey = t('studio.subscribers');
                        if (k === 'impressions') displayKey = t('studio.impressions');
                        if (k === 'publishDate') displayKey = t('studio.publishDate');

                        return (
                          <th 
                            key={k} 
                            onClick={() => handleSort(k)}
                            style={{ 
                              padding: '14px 20px', 
                              fontSize: '12px', 
                              color: 'var(--text-secondary)', 
                              fontWeight: 600, 
                              background: 'var(--bg-secondary)',
                              borderBottom: '2px solid var(--border-hover)',
                              whiteSpace: 'nowrap',
                              minWidth: '100px',
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {displayKey}
                              {sortConfig.key === k && (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedData.map((row, i) => (
                      <tr key={i} style={{ transition: 'background 0.2s' }} className="table-row-hover">
                        <td style={{ 
                          padding: '14px 24px', 
                          fontSize: '13px', 
                          fontWeight: 500,
                          background: 'var(--bg-card)',
                          borderBottom: '1px solid var(--border)',
                          position: 'sticky',
                          left: 0,
                          zIndex: 5,
                          boxShadow: '2px 0 5px rgba(0,0,0,0.05)',
                          maxWidth: '350px'
                        }}>
                          <div style={{ 
                            width: 'fit-content',
                            maxWidth: '320px', 
                            whiteSpace: 'nowrap', 
                            overflow: 'hidden', 
                            textOverflow: 'ellipsis',
                            color: 'var(--text-primary)'
                          }} title={row.title}>
                            {row.title}
                          </div>
                        </td>
                        {Object.keys(row).filter(k => 
                          !['id', 'title'].includes(k) && (typeof row[k] === 'number' || k === 'publishDate')
                        ).map(k => (
                          <td key={k} style={{ 
                            padding: '14px 20px', 
                            fontSize: '13px', 
                            color: 'var(--text-secondary)',
                            borderBottom: '1px solid var(--border)',
                            whiteSpace: 'nowrap'
                          }}>
                            {typeof row[k] === 'number' ? (
                              <span style={{ 
                                color: k.toLowerCase().includes('ctr') || k.toLowerCase().includes('retention') ? 'var(--accent-green)' : 'inherit',
                                fontWeight: k.toLowerCase().includes('ctr') || k.toLowerCase().includes('retention') ? '600' : 'normal'
                              }}>
                                {k.toLowerCase().includes('ctr') || k.toLowerCase().includes('retention') ? `${row[k].toFixed(2)}%` : row[k].toLocaleString()}
                              </span>
                            ) : (
                              <span style={{ color: k === 'publishDate' ? 'var(--accent-purple)' : 'inherit' }}>{row[k]}</span>
                            )}
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
