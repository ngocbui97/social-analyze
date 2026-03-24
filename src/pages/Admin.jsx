import { useEffect, useState, useMemo } from 'react';
import { ShieldAlert, Users, Activity, BarChart2, Database, RefreshCw, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import Topbar from '../components/Topbar';
import { getFeatureLogs, getUserCount, getAllUsers } from '../services/supabase';

export default function Admin() {
  const { isRoot } = useAuth();
  const [logs, setLogs] = useState([]);
  const [userCount, setUserCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('supabase'); // 'supabase' or 'local'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsData, count, usersData] = await Promise.all([
        getFeatureLogs(),
        getUserCount(),
        getAllUsers(),
      ]);

      if (logsData.length > 0 || count > 0) {
        setLogs(logsData);
        setUserCount(count);
        setUsers(usersData);
        setSource('supabase');
      } else {
        // Fallback to localStorage
        const rawLogs = localStorage.getItem('socialiq_logs') || '[]';
        const localLogs = JSON.parse(rawLogs);
        setLogs(localLogs.map(l => ({
          user_email: l.userEmail,
          user_name: l.userName,
          feature: l.feature,
          created_at: l.timestamp,
        })));
        setUserCount(new Set(localLogs.map(l => l.userEmail)).size);
        setSource('local');
      }
    } catch (e) {
      // Fallback to localStorage on error
      const rawLogs = localStorage.getItem('socialiq_logs') || '[]';
      const localLogs = JSON.parse(rawLogs);
      setLogs(localLogs.map(l => ({
        user_email: l.userEmail,
        user_name: l.userName,
        feature: l.feature,
        created_at: l.timestamp,
      })));
      setUserCount(new Set(localLogs.map(l => l.userEmail)).size);
      setSource('local');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const featureUsage = useMemo(() => {
    const counts = {};
    logs.forEach(l => {
      counts[l.feature] = (counts[l.feature] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  // Transform logs into daily activity for the last 14 days
  const dailyActivity = useMemo(() => {
    const days = 14;
    const data = [];
    const now = new Date();
    
    // Initialize last 14 days with 0
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      data.push({
        dateStr: d.toISOString().split('T')[0],
        displayDate: `${d.getMonth() + 1}/${d.getDate()}`,
        count: 0
      });
    }

    // Fill with actual data
    logs.forEach(l => {
      if (!l.created_at) return;
      const logDate = l.created_at.split('T')[0];
      const dayEntry = data.find(d => d.dateStr === logDate);
      if (dayEntry) dayEntry.count++;
    });

    return data;
  }, [logs]);

  // Aggregate user interactions for the table
  const usersWithStats = useMemo(() => {
    return users.map(u => {
      const userLogs = logs.filter(l => l.user_email === u.email);
      return {
        ...u,
        interactionCount: userLogs.length,
        lastActive: userLogs.length > 0 
          ? new Date(Math.max(...userLogs.map(l => new Date(l.created_at).getTime())))
          : (u.last_login ? new Date(u.last_login) : null)
      };
    }).sort((a, b) => b.interactionCount - a.interactionCount);
  }, [users, logs]);

  if (!isRoot) {
    return (
      <div className="animate-fade-in" style={{ padding: '80px 40px', textAlign: 'center' }}>
        <ShieldAlert size={64} style={{ color: 'var(--accent-red)', margin: '0 auto 16px' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
          You do not have root privileges to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title="Admin Dashboard" subtitle="Root Access - System Statistics" />
      <div className="page-content">
        <div style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' }}>
        
        {/* Data source badge + refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px',
            background: source === 'supabase' ? 'rgba(34,211,165,0.1)' : 'rgba(245,197,66,0.1)',
            color: source === 'supabase' ? 'var(--accent-green)' : '#f5c542',
            border: `1px solid ${source === 'supabase' ? 'rgba(34,211,165,0.2)' : 'rgba(245,197,66,0.2)'}`,
          }}>
            <Database size={12} />
            {source === 'supabase' ? 'Supabase (Live)' : 'localStorage (Fallback)'}
          </span>
          <button className="btn-ghost" onClick={fetchData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>

        <div className="stat-cards" style={{ marginBottom: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(34, 211, 165, 0.1)', padding: '16px', borderRadius: '12px', color: 'var(--accent-green)' }}>
              <Users size={28} />
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{userCount}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Unique Users</div>
            </div>
          </div>
          
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(160, 91, 255, 0.1)', padding: '16px', borderRadius: '12px', color: 'var(--accent-purple)' }}>
              <Activity size={28} />
            </div>
            <div>
              <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{logs.length}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Interactions</div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          
          {/* Daily Activity Area Chart */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--accent-purple)' }} /> Daily Activity (14 Days)
              </span>
            </div>
            {dailyActivity.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={dailyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis dataKey="displayDate" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} tickLine={false} dy={8} />
                  <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} dx={-8} />
                  <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                  <Area type="monotone" dataKey="count" name="Interactions" stroke="var(--accent-purple)" fillOpacity={1} fill="url(#colorCount)" strokeWidth={3} activeDot={{ r: 6, fill: 'var(--accent-purple)', stroke: 'var(--bg-card)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                No activity recorded in the last 14 days.
              </div>
            )}
          </div>

          {/* Feature Usage Bar Chart */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BarChart2 size={18} style={{ color: 'var(--accent-blue)' }} /> Top Used Features
              </span>
            </div>
            {featureUsage.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={featureUsage.slice(0, 5)} margin={{ top: 0, right: 30, left: 10, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={false} />
                  <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text-primary)', fontSize: 12, fontWeight: 500 }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} tickLine={false} width={100} />
                  <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} itemStyle={{ color: 'var(--text-primary)' }} />
                  <Bar dataKey="count" name="Interactions" fill="var(--accent-blue)" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                No features used yet.
              </div>
            )}
          </div>

        </div>

        {/* Enhanced Users Table */}
        {usersWithStats.length > 0 && (
          <div className="card">
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} style={{ color: 'var(--accent-green)' }} /> User Activity Leaderboard
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '16px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                    <th style={{ textAlign: 'left', padding: '16px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Channel</th>
                    <th style={{ textAlign: 'center', padding: '16px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Interactions</th>
                    <th style={{ textAlign: 'right', padding: '16px 12px', color: 'var(--text-muted)', fontWeight: 600, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithStats.slice(0, 15).map(u => (
                    <tr key={u.email} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background='var(--bg-card-hover)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                      <td style={{ padding: '14px 12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {u.picture ? <img src={u.picture} alt="" style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)' }} /> : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }} />}
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>
                        {u.channel_title ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-red)' }} />
                            {u.channel_title}
                          </div>
                        ) : '—'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{ 
                          display: 'inline-block', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                          background: u.interactionCount > 50 ? 'rgba(160, 91, 255, 0.1)' : 'var(--bg-secondary)',
                          color: u.interactionCount > 50 ? 'var(--accent-purple)' : 'var(--text-primary)'
                        }}>
                          {u.interactionCount}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {u.lastActive ? new Date(u.lastActive).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
