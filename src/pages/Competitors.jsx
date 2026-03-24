import { useState, useEffect } from 'react';
import { useTracker } from '../hooks/useTracker';
import { Users, TrendingUp, Eye, Video, Award, ChevronRight, BarChart2, Search, Loader, Plus } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getChannelStats, searchYouTube, formatNumber } from '../services/youtube';
import { loadCompetitors, saveCompetitor, removeCompetitor } from '../services/supabase';
import './Competitors.css';

const competitors = [
  { id: 1, name: 'CodeWithMosh', subs: '3.8M', views: '280M', videos: 182, avgViews: '420K', ctr: '7.2%', score: 90, avatar: 'https://i.pravatar.cc/48?img=1', growth: '+2.1%' },
  { id: 2, name: 'Fireship', subs: '2.4M', views: '195M', videos: 1240, avgViews: '310K', ctr: '9.8%', score: 96, avatar: 'https://i.pravatar.cc/48?img=2', growth: '+5.4%' },
  { id: 3, name: 'Theo - t3.gg', subs: '1.1M', views: '42M', videos: 890, avgViews: '180K', ctr: '8.1%', score: 84, avatar: 'https://i.pravatar.cc/48?img=3', growth: '+8.9%' },
  { id: 4, name: 'Jack Herrington', subs: '320K', views: '14M', videos: 410, avgViews: '95K', ctr: '6.5%', score: 78, avatar: 'https://i.pravatar.cc/48?img=4', growth: '+3.2%' },
];

const myChannel = { name: 'TechVision', subs: '1.24M', views: '88M', videos: 240, avgViews: '210K', ctr: '9.1%', score: 88 };

const radarData = [
  { subject: 'Views', you: 72, leader: 95 },
  { subject: 'Subs Growth', you: 85, leader: 78 },
  { subject: 'CTR', you: 91, leader: 85 },
  { subject: 'Upload Freq', you: 60, leader: 90 },
  { subject: 'Engagement', you: 80, leader: 88 },
  { subject: 'SEO Score', you: 88, leader: 96 },
];

