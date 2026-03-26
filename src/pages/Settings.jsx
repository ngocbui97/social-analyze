import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { saveUserSettings, loadUserSettings } from '../services/supabase';
import Topbar from '../components/Topbar';
import { Key, Moon, Sun, Monitor, Trash2, User, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [apiKey, setApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [clearStatus, setClearStatus] = useState('');

  useEffect(() => {
    // Load existing key on mount
    const savedKey = localStorage.getItem('ai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
    
    // Sync from Supabase if logged in
    if (user?.email) {
      loadUserSettings(user.email).then(settings => {
        if (settings?.api_key) {
          setApiKey(settings.api_key);
          localStorage.setItem('ai_api_key', settings.api_key);
        }
      });
    }
  }, [user]);

  const handleSaveKey = async () => {
    if (!apiKey.trim()) return;
    localStorage.setItem('ai_api_key', apiKey.trim());
    
    if (user?.email) {
      await saveUserSettings(user.email, { apiKey: apiKey.trim(), theme });
    }
    
    setSaveStatus(t('settings.savedSuccess'));
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleClearKey = async () => {
    localStorage.removeItem('ai_api_key');
    setApiKey('');
    
    if (user?.email) {
      await saveUserSettings(user.email, { apiKey: null, theme });
    }
    
    setSaveStatus(t('settings.keyRemoved'));
    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleClearData = () => {
    if (window.confirm(t('settings.confirmClear'))) {
      localStorage.removeItem('socialiq_logs');
      setClearStatus(t('settings.dataCleared'));
      setTimeout(() => setClearStatus(''), 3000);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title={t('settings.title')} subtitle={t('settings.subtitle')} />
      <div className="page-content">
        <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '40px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Profile Section */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '24px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} style={{ color: 'var(--accent-blue)' }} /> {t('settings.profileInfo')}
              </span>
            </div>
            {user ? (
              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <img src={user.picture} alt="Avatar" style={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid var(--border)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{t('settings.name')}</span>
                    <span style={{ fontSize: '18px', fontWeight: 600 }}>{user.name}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>{t('settings.email')}</span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{user.email}</span>
                  </div>
                </div>
                {user.channelTitle && (
                  <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)', flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>{t('settings.connectedChannel')}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-red)' }} />
                      {user.channelTitle}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t('settings.signInPrompt')}
              </div>
            )}
          </div>

          {/* API Integrations */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Key size={18} style={{ color: 'var(--accent-purple)' }} /> {t('settings.apiIntegrations')}
              </span>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>
                {t('settings.geminiKey')}
              </label>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {t('settings.geminiKeyDesc')}
              </p>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder={t('settings.pasteKey')}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  style={{ flex: 1, fontFamily: 'monospace' }}
                />
                <button className="btn btn-primary" onClick={handleSaveKey} disabled={!apiKey} style={{ flexShrink: 0 }}>
                  {t('settings.saveKey')}
                </button>
                <button className="btn btn-secondary" onClick={handleClearKey} disabled={!apiKey} style={{ flexShrink: 0, color: 'var(--accent-red)' }}>
                  {t('settings.remove')}
                </button>
              </div>
              
              {saveStatus && (
                <div className="animate-fade-in" style={{ marginTop: '12px', fontSize: '13px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle2 size={16} /> {saveStatus}
                </div>
              )}
            </div>
            
            <div style={{ padding: '12px', background: 'rgba(79, 125, 255, 0.1)', borderRadius: '8px', border: '1px solid rgba(79, 125, 255, 0.2)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <HelpCircle size={18} style={{ color: 'var(--accent-blue)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary)', marginBottom: '4px' }}>{t('settings.howToGet')}</strong>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <Trans i18nKey="settings.howToGetDesc">
                    You can get a free API key from Google AI Studio. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>Click here to generate one</a>.
                  </Trans>
                </span>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Monitor size={18} style={{ color: 'var(--accent-green)' }} /> {t('settings.appearance')}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px' }}>{t('settings.themePreference')}</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t('settings.themeDesc')}</span>
              </div>
              <button 
                onClick={toggleTheme}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px', 
                  padding: '8px 16px', borderRadius: '100px', 
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px'
                }}
              >
                {theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
                {theme === 'dark' ? t('settings.darkMode') : t('settings.lightMode')}
              </button>
            </div>
          </div>

          {/* Data Management */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)' }}>
                <Trash2 size={18} /> {t('settings.dataManagement')}
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255, 59, 92, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 59, 92, 0.15)' }}>
              <div>
                <strong style={{ display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>{t('settings.clearData')}</strong>
                <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{t('settings.clearDataDesc')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                <button 
                  onClick={handleClearData}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', 
                    background: 'var(--accent-red-dim)', border: '1px solid rgba(255,59,92,0.3)',
                    color: 'var(--accent-red)', fontWeight: 600, fontSize: '13px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 59, 92, 0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-red-dim)'}
                >
                  {t('settings.clearBtn')}
                </button>
                {clearStatus && <span className="animate-fade-in" style={{ fontSize: '12px', color: 'var(--accent-green)' }}>{clearStatus}</span>}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
