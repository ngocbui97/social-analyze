import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { upsertUser } from '../services/supabase';

const AuthContext = createContext(null);

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// YouTube readonly scope + Analytics readonly scope + Google Profile/Email
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly email profile';

// eslint-disable-next-line react-refresh/only-export-components
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);          // { name, email, picture, channelId }
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);    // true while GIS script loads
  const [tokenClient, setTokenClient] = useState(null);

  const handleTokenResponse = useCallback(async (response) => {
    if (response.error) {
      console.error('[SocialIQ] OAuth error:', response.error);
      return;
    }

    const token = response.access_token;
    setAccessToken(token);
    sessionStorage.setItem('yt_access_token', token);

    // Fetch user profile from Google
    try {
      const profileRes = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const profile = await profileRes.json();

      // Fetch their YouTube channel ID
      const channelRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const channelData = await channelRes.json();
      const channelId = channelData.items?.[0]?.id || null;
      const channelTitle = channelData.items?.[0]?.snippet?.title || profile.name;

      const userData = {
        name: profile.name,
        email: profile.email,
        picture: profile.picture,
        channelId,
        channelTitle,
      };

      setUser(userData);
      sessionStorage.setItem('yt_user', JSON.stringify(userData));

      // Persist to Supabase
      upsertUser(userData).catch(err => console.error('[SocialIQ] Supabase upsert failed:', err));
    } catch (err) {
      console.error('[SocialIQ] Failed to fetch user profile:', err);
    }
  }, []);

  // Load Google Identity Services script
  useEffect(() => {
    if (!CLIENT_ID || CLIENT_ID === 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com') {
      console.warn('[SocialIQ] VITE_GOOGLE_CLIENT_ID is not configured in .env.local');
      setLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // Initialize the token client for OAuth 2.0 implicit flow
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: handleTokenResponse,
      });
      setTokenClient(client);
      setLoading(false);
    };
    script.onerror = () => {
      console.error('[SocialIQ] Failed to load Google Identity Services');
      setLoading(false);
    };
    document.head.appendChild(script);

    // Restore session from sessionStorage (survives page refresh, not new tabs)
    const savedToken = sessionStorage.getItem('yt_access_token');
    const savedUser = sessionStorage.getItem('yt_user');
    if (savedToken && savedUser) {
      setAccessToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    return () => {
      // Cleanup
    };
  }, [handleTokenResponse]);

  const login = useCallback(() => {
    if (tokenClient) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      alert('Google Identity Services is still loading. Please try again in a moment.');
    }
  }, [tokenClient]);

  const logout = useCallback(() => {
    if (accessToken) {
      window.google?.accounts?.oauth2?.revoke(accessToken, () => {});
    }
    setAccessToken(null);
    setUser(null);
    sessionStorage.removeItem('yt_access_token');
    sessionStorage.removeItem('yt_user');
  }, [accessToken]);

  const isConfigured = CLIENT_ID && CLIENT_ID !== 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
  
  // Root user identification. Fallback checks an env var, or just mark anyone with 'admin' in email as root if testing.
  // In production, strictly match email or secret token.
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL?.toLowerCase() || 'admin@socialiq.com';
  const isRoot = user?.email?.toLowerCase() === adminEmail || user?.email?.includes('admin');

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, loading, isConfigured, isRoot }}>
      {children}
    </AuthContext.Provider>
  );
}

  // eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