export default function Competitors() {
  useTracker('Competitor Analysis');
  const { accessToken, user } = useAuth();
  const [myChannel, setMyChannel] = useState(null);
  const [competitors, setCompetitors] = useState([
    { id: 'UC-lHJZR3Gqxm24_Vd_AJ5Yw', title: 'CodeWithMosh', subscribers: 3800000, totalViews: 280000000, videoCount: 182, thumbnail: 'https://i.pravatar.cc/48?img=1' },
    { id: 'UC-8QAzbLcRglz4qrW2DODPw', title: 'Fireship', subscribers: 2400000, totalViews: 195000000, videoCount: 1240, thumbnail: 'https://i.pravatar.cc/48?img=2' },
  ]);
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!accessToken) return;
    getChannelStats(accessToken).then(setMyChannel);
  }, [accessToken]);

  // Load saved competitors from Supabase
  useEffect(() => {
    if (!user?.email) return;
    loadCompetitors(user.email).then(saved => {
      if (saved.length > 0) {
        setCompetitors(saved);
      }
    });
  }, [user?.email]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    try {
      const res = await searchYouTube(accessToken, search, 5);
      // Filter out duplicate or non-channel results if needed (API returns videos, but we want their channels)
      // For simplicity, we'll just show the channels of these videos
      setSearchResults(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const addCompetitor = (v) => {
    const newComp = {
      id: v.channelId || v.id,
      title: v.channel || v.title,
      subscribers: 0,
      totalViews: v.views,
      videoCount: 0,
      thumbnail: v.thumbnail
    };
    if (competitors.find(c => c.id === newComp.id)) return;
    setCompetitors(prev => [newComp, ...prev]);
    setSearchResults([]);
    setSearch('');
    // Save to Supabase
    if (user?.email) {
      saveCompetitor(user.email, newComp);
    }
  };

  const radarData = [
    { subject: 'Views', you: 72, leader: 95 },
    { subject: 'Subs Growth', you: 85, leader: 78 },
    { subject: 'CTR', you: 91, leader: 85 },
    { subject: 'Upload Freq', you: 60, leader: 90 },
    { subject: 'Engagement', you: 80, leader: 88 },
    { subject: 'SEO Score', you: 88, leader: 96 },
  ];

  return (
    <div className="comp-page animate-fade-in">
      <Topbar title="Competitor Analysis" subtitle="Benchmark your channel against top creators" />
      <div className="page-content">

        {/* Search / Add Competitor */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>Find Channels to Compare</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="search-bar" style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 12px', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder="Search for a YouTube channel..." 
                style={{ background: 'none', border: 'none', padding: '12px', color: 'var(--text-primary)', flex: 1 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
              {searching ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
              Search
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <img src={v.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{v.channel}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{formatNumber(v.views)} views on top video</div>
                  </div>
                  <button className="btn-ghost" onClick={() => addCompetitor(v)}>
                    <Plus size={14} /> Add
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="comp-top">
          <div className="card comp-radar-card">
            <div className="card-title" style={{ marginBottom: '14px' }}>Channel Performance Radar</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} cx="50%" cy="50%">
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Radar name="You" dataKey="you" stroke="var(--accent-red)" fill="var(--accent-red)" fillOpacity={0.15} strokeWidth={2} />
                <Radar name="Leader" dataKey="leader" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.1} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="radar-legend">
              <span><span style={{ background: 'var(--accent-red)' }} />You ({myChannel?.title || 'Loading...'})</span>
              <span><span style={{ background: 'var(--accent-blue)' }} />Channel Leader</span>
            </div>
          </div>

          <div className="card comp-my-card">
            <div className="card-title" style={{ marginBottom: '14px' }}>Your Channel</div>
            <div className="my-channel-header">
              <img src={myChannel?.thumbnail || "https://i.pravatar.cc/52?img=12"} alt="Me" className="comp-avatar-lg" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{myChannel?.title || 'Loading...'}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatNumber(myChannel?.subscribers || 0)} subscribers</div>
              </div>
            </div>
            {[
              { label: 'Total Views', value: formatNumber(myChannel?.totalViews || 0), icon: Eye },
              { label: 'Videos', value: myChannel?.videoCount || 0, icon: Video },
              { label: 'Avg Views/Video', value: formatNumber(Math.round((myChannel?.totalViews || 0) / (myChannel?.videoCount || 1))), icon: BarChart2 },
              { label: 'Region', value: myChannel?.country || '—', icon: Award },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="my-ch-row">
                <div className="my-ch-icon"><Icon size={13} /></div>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{label}</span>
                <span style={{ fontWeight: 700, fontSize: '14px', marginLeft: 'auto' }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">Tracked Competitors ({competitors.length})</span>
          </div>

          <div className="comp-table-head">
            <div>Channel</div>
            <div>Subscribers</div>
            <div>Total Views</div>
            <div>Videos</div>
            <div style={{ marginLeft: 'auto' }}>Action</div>
          </div>

          {competitors.map(c => (
            <div key={c.id} className="comp-row" id={`comp-${c.id}`}>
              <div className="comp-channel">
                <img src={c.thumbnail} alt={c.title} className="comp-avatar" />
                <span>{c.title}</span>
              </div>
              <div className="comp-cell">{formatNumber(c.subscribers)}</div>
              <div className="comp-cell"><Eye size={12} />{formatNumber(c.totalViews)}</div>
              <div className="comp-cell"><Video size={12} />{c.videoCount}</div>
              <button className="btn-ghost" onClick={() => {
                setCompetitors(prev => prev.filter(x => x.id !== c.id));
                if (user?.email) removeCompetitor(user.email, c.id);
              }} style={{ marginLeft: 'auto', color: 'var(--accent-red)' }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
