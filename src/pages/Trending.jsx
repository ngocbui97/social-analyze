import { useEffect, useState } from 'react';
import { Flame, TrendingUp, Clock, Eye, ChevronRight, Zap, Globe, Loader, ExternalLink } from 'lucide-react';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getTrendingVideos, formatNumber } from '../services/youtube';
import { useTracker } from '../hooks/useTracker';
import './Trending.css';

const REGIONS = [
  { code: 'US', label: 'United States' },
  { code: 'VN', label: 'Vietnam' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'JP', label: 'Japan' },
  { code: 'IN', label: 'India' },
];

export default function Trending() {
  useTracker('Trending Topics');
  const { accessToken } = useAuth();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState('US');
  const [error, setError] = useState(null);

  const load = async (r) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrendingVideos(accessToken, r, 15);
      setVideos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(region); }, [region]);

  const handleRegion = (r) => { setRegion(r); };

  return (
    <div className="trending-page animate-fade-in">
      <Topbar title="Trending Topics" subtitle="What's hot on YouTube right now — live data" />
      <div className="page-content">

        {/* Header Stats */}
        <div className="trending-stats" style={{ marginBottom: '20px' }}>
          {[
            { icon: Flame, label: 'Trending Videos', value: videos.length.toString(), color: 'red' },
            { icon: Eye, label: 'Avg Views', value: videos.length ? formatNumber(Math.round(videos.reduce((a, v) => a + v.views, 0) / videos.length)) : '—', color: 'green' },
            { icon: Globe, label: 'Region', value: region, color: 'blue' },
            { icon: Zap, label: 'Live Data', value: '✓', color: 'yellow' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={`trending-stat trending-stat--${color}`}>
              <Icon size={20} />
              <div className="trending-stat-val">{value}</div>
              <div className="trending-stat-lbl">{label}</div>
            </div>
          ))}
        </div>

        {/* Region Filter */}
        <div className="category-filter">
          {REGIONS.map(r => (
            <button
              key={r.code}
              id={`region-${r.code}`}
              className={`cat-btn ${region === r.code ? 'active' : ''}`}
              onClick={() => handleRegion(r.code)}
            >
              {r.label}
            </button>
          ))}
          <div className="cat-updated">
            <Clock size={11} /> Live from YouTube
          </div>
        </div>

        {error && (
          <div style={{ background: 'var(--accent-red-dim)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px', color: 'var(--accent-red)', fontSize: '13px' }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
            <Loader size={36} style={{ animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 600 }}>Loading trending videos from YouTube...</div>
          </div>
        ) : (
          <div className="card">
            {videos.map((v, i) => (
              <div key={v.id} className="trending-row" id={`trending-${i + 1}`}>
                <div className="trending-rank" style={{ color: i < 3 ? 'var(--accent-red)' : 'var(--text-muted)' }}>
                  {i === 0 ? '🔥' : i === 1 ? '⚡' : i === 2 ? '🌟' : `#${i + 1}`}
                </div>
                <img src={v.thumbnail} alt={v.title} className="trending-thumb" />
                <div className="trending-info">
                  <div className="trending-title">
                    {v.title}
                    {i < 3 && <span className="badge badge-red" style={{ marginLeft: '8px', fontSize: '9px' }}>VIRAL</span>}
                  </div>
                  <div className="trending-cat" style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                    {v.channel}
                  </div>
                </div>
                <div className="trending-views">
                  <Eye size={12} /> {formatNumber(v.views)}
                </div>
                <div className="trending-growth" style={{ color: 'var(--accent-green)' }}>
                  <TrendingUp size={12} /> {formatNumber(v.likes)} likes
                </div>
                <a
                  href={`https://youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  id={`watch-${i + 1}`}
                  style={{ padding: '7px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Watch <ExternalLink size={11} />
                </a>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
