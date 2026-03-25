import { useState } from 'react';
import { Search, Bell, Moon, Sun, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';
import './Topbar.css';

export default function Topbar({ title, subtitle }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && search.trim()) {
      navigate(`/keywords?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const displayName = user?.channelTitle || user?.name || t('common.guestUser');
  const avatarSrc = user?.picture || 'https://i.pravatar.cc/32?u=guest';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title">{title}</h1>
        {subtitle && <span className="topbar-subtitle">{subtitle}</span>}
      </div>
      <div className="topbar-right">
        <div className="search-bar">
          <Search size={14} />
          <input
            type="text"
            placeholder={t('common.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
          />
          <span className="search-kbd">⌘K</span>
        </div>
        <LanguageSwitcher />

        <button className="icon-btn" id="notifications-btn" title={t('common.notifications')}>
          <Bell size={17} />
          <span className="notif-dot" />
        </button>
        <button className="icon-btn" id="theme-btn" onClick={toggleTheme} title={`${t('common.switchTo')} ${theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')} ${t('common.mode')}`}>
          {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <div className="user-menu" id="user-menu">
          <img src={avatarSrc} alt="User" className="user-avatar" />
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-plan">{user ? t('common.proPlan') : t('common.freeTrial')}</div>
          </div>
          <ChevronDown size={13} />
        </div>
      </div>
    </header>
  );
}
