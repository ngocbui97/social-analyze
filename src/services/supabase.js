import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[SocialIQ] Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local');
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ─── User Operations ─────────────────────────────────

/** Upsert user on login (insert or update last_login) */
export async function upsertUser(userData) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('users')
    .upsert({
      email: userData.email,
      name: userData.name,
      picture: userData.picture,
      channel_id: userData.channelId,
      channel_title: userData.channelTitle,
      last_login: new Date().toISOString(),
    }, { onConflict: 'email' })
    .select()
    .single();

  if (error) console.error('[SocialIQ] upsertUser error:', error);
  return data;
}

/** Get total unique user count */
export async function getUserCount() {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  if (error) console.error('[SocialIQ] getUserCount error:', error);
  return count || 0;
}

/** Get all users (admin) */
export async function getAllUsers() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('last_login', { ascending: false });
  if (error) console.error('[SocialIQ] getAllUsers error:', error);
  return data || [];
}

// ─── Feature Tracking ────────────────────────────────

/** Log a feature visit */
export async function logFeature(userEmail, userName, feature) {
  if (!supabase || !userEmail) return;
  const { error } = await supabase
    .from('feature_logs')
    .insert({ user_email: userEmail, user_name: userName, feature });
  if (error) console.error('[SocialIQ] logFeature error:', error);
}

/** Get all feature logs (admin) */
export async function getFeatureLogs() {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('feature_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) console.error('[SocialIQ] getFeatureLogs error:', error);
  return data || [];
}

// ─── AI Conversations ────────────────────────────────

/** Save a single AI message */
export async function saveAIMessage(userEmail, role, content, sessionId) {
  if (!supabase || !userEmail) return;
  const { error } = await supabase
    .from('ai_conversations')
    .insert({ user_email: userEmail, role, content, session_id: sessionId });
  if (error) console.error('[SocialIQ] saveAIMessage error:', error);
}

/** Load the most recent AI conversation for a user */
export async function loadAIConversation(userEmail) {
  if (!supabase || !userEmail) return [];

  // Get latest session_id for this user
  const { data: latest, error: e1 } = await supabase
    .from('ai_conversations')
    .select('session_id')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (e1 || !latest) return [];

  // Load all messages from that session
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('*')
    .eq('user_email', userEmail)
    .eq('session_id', latest.session_id)
    .order('created_at', { ascending: true });

  if (error) console.error('[SocialIQ] loadAIConversation error:', error);
  return (data || []).map(m => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));
}

/** Clear all AI conversations for a user */
export async function clearAIConversation(userEmail) {
  if (!supabase || !userEmail) return;
  const { error } = await supabase
    .from('ai_conversations')
    .delete()
    .eq('user_email', userEmail);
  if (error) console.error('[SocialIQ] clearAIConversation error:', error);
}

// ─── Saved Competitors ───────────────────────────────

/** Load saved competitors for a user */
export async function loadCompetitors(userEmail) {
  if (!supabase || !userEmail) return [];
  const { data, error } = await supabase
    .from('saved_competitors')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false });
  if (error) console.error('[SocialIQ] loadCompetitors error:', error);
  return (data || []).map(c => ({
    id: c.channel_id,
    title: c.title,
    subscribers: c.subscribers,
    totalViews: c.total_views,
    videoCount: c.video_count,
    thumbnail: c.thumbnail,
  }));
}

/** Save a competitor for a user */
export async function saveCompetitor(userEmail, competitor) {
  if (!supabase || !userEmail) return;
  const { error } = await supabase
    .from('saved_competitors')
    .upsert({
      user_email: userEmail,
      channel_id: competitor.id,
      title: competitor.title,
      subscribers: competitor.subscribers || 0,
      total_views: competitor.totalViews || 0,
      video_count: competitor.videoCount || 0,
      thumbnail: competitor.thumbnail,
    }, { onConflict: 'user_email,channel_id' });
  if (error) console.error('[SocialIQ] saveCompetitor error:', error);
}

/** Remove a competitor for a user */
export async function removeCompetitor(userEmail, channelId) {
  if (!supabase || !userEmail) return;
  const { error } = await supabase
    .from('saved_competitors')
    .delete()
    .eq('user_email', userEmail)
    .eq('channel_id', channelId);
  if (error) console.error('[SocialIQ] removeCompetitor error:', error);
}

// ─── User Settings ───────────────────────────────────

/** Load user settings (API keys, theme) */
export async function loadUserSettings(userEmail) {
  if (!supabase || !userEmail) return null;
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_email', userEmail)
    .single();
  if (error && error.code !== 'PGRST116') {
    // PGRST116 is "No rows found" which is fine for new users
    console.error('[SocialIQ] loadUserSettings error:', error);
  }
  return data || null;
}

/** Save user settings (API keys, theme) */
export async function saveUserSettings(userEmail, settings) {
  if (!supabase || !userEmail) return;
  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_email: userEmail,
      api_key: settings.apiKey,
      theme: settings.theme,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_email' });
  if (error) console.error('[SocialIQ] saveUserSettings error:', error);
}

// ─── CRM Sponsorships ────────────────────────────────

/** Load sponsorships */
export async function loadSponsorships(userEmail) {
  if (!supabase || !userEmail) return [];
  const { data, error } = await supabase
    .from('sponsorships')
    .select('*')
    .eq('user_email', userEmail)
    .order('created_at', { ascending: false });
  if (error) console.error('[SocialIQ] loadSponsorships error:', error);
  // Map snake_case to camelCase for the frontend
  return (data || []).map(s => ({
    id: s.id,
    userEmail: s.user_email,
    brandName: s.brand_name,
    contactName: s.contact_name,
    status: s.status,
    amount: s.amount,
    notes: s.notes
  }));
}

/** Save/Upsert sponsorship */
export async function saveSponsorship(s) {
  if (!supabase || !s.userEmail || !s.id) return;
  const { error } = await supabase
    .from('sponsorships')
    .upsert({
      id: s.id,
      user_email: s.userEmail,
      brand_name: s.brandName,
      contact_name: s.contactName || '',
      status: s.status,
      amount: s.amount || 0,
      notes: s.notes || '',
      updated_at: new Date().toISOString()
    });
  if (error) console.error('[SocialIQ] saveSponsorship error:', error);
}

/** Delete sponsorship */
export async function deleteSponsorship(id) {
  if (!supabase || !id) return;
  const { error } = await supabase
    .from('sponsorships')
    .delete()
    .eq('id', id);
  if (error) console.error('[SocialIQ] deleteSponsorship error:', error);
}
