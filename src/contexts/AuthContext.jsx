import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active web session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Supabase session fetch error:', error.message);
      }
      setUser(session?.user || null);
      setLoading(false);
    }).catch(err => {
      console.warn('Failed to connect to Supabase (likely missing credentials). Running in fallback mode.');
      setLoading(false);
      // Fallback for local testing without Supabase credentials
      const localAuth = localStorage.getItem('isAuthenticated') === 'true';
      if (localAuth) {
        setUser({ id: 'local-user', email: 'creator@example.com', user_metadata: { full_name: 'Local Creator' } });
      }
    });

    // Listen to Supabase auth events
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        localStorage.setItem('isAuthenticated', 'true');
      } else {
        localStorage.removeItem('isAuthenticated');
      }
    });

    return () => {
      if (listener && listener.subscription) {
        listener.subscription.unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        console.log('No Supabase URL found, simulating login for local dev.');
        localStorage.setItem('isAuthenticated', 'true');
        setUser({ id: 'local-user', email: 'creator@example.com', user_metadata: { full_name: 'Local Creator' } });
        return;
      }
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error("Error logging in:", error.message);
      alert('Error connecting to authentication server. Check console.');
    }
  };

  const signOut = async () => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) {
        localStorage.removeItem('isAuthenticated');
        setUser(null);
        return;
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Also clear local fallback
      localStorage.removeItem('isAuthenticated');
      setUser(null);
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signInWithGoogle, signOut, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
