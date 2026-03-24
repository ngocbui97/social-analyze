import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Keywords from './pages/Keywords';
import VideoAnalysis from './pages/VideoAnalysis';
import Trending from './pages/Trending';
import Competitors from './pages/Competitors';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import Admin from './pages/Admin';
import Settings from './pages/Settings';
import Help from './pages/Help';
import StudioReports from './pages/StudioReports';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import './index.css';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)',
        color: 'var(--text-secondary)', fontSize: '14px', gap: '12px'
      }}>
        <div style={{ width: 20, height: 20, border: '2px solid var(--accent-red)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading SocialIQ...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

function PlaceholderPage({ title }) {
  return (
    <div className="animate-fade-in" style={{ padding: '40px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>{title}</h1>
      <p style={{ color: 'var(--text-secondary)' }}>This page is currently under development. Stay tuned for updates!</p>
    </div>
  );
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/keywords" element={<Keywords />} />
          <Route path="/video-analysis" element={<VideoAnalysis />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/competitors" element={<Competitors />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/ai-assistant" element={<AIAssistant />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/studio-reports" element={<StudioReports />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<PublicRoute />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/*" element={
              <PrivateRoute>
                <AppLayout />
              </PrivateRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

function PublicRoute() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Login />;
}

export default App;
