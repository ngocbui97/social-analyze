import { useAuth } from '../context/AuthContext';
import { Zap, Youtube, Shield, BarChart2, Search, TrendingUp, AlertTriangle } from 'lucide-react';
import './Login.css';

const features = [
  { icon: BarChart2, label: 'Real Channel Analytics', desc: 'Live stats from your YouTube channel' },
  { icon: Search, label: 'Keyword Research', desc: 'Find high-traffic, low-competition terms' },
  { icon: TrendingUp, label: 'Competitor Tracking', desc: 'Benchmark against top creators' },
];

export default function Login() {
  const { login, loading, isConfigured } = useAuth();

  return (
    <div className="login-page">
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

        <h1 className="login-title">Grow Your Channel Faster</h1>
        <p className="login-subtitle">
          Connect your YouTube account to unlock real analytics,<br />
          keyword insights, and competitor tracking.
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
              <strong>VITE_GOOGLE_CLIENT_ID</strong> is not set in <code>.env.local</code>.
              Please add your Google OAuth Client ID to enable login.
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
          {loading ? 'Loading...' : 'Sign in with Google'}
        </button>

        {/* Privacy note */}
        <div className="login-privacy">
          <Shield size={12} />
          We only request <strong>read-only</strong> access. We never post to your channel.
        </div>

        {/* Scope list */}
        <div className="login-scopes">
          <div className="scope-item">✓ View your YouTube account</div>
          <div className="scope-item">✓ Read channel statistics</div>
          <div className="scope-item">✓ Search YouTube content</div>
        </div>

        <div style={{ marginTop: '24px', display: 'flex', gap: '16px', justifyContent: 'center', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <a href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>Privacy Policy</a>
          <a href="/terms" style={{ color: 'inherit', textDecoration: 'none' }} onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}>Terms of Service</a>
        </div>
      </div>
    </div>
  );
}
