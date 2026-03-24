import { useState } from 'react';
import { Search, Bell, Moon, Sun, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Topbar.css';

export default function Topbar({ title, subtitle }) {
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

  const displayName = user?.channelTitle || user?.name || 'Guest User';
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
            placeholder="Search for keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearch}
          />
          <span className="search-kbd">⌘K</span>
        </div>
        <button className="icon-btn" id="notifications-btn" title="Notifications">
          <Bell size={17} />
          <span className="notif-dot" />
        </button>
        <button className="icon-btn" id="theme-btn" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <div className="user-menu" id="user-menu">
          <img src={avatarSrc} alt="User" className="user-avatar" />
          <div className="user-info">
            <div className="user-name">{displayName}</div>
            <div className="user-plan">{user ? 'Pro Plan' : 'Free Trial'}</div>
          </div>
          <ChevronDown size={13} />
        </div>
      </div>
    </header>
  );
}
