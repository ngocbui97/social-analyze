import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { useTracker } from '../hooks/useTracker';
import { Search, Tag, Lightbulb, Star, ChevronRight, Filter, Loader } from 'lucide-react';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getKeywordAnalysis, formatNumber } from '../services/youtube';
import './Keywords.css';

const suggestions = [
  'react tutorial 2025', 'ai coding tools', 'build saas app', 'typescript basics',
  'nextjs app router', 'vibe coding', 'passive income tech', 'docker containers'
];

function ScoreCircle({ score }) {
  const color = score >= 70 ? '#22d3a5' : score >= 40 ? '#f5c542' : '#ff3b5c';
  return (
    <div className="score-circle" style={{ '--score-color': color }}>
      <svg viewBox="0 0 36 36" className="score-svg">
        <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r="15" fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${(score / 100) * 94.2} 94.2`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span style={{ color }}>{score}</span>
    </div>
  );
}

const compColor = v => v > 60 ? '#ff3b5c' : v > 30 ? '#f5c542' : '#22d3a5';
const compLabel = v => v > 60 ? 'High' : v > 30 ? 'Medium' : 'Low';
const volLabel = v => v > 70 ? 'Very High' : v > 50 ? 'High' : v > 30 ? 'Medium' : v > 10 ? 'Low' : 'Very Low';

export default function Keywords() {
  const { t } = useTranslation();
  useTracker('Keyword Research');
  const { accessToken } = useAuth();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (kw = query) => {
    if (!kw.trim()) return;
    setQuery(kw);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await getKeywordAnalysis(accessToken, kw);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kw-page animate-fade-in">
      <Topbar title={t('keywords.title')} subtitle={t('keywords.subtitle')} />
      <div className="page-content">

        {/* Search Bar */}
        <div className="kw-search-wrap">
          <div className="kw-search-box">
            <Search size={18} className="kw-search-icon" />
            <input
              id="keyword-search-input"
              className="kw-search-input"
              type="text"
              placeholder={t('keywords.searchPlaceholder')}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
            <button
              className="btn btn-primary" id="search-keyword-btn"
              onClick={() => handleSearch()}
              disabled={loading}
            >
              {loading ? <Loader size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Search size={14} />}
              {loading ? t('keywords.analyzing') : t('keywords.analyze')}
            </button>
          </div>
          <div className="kw-suggestions">
            <Lightbulb size={12} />
            <span>{t('keywords.try')}</span>
            {suggestions.map(s => (
              <button key={s} className="tag" onClick={() => handleSearch(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--accent-red-dim)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px', color: 'var(--accent-red)', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent-red)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 600 }}>{t('keywords.analyzingQuery', { query })}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{t('keywords.scanning')}</div>
          </div>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="kw-layout">
            {/* Main Panel */}
            <div>
              {/* Overview Card */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <div className="card-header">
                  <span className="card-title">{t('keywords.searchResultTitle', { keyword: result.keyword })}</span>
                  <span className="badge badge-blue">{t('keywords.videosFound', { count: result.totalResults?.toLocaleString() })}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
                  {[
                    { label: t('keywords.opportunityScore'), value: result.opportunityScore, desc: t('keywords.higherRanking') },
                    { label: t('keywords.volumeScore'), value: result.volumeScore, desc: t('keywords.avgViews', { views: formatNumber(result.avgViews) }) },
                    { label: t('keywords.competitionScore'), value: result.competitionScore, desc: compLabel(result.competitionScore) + ' competition' },
                  ].map(({ label, value, desc }) => (
                    <div key={label} style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                      <ScoreCircle score={value} />
                      <div style={{ fontWeight: 600, fontSize: '12px', marginTop: '8px' }}>{label}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>
                    </div>
                  ))}
                </div>

                {/* Related Keywords */}
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                    <Tag size={11} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> {t('keywords.relatedKeywords')}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.relatedKeywords.map(k => (
                      <button key={k} className="tag" onClick={() => handleSearch(k)}>{k}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Top Videos */}
              <div className="card">
                <div className="card-title" style={{ marginBottom: '16px' }}>{t('keywords.topRankingVideos')}</div>
                {result.topVideos.map((v, i) => (
                  <div key={v.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '10px', borderRadius: 'var(--radius-md)', transition: 'background 0.15s', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-red-dim)', color: 'var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{i + 1}</div>
                    <img src={v.thumbnail} alt={v.title} style={{ width: 80, height: 45, borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{v.channel} · {formatNumber(v.views)} views</div>
                    </div>
                    <a href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '5px 10px', fontSize: '11px', flexShrink: 0 }}>
                      {t('keywords.viewVideo')}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Side Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: '16px' }}>📊 {t('keywords.scoreBreakdown')}</div>
                {[
                  { label: t('keywords.searchVolume'), value: result.volumeScore },
                  { label: t('keywords.competitionScore'), value: result.competitionScore },
                  { label: t('keywords.opportunityScore'), value: result.opportunityScore },
                ].map(({ label, value }) => (
                  <div key={label} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontWeight: 600 }}>{value}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${value}%`, background: 'var(--accent-red)' }} />
                    </div>
                  </div>
                ))}
                <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  {t('keywords.maxViewsFound')} <strong style={{ color: 'var(--text-primary)' }}>{formatNumber(result.maxViews)}</strong>
                </div>
              </div>

              <div className="card">
                <div className="card-title" style={{ marginBottom: '14px' }}>🏆 {t('keywords.suggestedTitles')}</div>
                {[
                  `${result.keyword} (Complete Guide 2025)`,
                  `I Tested Every ${result.keyword} — Here's the Truth`,
                  `Top 5 ${result.keyword} for Beginners`,
                ].map((t, i) => (
                  <div key={i} className="top-title-row">
                    <span className="top-title-num">{i + 1}</span>
                    <span>{t}</span>
                    <ChevronRight size={13} style={{ color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!result && !loading && !error && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <Search size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
            <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-secondary)' }}>{t('keywords.emptyTitle')}</div>
            <div style={{ fontSize: '13px', marginTop: '6px' }}>{t('keywords.emptyDesc')}</div>
          </div>
        )}

      </div>
    </div>
  );
}
