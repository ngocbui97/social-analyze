import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Search, Video, TrendingUp, Users,
  BarChart2, Settings, HelpCircle, Zap, Bell, ChevronDown, LogOut, Bot, Shield, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Search, label: 'Keyword Research', path: '/keywords' },
  { icon: Video, label: 'Video Analysis', path: '/video-analysis' },
  { icon: TrendingUp, label: 'Trending Topics', path: '/trending' },
  { icon: Bot, label: 'AI Assistant', path: '/ai-assistant' },
  { icon: Users, label: 'Competitor Analysis', path: '/competitors' },
  { icon: BarChart2, label: 'Channel Analytics', path: '/analytics' },
  { icon: FileSpreadsheet, label: 'Studio Reports', path: '/studio-reports' },
];

const bottomItems = [
  { icon: Settings, label: 'Settings', path: '/settings' },
  { icon: HelpCircle, label: 'Help & Support', path: '/help' },
];

export default function Sidebar() {
  const { user, logout, isRoot } = useAuth();

  const displayName = user?.channelTitle || user?.name || 'My Channel';
  const avatarSrc = user?.picture || 'https://i.pravatar.cc/32?img=12';

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Zap size={18} fill="currentColor" />
        </div>
        <span className="logo-text">Social<span>IQ</span></span>
      </div>

      {/* Channel Selector */}
      <div className="channel-selector">
        <div className="channel-avatar">
          <img src={avatarSrc} alt="Channel" />
          <span className="channel-live-dot" />
        </div>
        <div className="channel-info">
          <div className="channel-name">{displayName}</div>
          <div className="channel-subs">{user?.email || 'Connected'}</div>
        </div>
        <ChevronDown size={14} className="channel-chevron" />
      </div>

      {/* Notification Banner */}
      <div className="sidebar-promo">
        <Bell size={13} />
        <span>Live data connected</span>
      </div>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">MAIN MENU</div>
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
            {label === 'Keyword Research' && <span className="nav-badge">LIVE</span>}
            {label === 'AI Assistant' && <span className="nav-badge" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}>NEW</span>}
          </NavLink>
        ))}

        {/* Root User Secret Item */}
        {isRoot && (
          <NavLink
            to="/admin"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={{ marginTop: '16px', border: '1px solid rgba(255, 59, 92, 0.2)', background: 'rgba(255, 59, 92, 0.05)' }}
          >
            <Shield size={17} style={{ color: 'var(--accent-red)' }} />
            <span style={{ color: 'var(--accent-red)' }}>Root Dashboard</span>
          </NavLink>
        )}
      </nav>

      {/* Bottom Nav */}
      <div className="sidebar-bottom">
        <div className="nav-section-label">ACCOUNT</div>
        {bottomItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}

        <button
          id="logout-btn"
          className="nav-item"
          style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: 'var(--accent-red)' }}
          onClick={logout}
        >
          <LogOut size={17} />
          <span>Sign Out</span>
        </button>

        <div className="upgrade-card">
          <div className="upgrade-icon"><Zap size={14} fill="currentColor" /></div>
          <div>
            <div className="upgrade-title">Go Pro</div>
            <div className="upgrade-sub">Unlock all features</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
