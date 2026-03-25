import { useState, useEffect } from 'react';
import { useTracker } from '../hooks/useTracker';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUp, Clock, Users, Globe, Video, Eye, Loader } from 'lucide-react';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getChannelStats, getRecentVideos, formatNumber } from '../services/youtube';
import { useTranslation } from 'react-i18next';

export default function Analytics() {
  const { t } = useTranslation();
  useTracker('Channel Analytics');

  const trafficSources = [
    { name: t('analytics.search'), value: 38, color: '#4f7dff' },
    { name: t('analytics.suggested'), value: 29, color: '#9b59f5' },
    { name: t('analytics.external'), value: 16, color: '#22d3a5' },
    { name: t('analytics.browse'), value: 12, color: '#f5c542' },
    { name: t('analytics.other'), value: 5, color: '#ff7d3b' },
  ];

  const demographics = [
    { age: '18-24', percent: 28 }, { age: '25-34', percent: 41 }, { age: '35-44', percent: 18 },
    { age: '45-54', percent: 9 }, { age: '55+', percent: 4 },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hover)', padding: '10px 14px', borderRadius: '10px', fontSize: '12px' }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: '4px' }}>{label}</div>
          <strong style={{ color: '#4f7dff' }}>{t('analytics.viewsTooltip', { count: formatNumber(payload[0].value) })}</strong>
        </div>
      );
    }
    return null;
  };
  const { accessToken } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    Promise.all([
      getChannelStats(accessToken),
    ]).then(([ch]) => {
      setChannel(ch);
      if (ch?.id) return getRecentVideos(accessToken, ch.id, 6);
      return [];
    }).then(vids => {
      setVideos(vids);
    }).finally(() => setLoading(false));
  }, [accessToken]);

  const viewData = [...videos].reverse().map(v => ({
    name: v.title.slice(0, 10) + '...',
    views: v.views,
  }));

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Topbar title={t('analytics.title')} subtitle={t('analytics.loadingSubtitle')} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-red)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      <Topbar title={t('analytics.title')} subtitle={t('analytics.subtitle', { channel: channel?.title || 'your channel' })} />
      <div className="page-content">

        {/* Key Metrics */}
        <div className="grid-4" style={{ marginBottom: '20px' }}>
          {[
            { label: t('analytics.subscribers'), value: formatNumber(channel?.subscribers || 0), change: t('analytics.new'), icon: Users, color: '#4f7dff' },
            { label: t('analytics.totalViews'), value: formatNumber(channel?.totalViews || 0), change: t('analytics.live'), icon: Eye, color: '#9b59f5' },
            { label: t('analytics.videos'), value: channel?.videoCount || 0, change: '✓', icon: Video, color: '#22d3a5' },
            { label: t('analytics.engagement'), value: t('analytics.live'), change: '—', icon: ArrowUp, color: '#f5c542' },
          ].map(({ label, value, change, icon: Icon, color }) => (
            <div key={label} className="card" style={{ borderTop: `2px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                  <Icon size={15} />
                </div>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-green)', background: 'var(--accent-green-dim)', padding: '2px 8px', borderRadius: '100px' }}>{change}</span>
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '2px' }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: '20px' }}>
          {/* Recent Video Views Chart */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '20px' }}>{t('analytics.viewsPerVideo')}</div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={viewData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="views" stroke="#4f7dff" strokeWidth={2.5} dot={{ r: 4, fill: '#4f7dff', strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic Sources (Industry Average) */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: '20px' }}>{t('analytics.trafficSources')}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={trafficSources} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {trafficSources.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1 }}>
                {trafficSources.map(s => (
                  <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', fontSize: '12px' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ color: 'var(--text-secondary)', flex: 1 }}>{s.name}</span>
                    <strong>{s.value}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Demographics (Estimated) */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: '20px' }}>{t('analytics.audienceDemographics')}</div>
          {demographics.map(({ age, percent }) => (
            <div key={age} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
              <div style={{ width: '44px', fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>{age}</div>
              <div style={{ flex: 1, height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percent * 2.5}%`, background: 'linear-gradient(90deg, var(--accent-red), var(--accent-purple))', borderRadius: '4px', transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ width: '36px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{percent}%</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
