/* eslint-disable react-hooks/set-state-in-effect, no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useTracker } from '../hooks/useTracker';
import { TrendingUp, Eye, Users, ThumbsUp, Play, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getChannelStats, getRecentVideos, formatNumber, formatDate, scoreVideo, parseDuration } from '../services/youtube';
import { getViewerDemographics, getTrafficSources, getOverviewMetrics, getGeography, getDeviceTypes, getTimeSeriesMetrics } from '../services/analytics';
import './Dashboard.css';

const COLORS = ['#4f7dff', '#ff3b5c', '#22d3a5', '#f5c542', '#a05bff', '#ff8b4f', '#00b7ff', '#e042d8'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <div className="tooltip-label">{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="tooltip-row">
            <span className="tooltip-dot" style={{ background: p.color }} />
            <span>{p.name}: <strong>{p.value?.toLocaleString()}</strong></span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

function ScoreBar({ score }) {
  const color = score >= 90 ? '#22d3a5' : score >= 70 ? '#f5c542' : '#ff3b5c';
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-bg">
        <div className="score-bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="score-val" style={{ color }}>{score}</span>
    </div>
  );
}

function Skeleton({ width = '100%', height = '20px', style = {} }) {
  return (
    <div style={{
      width, height, borderRadius: '6px',
      background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--bg-card-hover) 50%, var(--bg-card) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      ...style
    }} />
  );
}

export default function Dashboard() {
  useTracker('Dashboard');
  const { user, accessToken } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [demographics, setDemographics] = useState([]);
  const [trafficSources, setTrafficSources] = useState([]);
  const [geography, setGeography] = useState([]);
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [timeSeries, setTimeSeries] = useState([]);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    Promise.all([
      getChannelStats(accessToken),
    ])
      .then(([ch]) => {
        setChannel(ch);
        if (ch?.id) {
          return getRecentVideos(accessToken, ch.id, 10);
        }
        return [];
      })
      .then(vids => setVideos(vids))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));

    getOverviewMetrics(accessToken).then(setOverview).catch(console.error);
    getViewerDemographics(accessToken).then(setDemographics).catch(console.error);
    getTrafficSources(accessToken).then(setTrafficSources).catch(console.error);
    getGeography(accessToken).then(setGeography).catch(console.error);
    getDeviceTypes(accessToken).then(setDeviceTypes).catch(console.error);
    getTimeSeriesMetrics(accessToken).then(setTimeSeries).catch(console.error);
  }, [accessToken, refreshKey]);

  // Use real time-series data if available, otherwise fallback to fake weekly for demo
  const chartData = timeSeries.length > 0 
    ? timeSeries.map(t => ({
        day: t.day.split('-').slice(1).join('/'),
        views: Number(t.views || 0),
        likes: Number(t.likes || 0)
      }))
    : videos.slice(0, 7).map((v, i) => ({
        day: formatDate(v.publishedAt).split(',')[0],
        views: v.views,
        likes: v.likes,
      })).reverse();

  const statCards = channel ? [
    { label: 'Subscribers (+)', value: overview?.subscribersGained ? `+${formatNumber(Number(overview.subscribersGained))}` : formatNumber(channel.subscribers), icon: Users, color: 'purple' },
    { label: 'Total Views', value: formatNumber(channel.totalViews), icon: Eye, color: 'blue' },
    { label: 'Avg View (sec)', value: overview ? Math.round(overview.averageViewDuration || 0) : '—', icon: Play, color: 'yellow' },
    { label: 'Shares', value: overview ? formatNumber(Number(overview.shares || 0)) : '—', icon: TrendingUp, color: 'green' },
  ] : [];

  const trafficData = trafficSources.map(t => ({
    name: t.insightTrafficSourceType.replace('EXT_URL', 'External').replace('YT_SEARCH', 'Search').replace('RELATED_VIDEO', 'Suggested').replace('SUBSCRIBER', 'Browse features').replace('PROMOTED', 'Promoted'),
    value: Number(t.views || 0)
  })).sort((a,b) => b.value - a.value);

  const ageData = demographics.reduce((acc, curr) => {
    let age = curr.ageGroup.replace('age', '');
    const existing = acc.find(a => a.age === age);
    if (existing) {
      existing.pct += Number(curr.viewerPercentage);
    } else {
      acc.push({ age, pct: Number(curr.viewerPercentage) });
    }
    return acc;
  }, []).sort((a,b) => a.age.localeCompare(b.age));

  const geoData = geography.map(g => ({
    name: g.country,
    value: Number(g.views || 0)
  })).slice(0, 5);

  const deviceData = deviceTypes.map(d => ({
    name: d.deviceType.replace('MOBILE', 'Mobile').replace('DESKTOP', 'Desktop').replace('TABLET', 'Tablet').replace('TV', 'Smart TV'),
    value: Number(d.views || 0)
  }));

  return (
    <div className="dashboard-page animate-fade-in">
      <Topbar
        title="Dashboard"
        subtitle={channel ? `Welcome, ${channel.title} 👋` : 'Loading your channel...'}
      />
      <div className="page-content">

        {error && (
          <div style={{ background: 'var(--accent-red-dim)', border: '1px solid rgba(255,59,92,0.3)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: '20px', color: 'var(--accent-red)', fontSize: '13px' }}>
            ⚠️ API Error: {error}. Make sure YouTube Data API v3 is enabled in your Google Cloud project.
          </div>
        )}

        {/* Channel Header */}
        {channel && (
          <div className="card channel-header-card">
            {channel.bannerUrl && (
              <div className="channel-banner" style={{ backgroundImage: `url(${channel.bannerUrl})` }} />
            )}
            <div className="channel-info-row">
              <img src={channel.thumbnail} alt={channel.title} className="channel-avatar-large" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {channel.title}
                  {channel.customUrl && <span className="channel-handle">{channel.customUrl}</span>}
                </div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', maxWidth: '800px', lineHeight: 1.5 }}>
                  {channel.description?.slice(0, 150)}...
                </div>
                {channel.keywords && channel.keywords.length > 0 && (
                  <div className="channel-keywords">
                    {channel.keywords.slice(0, 6).map((kw, i) => (
                      <span key={i} className="keyword-pill">{kw}</span>
                    ))}
                  </div>
                )}
              </div>
              <button className="btn btn-secondary" onClick={() => setRefreshKey(k => k + 1)} style={{ padding: '8px 14px', fontSize: '12px', alignSelf: 'flex-start', marginTop: '10px' }}>
                <RefreshCw size={13} /> Refresh
              </button>
            </div>
          </div>
        )}

        {/* Stat Cards */}
        <div className="stat-cards" style={{ marginBottom: '20px' }}>
          {loading
            ? Array(4).fill(0).map((_, i) => (
                <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Skeleton height="32px" width="32px" style={{ borderRadius: '9px' }} />
                  <Skeleton height="28px" width="60%" />
                  <Skeleton height="14px" width="40%" />
                </div>
              ))
            : statCards.map(({ label, value, icon: Icon, color }) => (
                <div className={`stat-card stat-card--${color}`} key={label}>
                  <div className="stat-card-header">
                    <div className={`stat-icon stat-icon--${color}`}><Icon size={16} /></div>
                  </div>
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{label}</div>
                </div>
              ))
          }
        </div>

        {/* Charts Row */}
        {chartData.length > 0 && (
          <div className="charts-row">
            <div className="card chart-card chart-large">
              <div className="card-header">
                <span className="card-title">Views Performance (Last 30 Days)</span>
                <div className="chart-legend">
                  <span className="legend-item"><span style={{ background: '#4f7dff' }} />Views</span>
                  <span className="legend-item"><span style={{ background: '#ff3b5c' }} />Likes</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f7dff" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4f7dff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="likesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ff3b5c" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ff3b5c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="views" name="Views" stroke="#4f7dff" strokeWidth={2} fill="url(#viewsGrad)" />
                  <Area type="monotone" dataKey="likes" name="Likes" stroke="#ff3b5c" strokeWidth={2} fill="url(#likesGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card chart-card chart-small">
              <div className="card-header">
                <span className="card-title">Likes Over Time</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="day" tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="likes" name="Likes" radius={[4,4,0,0]} fill="#ff3b5c" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Analytics API Charts Row 1 */}
        {(trafficData.length > 0 || ageData.length > 0) && (
          <div className="charts-row">
            {trafficData.length > 0 && (
              <div className="card chart-card chart-small">
                <div className="card-header">
                  <span className="card-title">Traffic Sources</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={trafficData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2}>
                      {trafficData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {ageData.length > 0 && (
              <div className="card chart-card chart-large">
                <div className="card-header">
                  <span className="card-title">Audience Age Demographics (%)</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ageData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="age" tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="pct" name="% Viewers" radius={[4,4,0,0]} fill="#22d3a5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Analytics API Charts Row 2 */}
        {(geoData.length > 0 || deviceData.length > 0) && (
          <div className="charts-row">
            {geoData.length > 0 && (
              <div className="card chart-card chart-large">
                <div className="card-header">
                  <span className="card-title">Top Countries (Views)</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={geoData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#555568', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#555568', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Views" radius={[0,4,4,0]} fill="#f5c542" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {deviceData.length > 0 && (
              <div className="card chart-card chart-small">
                <div className="card-header">
                  <span className="card-title">Device Types</span>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={deviceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2}>
                      {deviceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Recent Videos */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Video Performance</span>
            <button className="btn btn-ghost" id="view-all-videos"><Play size={13} /> View all</button>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {Array(4).fill(0).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <Skeleton width="80px" height="45px" style={{ borderRadius: '6px', flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Skeleton height="14px" width="70%" />
                    <Skeleton height="10px" width="30%" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="video-table">
              <div className="video-table-head">
                <div>Video</div>
                <div>Views</div>
                <div>Likes</div>
                <div>Comments</div>
                <div>SEO Score</div>
              </div>
              {videos.map(v => {
                const { overall } = scoreVideo({ title: v.title, description: v.description, tags: v.tags });
                return (
                  <div className="video-row" key={v.id}>
                    <div className="video-info">
                      <div className="video-thumb-container">
                        <img src={v.thumbnail} alt={v.title} className="video-thumb" />
                        <span className="video-duration">{parseDuration(v.duration)}</span>
                      </div>
                      <div className="video-meta">
                        <div className="video-title">{v.title}</div>
                        <div className="video-trend">
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatDate(v.publishedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="video-stat"><Eye size={13} />{formatNumber(v.views)}</div>
                    <div className="video-stat"><ThumbsUp size={13} />{formatNumber(v.likes)}</div>
                    <div className="video-stat">{formatNumber(v.comments)}</div>
                    <div><ScoreBar score={overall} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
