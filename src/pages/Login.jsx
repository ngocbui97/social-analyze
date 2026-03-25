import { useAuth } from '../context/AuthContext';
import { Zap, Youtube, Shield, BarChart2, Search, TrendingUp, AlertTriangle } from 'lucide-react';
import { useTranslation, Trans } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Login.css';

export default function Login() {
  const { t } = useTranslation();
  const { login, loading, isConfigured } = useAuth();

  const features = [
    { icon: BarChart2, label: t('login.feature1Label'), desc: t('login.feature1Desc') },
    { icon: Search, label: t('login.feature2Label'), desc: t('login.feature2Desc') },
    { icon: TrendingUp, label: t('login.feature3Label'), desc: t('login.feature3Desc') },
  ];

  return (
    <div className="login-page">
      {/* Language Switcher for Login Page */}
      <div style={{ position: 'absolute', top: '24px', right: '24px', zIndex: 100 }}>
        <LanguageSwitcher />
      </div>
      {/* Background orbs */}
      <div className="login-orb login-orb--1" />
      <div className="login-orb login-orb--2" />
      <div className="login-orb login-orb--3" />

      <div className="login-card animate-fade-in">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <Zap size={22} fill="currentColor" />
          </div>
          <span className="login-logo-text">Social<span>IQ</span></span>
        </div>

        <h1 className="login-title">{t('login.title')}</h1>
        <p className="login-subtitle">
          <Trans i18nKey="login.subtitle">
            Connect your YouTube account to unlock real analytics,<br />
            keyword insights, and competitor tracking.
          </Trans>
        </p>

        {/* Feature list */}
        <div className="login-features">
          {features.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="login-feature">
              <div className="login-feature-icon">
                <Icon size={15} />
              </div>
              <div>
                <div className="login-feature-label">{label}</div>
                <div className="login-feature-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sign in button */}
        {!isConfigured && (
          <div className="login-warning">
            <AlertTriangle size={14} />
            <span>
              <Trans i18nKey="login.noClientId">
                <strong>VITE_GOOGLE_CLIENT_ID</strong> is not set in <code>.env.local</code>.
                Please add your Google OAuth Client ID to enable login.
              </Trans>
            </span>
          </div>
        )}

        <button
          id="google-signin-btn"
          className="login-google-btn"
          onClick={login}
          disabled={loading || !isConfigured}
        >
          <Youtube size={18} fill="#ff3b5c" />
          {loading ? t('login.loading') : t('common.login')}
        </button>

        {/* Privacy note */}
        <div className="login-privacy">
          <Shield size={12} />
          <Trans i18nKey="login.privacyNote">
            We only request <strong>read-only</strong> access. We never post to your channel.
          </Trans>
        </div>

        {/* Scope list */}
        <div className="login-scopes">
          <div className="scope-item">✓ {t('login.scope1')}</div>
          <div className="scope-item">✓ {t('login.scope2')}</div>
          <div className="scope-item">✓ {t('login.scope3')}</div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>{t('login.privacyPolicy')}</a>
          <a href="/terms" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>{t('login.termsOfService')}</a>
        </div>
      </div>
    </div>
  );
}
