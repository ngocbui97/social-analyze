import { useState, useEffect } from 'react';
import { useTracker } from '../hooks/useTracker';
import { Users, TrendingUp, Eye, Video, Award, ChevronRight, BarChart2, Search, Loader, Plus } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getChannelStats, searchYouTube, formatNumber, getRecentVideos } from '../services/youtube';
import { loadCompetitors, saveCompetitor, removeCompetitor } from '../services/supabase';
import { useTranslation } from 'react-i18next';
import './Competitors.css';

export default function Competitors() {
  const { t } = useTranslation();
  useTracker('Competitor Analysis');

  const radarData = [
    { subject: t('competitors.radarViews'), you: 72, leader: 95 },
    { subject: t('competitors.radarGrowth'), you: 85, leader: 78 },
    { subject: t('competitors.radarCTR'), you: 91, leader: 85 },
    { subject: t('competitors.radarFrequency'), you: 60, leader: 90 },
    { subject: t('competitors.radarEngagement'), you: 80, leader: 88 },
    { subject: t('competitors.radarSEO'), you: 88, leader: 96 },
  ];
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

  const [competitorVideos, setCompetitorVideos] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);

  // Fetch recent videos for VPH calculation
  useEffect(() => {
    if (!accessToken || competitors.length === 0) return;
    
    let isMounted = true;
    setLoadingVideos(true);
    
    const fetchAllRecent = async () => {
      try {
        const promises = competitors.map(c => 
          getRecentVideos(accessToken, c.id, 4).catch(() => [])
        );
        const results = await Promise.all(promises);
        const allVids = [];
        
        results.forEach((chVids, i) => {
          chVids.forEach(v => {
            const hoursOld = (new Date() - new Date(v.publishedAt)) / (1000 * 60 * 60);
            // Show videos within last 14 days (336 hours)
            if (hoursOld <= 336 && hoursOld > 0) {
              allVids.push({
                 ...v,
                 channelName: competitors[i].title,
                 channelAvatar: competitors[i].thumbnail,
                 hoursOld,
                 vph: Math.round(v.views / hoursOld)
              });
            }
          });
        });
        
        // Sort by Views Per Hour (velocity)
        allVids.sort((a,b) => b.vph - a.vph);
        if (isMounted) setCompetitorVideos(allVids.slice(0, 12));
      } catch (e) {
        console.error('Error fetching competitor videos:', e);
      } finally {
        if (isMounted) setLoadingVideos(false);
      }
    };
    
    fetchAllRecent();
    return () => { isMounted = false; };
  }, [accessToken, competitors]);

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


  return (
    <div className="comp-page animate-fade-in">
      <Topbar title={t('competitors.title')} subtitle={t('competitors.subtitle')} />
      <div className="page-content">

        {/* Search / Add Competitor */}
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-title" style={{ marginBottom: '16px' }}>{t('competitors.findChannels')}</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="search-bar" style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0 12px', display: 'flex', alignItems: 'center' }}>
              <Search size={14} style={{ color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                placeholder={t('competitors.searchPlaceholder')}
                style={{ background: 'none', border: 'none', padding: '12px', color: 'var(--text-primary)', flex: 1 }}
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
              {searching ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
              {t('competitors.search')}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {searchResults.map(v => (
                <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <img src={v.thumbnail} alt="" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{v.channel}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('competitors.viewsOnTop', { count: formatNumber(v.views) })}</div>
                  </div>
                  <button className="btn-ghost" onClick={() => addCompetitor(v)}>
                    <Plus size={14} /> {t('competitors.add')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="comp-top">
          <div className="card comp-radar-card">
            <div className="card-title" style={{ marginBottom: '14px' }}>{t('competitors.radarTitle')}</div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData} cx="50%" cy="50%">
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                <Radar name={t('competitors.you')} dataKey="you" stroke="var(--accent-red)" fill="var(--accent-red)" fillOpacity={0.15} strokeWidth={2} />
                <Radar name={t('competitors.leader')} dataKey="leader" stroke="var(--accent-blue)" fill="var(--accent-blue)" fillOpacity={0.1} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
            <div className="radar-legend">
              <span><span style={{ background: 'var(--accent-red)' }} />{t('competitors.you')} ({myChannel?.title || 'Loading...'})</span>
              <span><span style={{ background: 'var(--accent-blue)' }} />{t('competitors.leader')}</span>
            </div>
          </div>

          <div className="card comp-my-card">
            <div className="card-title" style={{ marginBottom: '14px' }}>{t('competitors.yourChannel')}</div>
            <div className="my-channel-header">
              <img src={myChannel?.thumbnail || "https://i.pravatar.cc/52?img=12"} alt="Me" className="comp-avatar-lg" />
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px' }}>{myChannel?.title || 'Loading...'}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatNumber(myChannel?.subscribers || 0)} {t('competitors.subscribers')}</div>
              </div>
            </div>
            {[
              { label: t('competitors.totalViews'), value: formatNumber(myChannel?.totalViews || 0), icon: Eye },
              { label: t('competitors.videos'), value: myChannel?.videoCount || 0, icon: Video },
              { label: t('competitors.avgViews'), value: formatNumber(Math.round((myChannel?.totalViews || 0) / (myChannel?.videoCount || 1))), icon: BarChart2 },
              { label: t('competitors.region'), value: myChannel?.country || '—', icon: Award },
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
            <span className="card-title">{t('competitors.trackedCompetitors', { count: competitors.length })}</span>
          </div>

          <div className="comp-table-head">
            <div>{t('competitors.channelColumn')}</div>
            <div>{t('competitors.subscribers')}</div>
            <div>{t('competitors.totalViews')}</div>
            <div>{t('competitors.videos')}</div>
            <div style={{ marginLeft: 'auto' }}>{t('competitors.tableAction')}</div>
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
                {t('competitors.remove')}
              </button>
            </div>
          ))}
        </div>

        {/* Competitor Velocity Radar (VPH) */}
        {competitorVideos.length > 0 && (
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} /> 
                Radar Đối thủ: Video đang thịnh hành (VPH)
              </span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
              Theo dõi các video mới nhất của đối thủ và tốc độ tăng lượt xem mỗi giờ (Views Per Hour).
            </div>
             
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {competitorVideos.map(v => (
                <a key={v.id} href={`https://youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', transition: 'all 0.2s', height: '100%' }} onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent-blue)'} onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                    <img src={v.thumbnail} alt={v.title} style={{ width: 100, height: 60, objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: 1.3 }}>{v.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        <img src={v.channelAvatar} alt="" style={{ width: 14, height: 14, borderRadius: '50%', objectFit: 'cover' }} /> {v.channelName}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{Math.round(v.hoursOld)}h trước</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{formatNumber(v.views)} view</span>
                          <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-green)', background: 'rgba(34,211,165,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{formatNumber(v.vph)} VPH</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
