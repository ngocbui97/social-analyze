import { useState } from 'react';
import { useTracker } from '../hooks/useTracker';
import { MessageSquare, Link, MessageCircle, Loader, BarChart2, Zap, Copy, CheckCircle, Brain } from 'lucide-react';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getVideoDetails, parseVideoId, getVideoComments } from '../services/youtube';
import { analyzeComments, draftCommentReplies } from '../services/ai';
import { useTranslation } from 'react-i18next';

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function CommentsAnalyzer() {
  const { t } = useTranslation();
  useTracker('Comments Analyzer');
  const { accessToken } = useAuth();
  
  const [url, setUrl] = useState('');
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  const [draftingId, setDraftingId] = useState(null);
  const [drafts, setDrafts] = useState({}); // { commentId: "markdown text" }

  const handleFetch = async () => {
    const videoId = parseVideoId(url.trim());
    if (!videoId) {
      setError(t('videoAnalysis.parseError', 'URL không hợp lệ'));
      return;
    }
    
    setLoading(true);
    setError(null);
    setVideo(null);
    setComments([]);
    setAiAnalysis(null);
    setDrafts({});
    
    try {
      const vData = await getVideoDetails(accessToken, videoId);
      if (!vData) throw new Error(t('videoAnalysis.notFound', 'Không tìm thấy video.'));
      setVideo(vData);
      
      const cData = await getVideoComments(accessToken, videoId, 30);
      setComments(cData);
      if (cData.length === 0) {
        setError('Video này không có bình luận hoặc đã tắt bình luận.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeSentiment = async () => {
    if (comments.length === 0) return;
    setAnalyzing(true);
    try {
      const apiKey = localStorage.getItem('ai_api_key');
      const textToAnalyze = comments.map(c => c.text).join('\n---\n');
      const response = await analyzeComments(apiKey, textToAnalyze);
      setAiAnalysis(response);
    } catch (err) {
      setError("AI Error: " + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDraftReply = async (commentId, text) => {
    setDraftingId(commentId);
    try {
      const apiKey = localStorage.getItem('ai_api_key');
      const response = await draftCommentReplies(apiKey, text);
      setDrafts(prev => ({ ...prev, [commentId]: response }));
    } catch (err) {
      setError("AI Error: " + err.message);
    } finally {
      setDraftingId(null);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Comments Analyzer" subtitle="AI Sentiment & Auto-Reply" />
      
      <div className="page-content">
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              style={{ flex: 1 }}
              type="text"
              placeholder="Dán link video YouTube vào đây..."
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFetch()}
            />
            <button className="btn btn-primary" onClick={handleFetch} disabled={loading}>
              {loading ? <Loader size={14} className="animate-spin" /> : <MessageSquare size={14} />}
              Tải Bình luận
            </button>
          </div>
        </div>

        {error && (
          <div style={{ padding: '14px', background: 'var(--accent-red-dim)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: 'var(--radius-md)', color: 'var(--accent-red)', fontSize: '13px', marginBottom: '24px' }}>
            ⚠️ {error}
          </div>
        )}

        {video && comments.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
            
            {/* Left: AI Sentiment Overview */}
            <div className="card" style={{ position: 'sticky', top: '24px' }}>
              <div className="my-channel-header" style={{ marginBottom: '20px' }}>
                <img src={video.thumbnail} alt="" style={{ width: 120, height: 68, objectFit: 'cover', borderRadius: '8px' }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '4px' }}>{video.title}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{comments.length} bình luận đã tải</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BarChart2 size={16} style={{ color: 'var(--accent-purple)' }} /> Tâm lý & Chủ đề
                  </span>
                  {!aiAnalysis && (
                    <button className="btn btn-primary" onClick={handleAnalyzeSentiment} disabled={analyzing} style={{ padding: '6px 12px', fontSize: '12px' }}>
                      {analyzing ? <Loader size={14} className="animate-spin" /> : <Brain size={14} />}
                      Phân tích AI
                    </button>
                  )}
                </div>

                {analyzing && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    <Loader size={32} className="animate-spin" style={{ color: 'var(--accent-purple)', marginBottom: '12px' }} />
                    <span style={{ fontSize: '13px' }}>Đang tổng hợp ý kiến khán giả...</span>
                  </div>
                )}

                {!analyzing && aiAnalysis && (
                  <div className="ai-markdown-content" style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    {aiAnalysis}
                  </div>
                )}

                {!analyzing && !aiAnalysis && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', color: 'var(--text-muted)', opacity: 0.5 }}>
                    <Brain size={48} style={{ marginBottom: '16px' }} />
                    <p style={{ fontSize: '13px', textAlign: 'center' }}>Trí tuệ nhân tạo sẽ đọc toàn bộ bình luận <br/>để tóm tắt cảm xúc của khán giả.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Comments Feed */}
            <div className="card" style={{ background: 'transparent', border: 'none', padding: 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {comments.map(c => (
                  <div key={c.id} className="card" style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                      <img src={c.authorThumbnail} alt={c.author} style={{ width: 36, height: 36, borderRadius: '50%' }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <span style={{ fontWeight: 600, fontSize: '13px' }}>{c.author}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(c.publishedAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                          {c.text}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '12px', marginTop: '12px' }}>
                      {!drafts[c.id] ? (
                        <button 
                          className="btn btn-ghost" 
                          onClick={() => handleDraftReply(c.id, c.text)}
                          disabled={draftingId === c.id}
                          style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--accent-blue)' }}
                        >
                          {draftingId === c.id ? <Loader size={12} className="animate-spin" /> : <Zap size={12} />}
                          AI Soạn câu trả lời
                        </button>
                      ) : (
                        <div style={{ background: 'rgba(79,125,255,0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(79,125,255,0.1)' }}>
                          <div style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 600, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Zap size={12} /> CHỌN CÂU TRẢ LỜI:
                          </div>
                          <div className="ai-markdown-content" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                            {drafts[c.id]}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
