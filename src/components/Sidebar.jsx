import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard, Search, Video, TrendingUp, Users,
  BarChart2, Settings, HelpCircle, Zap, Bell, ChevronDown, LogOut, Bot, Shield, FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { t } = useTranslation();
  const { user, logout, isRoot } = useAuth();

  const navItems = [
    { icon: LayoutDashboard, label: t('common.dashboard'), path: '/dashboard' },
    { icon: Search, label: t('common.keywords'), path: '/keywords' },
    { icon: Video, label: t('common.videoAnalysis'), path: '/video-analysis' },
    { icon: TrendingUp, label: t('common.trending'), path: '/trending' },
    { icon: Bot, label: t('common.aiAssistant'), path: '/ai-assistant' },
    { icon: Users, label: t('common.competitors'), path: '/competitors' },
    { icon: BarChart2, label: t('common.analytics'), path: '/analytics' },
    { icon: FileSpreadsheet, label: t('common.studioReports'), path: '/studio-reports' },
  ];

  const bottomItems = [
    { icon: Settings, label: t('common.settings'), path: '/settings' },
    { icon: HelpCircle, label: t('common.help'), path: '/help' },
  ];

  const displayName = user?.channelTitle || user?.name || t('common.myChannel');
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
        <span>{t('common.liveConnected')}</span>
      </div>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">{t('common.mainMenu')}</div>
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={17} />
            <span>{label}</span>
            {path === '/keywords' && <span className="nav-badge">LIVE</span>}
            {path === '/ai-assistant' && <span className="nav-badge" style={{ background: 'var(--accent-purple-dim)', color: 'var(--accent-purple)' }}>NEW</span>}
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
            <span style={{ color: 'var(--accent-red)' }}>{t('common.rootDashboard')}</span>
          </NavLink>
        )}
      </nav>

      {/* Bottom Nav */}
      <div className="sidebar-bottom">
        <div className="nav-section-label">{t('common.account')}</div>
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
          <span>{t('common.logout')}</span>
        </button>

        <div className="upgrade-card">
          <div className="upgrade-icon"><Zap size={14} fill="currentColor" /></div>
          <div>
            <div className="upgrade-title">{t('common.goPro')}</div>
            <div className="upgrade-sub">{t('common.unlockFeatures')}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
