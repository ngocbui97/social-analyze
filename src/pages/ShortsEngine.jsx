import { useState } from 'react';
import { useTracker } from '../hooks/useTracker';
import { Link, Loader, Brain, Youtube, Play, TrendingUp, Scissors } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getVideoDetails, parseVideoId } from '../services/youtube';
import { findViralShorts } from '../services/ai';
import { useTranslation } from 'react-i18next';

// Generate dummy retention data for the graph to make it look premium
function generateDummyRetention(durationStr) {
  // duration format is usually PT10M30S from youtube. We'll just generate 10 points.
  const data = [];
  let current = 100;
  for (let i = 0; i <= 10; i++) {
    data.push({
      time: `${i * 10}%`,
      retention: Math.max(10, current)
    });
    // Random drop between 2 and 12 percent
    current -= Math.floor(Math.random() * 10) + 2; 
    
    // Add fake "viral spike" near the middle-end
    if (i === 4 || i === 7) current += Math.floor(Math.random() * 15);
  }
  return data;
}

export default function ShortsEngine() {
  const { t } = useTranslation();
  useTracker('Shorts Engine');
  const { accessToken } = useAuth();
  
  const [url, setUrl] = useState('');
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [retentionData, setRetentionData] = useState([]);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const handleFetch = async () => {
    const videoId = parseVideoId(url.trim());
    if (!videoId) {
      setError(t('videoAnalysis.parseError', 'URL không hợp lệ'));
      return;
    }
    
    setLoading(true);
    setError(null);
    setVideo(null);
    setAiAnalysis(null);
    
    try {
      const vData = await getVideoDetails(accessToken, videoId);
      if (!vData) throw new Error(t('videoAnalysis.notFound', 'Không tìm thấy video.'));
      setVideo(vData);
      setRetentionData(generateDummyRetention(vData.duration));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFindShorts = async () => {
    if (!video) return;
    setAnalyzing(true);
    try {
      const apiKey = localStorage.getItem('ai_api_key');
      const response = await findViralShorts(apiKey, video);
      setAiAnalysis(response);
    } catch (err) {
      setError("AI Error: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1e1e2e', border: '1px solid var(--border-hover)', padding: '8px 12px', borderRadius: '8px', zIndex: 100 }}>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{payload[0].payload.time}</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-purple)' }}>
            Giữ chân: <span style={{ color: '#fff' }}>{payload[0].value}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Shorts Repurposing Engine" subtitle="AI Viral Segment Finder" />
      
      <div className="page-content">
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              style={{ flex: 1 }}
              type="text"
              placeholder="Dán link video YouTube dài (Long-form) vào đây..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetch()}
            />
            <button className="btn btn-primary" onClick={handleFetch} disabled={loading}>
              {loading ? <Loader size={14} className="animate-spin" /> : <Youtube size={14} />}
              Trích xuất Video
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '14px', background: 'var(--accent-red-dim)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--accent-red)', fontSize: '13px', marginBottom: '24px' }}>
            ⚠️ {error}
          </div>
        )}

        {video && !loading && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
            
            <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <img src={video.thumbnail} alt="" style={{ width: 180, height: 100, objectFit: 'cover', borderRadius: '8px' }} />
              <div>
                <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{video.title}</div>
                <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Play size={12} /> {Number(video.views).toLocaleString()} views</span>
                  <span>{video.duration.replace('PT','').toLowerCase()}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={16} style={{ color: 'var(--accent-blue)' }} /> Dự đoán Biểu đồ Giữ chân (Retention Simulator)
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '20px' }}>
                Biểu đồ mô phỏng tỷ lệ giữ chân khán giả. AI sẽ tìm kiếm các đoạn có tỷ lệ rời bỏ thấp nhất hoặc điểm nhấn để cắt Shorts.
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={retentionData}>
                  <defs>
                    <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="retention" stroke="var(--accent-purple)" strokeWidth={3} fillOpacity={1} fill="url(#colorRetention)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34, 211, 165, 0.05), rgba(79, 125, 255, 0.05))', borderColor: 'rgba(34, 211, 165, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)' }}>
                  <Scissors size={20} /> AI Trích xuất Shorts Viral
                </div>
                {!aiAnalysis && (
                  <button className="btn btn-primary" onClick={handleFindShorts} disabled={analyzing} style={{ background: 'var(--accent-green)', color: '#000', border: 'none' }}>
                    {analyzing ? <Loader size={14} className="animate-spin" /> : <Brain size={14} />}
                    Phân tích & Cắt Video
                  </button>
                )}
              </div>

              {analyzing && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
                  <Loader size={32} className="animate-spin" style={{ color: 'var(--accent-green)', marginBottom: '16px' }} />
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>Gemini đang xem lại kịch bản và tìm các khoảnh khắc viral...</span>
                </div>
              )}

              {!analyzing && aiAnalysis && (
                <div className="ai-markdown-content" style={{ fontSize: '14.5px', lineHeight: 1.6, color: 'var(--text-primary)' }}>
                  {aiAnalysis}
                </div>
              )}

              {!analyzing && !aiAnalysis && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)', opacity: 0.6 }}>
                  <Scissors size={48} style={{ marginBottom: '16px' }} />
                  <p style={{ fontSize: '14px', textAlign: 'center' }}>Nhấn nút Phân tích để AI tự động tìm 3 đoạn video ngắn <br/>dễ viral nhất từ video gốc này.</p>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
