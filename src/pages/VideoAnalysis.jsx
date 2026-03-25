import { useState } from 'react';
import { useTracker } from '../hooks/useTracker';
import { Link, Tag, FileText, BarChart2, CheckCircle, AlertCircle, XCircle, Lightbulb, Copy, Loader, ExternalLink } from 'lucide-react';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getVideoDetails, parseVideoId, scoreVideo } from '../services/youtube';
import { useTranslation } from 'react-i18next';
import './VideoAnalysis.css';

function IssueItem({ type, text }) {
  const Icon = type === 'success' ? CheckCircle : type === 'warning' ? AlertCircle : XCircle;
  const colors = { success: 'var(--accent-green)', warning: 'var(--accent-yellow)', error: 'var(--accent-red)' };
  return (
    <div className="issue-item" style={{ '--clr': colors[type] }}>
      <Icon size={14} style={{ color: colors[type], flexShrink: 0 }} />
      <span>{text}</span>
    </div>
  );
}

function ScoreGauge({ score }) {
  const { t } = useTranslation();
  const color = score >= 75 ? '#22d3a5' : score >= 50 ? '#f5c542' : '#ff3b5c';
  return (
    <div className="score-gauge">
      <svg viewBox="0 0 100 60" className="gauge-svg">
        <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round" />
        <path d="M10,55 A40,40 0 0,1 90,55" fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${(score / 100) * 125.66} 125.66`} />
        <text x="50" y="55" textAnchor="middle" fill={color} fontSize="18" fontWeight="800">{score}</text>
      </svg>
      <div className="gauge-label" style={{ color }}>
        {score >= 75 ? `🟢 ${t('videoAnalysis.great')}` : score >= 50 ? `🟡 ${t('videoAnalysis.needsWork')}` : `🔴 ${t('videoAnalysis.poor')}`}
      </div>
    </div>
  );
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).catch(() => {});
}

export default function VideoAnalysis() {
  const { t } = useTranslation();
  useTracker('Video Analysis');
  const { accessToken } = useAuth();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState(null);
  const [scores, setScores] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('title');

  const handleAnalyze = async () => {
    const videoId = parseVideoId(url.trim());
    if (!videoId) {
      setError(t('videoAnalysis.parseError'));
      return;
    }
    setLoading(true);
    setError(null);
    setVideo(null);
    try {
      const data = await getVideoDetails(accessToken, videoId);
      if (!data) throw new Error(t('videoAnalysis.notFound'));
      setVideo(data);
      setScores(scoreVideo({ title: data.title, description: data.description, tags: data.tags }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const aiTitles = video ? [
    `${video.title.split(' ').slice(0, 5).join(' ')} (2025 Update)`,
    `I Tried "${video.title.split(' ').slice(0, 4).join(' ')}" — Here's What Happened`,
    `The Truth About ${video.title.split(' ').slice(0, 5).join(' ')} Nobody Tells You`,
  ] : [];

  const tabs = scores ? [
    { id: 'title', label: t('videoAnalysis.titleScore'), issues: scores.issues.title },
    { id: 'description', label: t('videoAnalysis.descScore'), issues: scores.issues.description },
    { id: 'tags', label: t('videoAnalysis.tagScore'), issues: scores.issues.tags },
  ] : [];

  return (
    <div className="va-page animate-fade-in">
      <Topbar title={t('videoAnalysis.title')} subtitle={t('videoAnalysis.subtitle')} />
      <div className="page-content">

        {/* URL Input */}
        <div className="va-url-input card">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input
              id="video-url-input"
              className="input-field"
              style={{ flex: 1 }}
              type="text"
              placeholder={t('videoAnalysis.urlPlaceholder')}
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            />
            <button
              className="btn btn-primary" id="analyze-video-btn"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading
                ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
                : <BarChart2 size={14} />}
              {loading ? t('videoAnalysis.analyzing') : t('videoAnalysis.analyze')}
            </button>
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
            {t('videoAnalysis.supports')}
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--accent-red-dim)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px', color: 'var(--accent-red)', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 600 }}>{t('videoAnalysis.loadingData')}</div>
          </div>
        )}

        {video && scores && !loading && (
          <div className="va-layout">
            {/* Left: Scores */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: '8px' }}>{t('videoAnalysis.overallScore')}</div>
                <ScoreGauge score={scores.overall} />
                <div className="mini-scores">
                  {[
                    { label: t('videoAnalysis.titleScore'), score: scores.titleScore },
                    { label: t('videoAnalysis.descScore'), score: scores.descScore },
                    { label: t('videoAnalysis.tagScore'), score: scores.tagScore },
                  ].map(({ label, score }) => {
                    const c = score >= 75 ? '#22d3a5' : score >= 50 ? '#f5c542' : '#ff3b5c';
                    return (
                      <div key={label} className="mini-score">
                        <div className="mini-score-label">{label}</div>
                        <div className="mini-score-bar">
                          <div className="mini-bar-fill" style={{ width: `${score}%`, background: c }} />
                        </div>
                        <span style={{ color: c, fontSize: '12px', fontWeight: 700 }}>{score}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Video Stats */}
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { label: t('videoAnalysis.views'), value: video.views.toLocaleString() },
                    { label: t('videoAnalysis.likes'), value: video.likes.toLocaleString() },
                    { label: t('videoAnalysis.comments'), value: video.comments.toLocaleString() },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                  <a href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-blue)', fontSize: '12px', marginTop: '4px' }}>
                    <ExternalLink size={12} /> {t('videoAnalysis.openYoutube')}
                  </a>
                </div>
              </div>

              {/* AI Title Suggestions */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: '14px' }}>
                  <Lightbulb size={14} style={{ color: 'var(--accent-yellow)', verticalAlign: 'middle', marginRight: '6px' }} />
                  {t('videoAnalysis.aiTitleSuggestions')}
                </div>
                {aiTitles.map((t, i) => (
                  <div key={i} className="ai-title-row" id={`ai-title-${i}`}>
                    <span className="ai-title-num">{i + 1}</span>
                    <span className="ai-title-text">{t}</span>
                    <button className="icon-btn-sm" title="Copy" id={`copy-title-${i}`} onClick={() => copyToClipboard(t)}>
                      <Copy size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Detail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Thumbnail + content */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: '14px' }}>{t('videoAnalysis.videoContent')}</div>
                {video.thumbnail && (
                  <img src={video.thumbnail} alt={video.title} style={{ width: '100%', borderRadius: 'var(--radius-md)', marginBottom: '16px', objectFit: 'cover', maxHeight: '200px' }} />
                )}
                <div className="va-field">
                  <div className="va-field-label">{t('videoAnalysis.titleScore')}</div>
                  <div className="va-field-value">{video.title}</div>
                </div>
                <div className="va-field">
                  <div className="va-field-label">{t('videoAnalysis.descriptionLabel')}</div>
                  <div className="va-field-value va-desc">{video.description?.slice(0, 300) || t('videoAnalysis.noDescription')}{video.description?.length > 300 ? '...' : ''}</div>
                </div>
                <div className="va-field">
                  <div className="va-field-label">{t('videoAnalysis.tagsCount', { count: video.tags.length })}</div>
                  {video.tags.length > 0
                    ? <div className="va-tags">{video.tags.slice(0, 20).map(tag => <span key={tag} className="tag">{tag}</span>)}</div>
                    : <div style={{ color: 'var(--accent-red)', fontSize: '12px' }}>{t('videoAnalysis.noTagsFound')}</div>
                  }
                </div>
              </div>

              {/* Issues Panel */}
              <div className="card">
                <div className="card-header">
                  <span className="card-title">{t('videoAnalysis.optimizationIssues')}</span>
                  <div className="va-tabs">
                    {tabs.map(tab => (
                      <button key={tab.id} id={`tab-${tab.id}`}
                        className={`va-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="issues-list">
                  {tabs.find(t => t.id === activeTab)?.issues.map((issue, i) => (
                    <IssueItem key={i} {...issue} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!video && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('videoAnalysis.emptyTitle')}</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>{t('videoAnalysis.emptyDesc')}</div>
          </div>
        )}

      </div>
    </div>
  );
}
