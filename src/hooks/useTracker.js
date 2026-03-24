import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { logFeature } from '../services/supabase';

export function useTracker(featureName) {
  const { user } = useAuth();
  const lastLogRef = useRef({ feature: null, time: 0 });
  
  useEffect(() => {
    if (!featureName || !user) return;
    
    // Debounce: ignore same feature within 10 seconds
    const now = Date.now();
    if (lastLogRef.current.feature === featureName && (now - lastLogRef.current.time) < 10000) {
      return;
    }
    
    lastLogRef.current = { feature: featureName, time: now };
    
    // Log to Supabase (fire-and-forget)
    logFeature(user.email, user.name, featureName);
    
    // Also keep localStorage as fallback
    try {
      const rawLogs = localStorage.getItem('socialiq_logs') || '[]';
      const logs = JSON.parse(rawLogs);
      logs.push({
        date: new Date().toISOString().split('T')[0],
        userEmail: user.email,
        userName: user.name,
        feature: featureName,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('socialiq_logs', JSON.stringify(logs));
    } catch (e) {
      console.error('Tracking Error:', e);
    }
  }, [featureName, user]);
}
