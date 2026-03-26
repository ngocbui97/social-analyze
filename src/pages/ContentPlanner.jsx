import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Topbar from '../components/Topbar';
import { useTracker } from '../hooks/useTracker';
import { Wand2, RefreshCw, AlertCircle, Copy, Edit3, MessageSquare, PlusCircle } from 'lucide-react';
import { generateHooks, generateDescription } from '../services/ai';
import { useAuth } from '../context/AuthContext';

export default function ContentPlanner() {
  const { t } = useTranslation();
  useTracker('Content Planner');
  
  const [activeTab, setActiveTab] = useState('hooks'); // 'hooks' or 'description'
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError(t('contentPlanner.emptyInput', 'Please enter your script or outline.'));
      return;
    }
    
    setLoading(true);
    setError(null);
    setOutputText('');
    
    try {
      const apiKey = localStorage.getItem('ai_api_key');
      let result = '';
      if (activeTab === 'hooks') {
        result = await generateHooks(apiKey, inputText);
      } else {
        result = await generateDescription(apiKey, inputText);
      }
      setOutputText(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText).catch(() => {});
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title={t('common.contentPlanner', 'Content Planner')} subtitle={t('contentPlanner.subtitle', 'Optimize Hooks and Generate Descriptions with AI')} />
      
      <div className="page-content" style={{ maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', width: 'fit-content' }}>
          <button 
            onClick={() => { setActiveTab('hooks'); setOutputText(''); setError(null); }}
            style={{ 
              padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, border: 'none',
              background: activeTab === 'hooks' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'hooks' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'hooks' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <Edit3 size={16} /> {t('contentPlanner.tabHooks', 'Hook Optimizer')}
          </button>
          <button 
            onClick={() => { setActiveTab('description'); setOutputText(''); setError(null); }}
            style={{ 
              padding: '8px 16px', borderRadius: '6px', fontSize: '14px', fontWeight: 600, border: 'none',
              background: activeTab === 'description' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'description' ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'description' ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
              cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <MessageSquare size={16} /> {t('contentPlanner.tabDescription', 'Description Generator')}
          </button>
        </div>

        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
          
          {/* Input Area */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px' }}>
            <div className="card-header" style={{ marginBottom: '16px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-blue)' }}>
                {activeTab === 'hooks' ? <Edit3 size={18} /> : <MessageSquare size={18} />}
                {activeTab === 'hooks' ? t('contentPlanner.inputHooksTitle', 'Your Video Script / Outline') : t('contentPlanner.inputDescTitle', 'Your Video Transcript / Script')}
              </span>
            </div>
            
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              {activeTab === 'hooks' 
                ? t('contentPlanner.inputHooksDesc', 'Paste your script outline here. AI will analyze it and generate 3 compelling opening hooks to boost retention.')
                : t('contentPlanner.inputDescDesc', 'Paste your full script or transcript. AI will generate an SEO-optimized description with timestamps and keywords.')}
            </p>

            <textarea
              className="input-field"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t('contentPlanner.inputPlaceholder', 'Write or paste your content here...')}
              style={{ flex: 1, minHeight: '300px', resize: 'vertical', padding: '16px', fontSize: '14px', lineHeight: 1.6, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)' }}
            />

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                className="btn btn-primary" 
                onClick={handleGenerate} 
                disabled={loading || !inputText.trim()}
                style={{ background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', border: 'none', padding: '10px 20px' }}
              >
                {loading ? <><RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> {t('common.processing', 'Processing...')}</> : <><Wand2 size={16} /> {t('common.generate', 'Generate')}</>}
              </button>
            </div>
            
            {error && (
              <div style={{ marginTop: '16px', padding: '12px', background: 'var(--accent-red-dim)', borderRadius: '8px', border: '1px solid rgba(255,59,92,0.3)', color: 'var(--accent-red)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>

          {/* Output Area */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px', background: outputText ? 'var(--bg-card)' : 'var(--bg-secondary)', border: outputText ? '1px solid var(--accent-purple)' : '1px dashed var(--border)' }}>
            <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-purple)' }}>
                <Wand2 size={18} /> {t('contentPlanner.outputTitle', 'AI Generated Result')}
              </span>
              {outputText && (
                <button className="btn btn-ghost" onClick={copyToClipboard} style={{ padding: '6px 12px', fontSize: '13px' }}>
                  <Copy size={14} /> {t('common.copy', 'Copy')}
                </button>
              )}
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-secondary)' }}>
                <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '16px', color: 'var(--accent-purple)' }} />
                <p>{t('contentPlanner.generating', 'Analyzing your content and generating AI magic...')}</p>
              </div>
            ) : outputText ? (
              <div style={{ 
                flex: 1, overflowY: 'auto', padding: '16px', borderRadius: '8px', 
                background: 'rgba(155, 89, 245, 0.03)', color: 'var(--text-primary)', 
                fontSize: '14px', lineHeight: 1.6 
              }}>
                {outputText.split('\n').map((line, i) => {
                  if (line.trim().startsWith('###')) {
                    return <h3 key={i} style={{ color: 'var(--accent-purple)', marginTop: '20px', marginBottom: '8px', fontSize: '16px' }}>{line.replace(/###\s*/, '')}</h3>;
                  }
                  if (line.trim().startsWith('**')) {
                    const parts = line.split('**');
                    return <p key={i} style={{ marginBottom: '8px' }}>{parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} style={{color: 'var(--accent-blue)'}}>{part}</strong> : part)}</p>;
                  }
                  if (line.trim() === '') return <br key={i} />;
                  return <p key={i} style={{ marginBottom: '8px' }}>{line}</p>;
                })}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)' }}>
                <PlusCircle size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
                <p style={{ textAlign: 'center', maxWidth: '300px' }}>
                  {activeTab === 'hooks' 
                    ? t('contentPlanner.emptyOutputHooks', 'Enter your script on the left and click Generate to see 3 high-retention hook variations here.')
                    : t('contentPlanner.emptyOutputDesc', 'Enter your transcript on the left to get a fully optimized, ready-to-paste video description.')}
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
