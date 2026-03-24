import React, { useState, useEffect, useRef } from 'react';
import { useTracker } from '../hooks/useTracker';
import { Bot, Send, Sparkles, Wand2, History, AlertCircle, Loader } from 'lucide-react';
import Topbar from '../components/Topbar';
import { useAuth } from '../context/AuthContext';
import { getChannelStats, getRecentVideos } from '../services/youtube';
import { analyzeChannelData, chatWithAI, isAIEnabled } from '../services/ai';
import { saveAIMessage, loadAIConversation, clearAIConversation } from '../services/supabase';
import './AIAssistant.css';

export default function AIAssistant() {
  useTracker('AI Assistant');
  const { accessToken } = useAuth();
  const [provider, setProvider] = useState(() => localStorage.getItem('ai_provider') || 'default');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_api_key') || '');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [channelData, setChannelData] = useState(null);
  const [recentVideos, setRecentVideos] = useState([]);
  const sessionIdRef = useRef(Date.now().toString());
  const { user } = useAuth();
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load channel data
  useEffect(() => {
    if (!accessToken) return;
    loadData();
  }, [accessToken]);

  // Load previous AI conversation from Supabase
  useEffect(() => {
    if (!user?.email) return;
    loadAIConversation(user.email).then(msgs => {
      if (msgs.length > 0) {
        setMessages(msgs);
        // Restore session ID from the loaded conversation
        sessionIdRef.current = Date.now().toString();
      }
    });
  }, [user?.email]);

  const loadData = async () => {
    try {
      const stats = await getChannelStats(accessToken);
      const videos = await getRecentVideos(accessToken, stats.id);
      setChannelData(stats);
      setRecentVideos(videos);
    } catch (err) {
      console.error(err);
    }
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const insight = await analyzeChannelData(provider, apiKey, channelData, recentVideos);
      const newMsg = { role: 'model', parts: [{ text: insight }] };
      setMessages([newMsg]);
      // Save to Supabase
      if (user?.email) {
        sessionIdRef.current = Date.now().toString();
        saveAIMessage(user.email, 'model', insight, sessionIdRef.current);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user', parts: [{ text: userMsg }] }];
    setMessages(newMessages);
    setLoading(true);

    // Save user message to Supabase
    if (user?.email) {
      saveAIMessage(user.email, 'user', userMsg, sessionIdRef.current);
    }

    try {
      const history = messages.map(m => ({
        role: m.role,
        parts: m.parts
      }));
      const response = await chatWithAI(provider, apiKey, userMsg, channelData, recentVideos, history);
      setMessages([...newMessages, { role: 'model', parts: [{ text: response }] }]);
      // Save AI response to Supabase
      if (user?.email) {
        saveAIMessage(user.email, 'model', response, sessionIdRef.current);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!accessToken) return null;

  return (
    <div className="ai-page animate-fade-in">
      <Topbar title="AI Growth Assistant" subtitle="Your personal YouTube strategist" />
      
      <div className="page-content ai-container">
        <div className="ai-chat-layout">
          {/* Chat Section */}
          <div className="card ai-chat-card">
            <div className="chat-header">
              <div className="ai-status">
                <div className="ai-pulse" />
                <span style={{ fontWeight: 600 }}>SocialIQ AI</span>
                <span className="badge badge-purple" style={{ marginLeft: '8px' }}>Experimental</span>
              </div>
              <button className="btn-ghost" onClick={() => {
                setMessages([]);
                sessionIdRef.current = Date.now().toString();
                if (user?.email) clearAIConversation(user.email);
              }}>
                <History size={14} /> Clear Chat
              </button>
            </div>

            <div className="chat-messages">
              {messages.length === 0 ? (
                <div className="chat-empty">
                  <div className="ai-icon-large">
                    <Bot size={40} />
                  </div>
                  <h3>Welcome, {channelData?.title || 'Creator'}!</h3>
                  <p>I can help you analyze your channel performance, suggest video ideas, or craft a custom growth strategy.</p>
                  <div className="chat-suggestions">
                    <button onClick={startAnalysis} disabled={analyzing}>
                      <Wand2 size={14} /> {analyzing ? 'Analyzing...' : 'Generate Channel Strategy'}
                    </button>
                    <button onClick={() => setInput("Suggest 3 video ideas for my channel")}>
                      <Sparkles size={14} /> Suggest Video Ideas
                    </button>
                    <button onClick={() => setInput("How can I improve my CTR?")}>
                      <Sparkles size={14} /> Improve CTR Tips
                    </button>
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`message-bubble ${m.role === 'user' ? 'user' : 'bot'}`}>
                    <div className="bubble-content">
                      {m.parts[0].text.split('\n').map((line, li) => (
                        <p key={li}>{line}</p>
                      ))}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="message-bubble bot">
                  <div className="bubble-content loading">
                    <div className="dot-pulse" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
              <input 
                type="text" 
                placeholder="Ask me anything about your channel..." 
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={loading}
              />
              <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
                {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          </div>

          {/* Context Sidebar */}
          <div className="ai-context-sidebar">
            <div className="card">
              <div className="card-title" style={{ marginBottom: '16px' }}>Current Context</div>
              <div className="context-item">
                <span className="label">Channel</span>
                <span className="value">{channelData?.title || 'Loading...'}</span>
              </div>
              <div className="context-item">
                <span className="label">Reach</span>
                <span className="value">{channelData?.subscribers.toLocaleString()} subs</span>
              </div>
              <div className="context-item">
                <span className="label">Active Scope</span>
                <span className="value">youtube.readonly</span>
              </div>
              
              {error && (
                <div className="ai-error">
                  <AlertCircle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <div className="card" style={{ marginTop: '20px' }}>
              <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: 'var(--accent-purple)' }} />
                AI Personalization
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>AI Provider</label>
                <select 
                  className="input" 
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '13px', appearance: 'none' }}
                  value={provider}
                  onChange={e => {
                    setProvider(e.target.value);
                    localStorage.setItem('ai_provider', e.target.value);
                  }}
                >
                  <option value="default" style={{ background: '#1c1c28', color: '#ffffff' }}>Default App AI (Free)</option>
                  <option value="gemini" style={{ background: '#1c1c28', color: '#ffffff' }}>Google Gemini Custom</option>
                  <option value="chatgpt" style={{ background: '#1c1c28', color: '#ffffff' }}>OpenAI ChatGPT</option>
                  <option value="claude" style={{ background: '#1c1c28', color: '#ffffff' }}>Anthropic Claude</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>API Key</label>
                <input 
                  type="password" 
                  className="input" 
                  placeholder={provider === 'default' ? "Using default system API key..." : "Enter your API Key..."}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: provider === 'default' ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: '13px', opacity: provider === 'default' ? 0.6 : 1 }}
                  value={provider === 'default' ? '' : apiKey}
                  disabled={provider === 'default'}
                  onChange={e => {
                    setApiKey(e.target.value);
                    localStorage.setItem('ai_api_key', e.target.value);
                  }}
                />
              </div>
              <div style={{ padding: '8px', background: 'rgba(34, 211, 165, 0.1)', border: '1px solid rgba(34, 211, 165, 0.2)', borderRadius: '6px', marginTop: '14px' }}>
                <p style={{ fontSize: '11px', color: 'var(--accent-green)', lineHeight: 1.4, margin: 0 }}>
                  Your API key is stored securely in your browser's local storage and is never sent to our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
