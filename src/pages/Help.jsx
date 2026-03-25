import React, { useState } from 'react';
import Topbar from '../components/Topbar';
import { BookOpen, HelpCircle, MessageSquare, Server, ChevronDown, ChevronUp, Send, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Help() {
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

  const FAQS = [
    { q: t('faqs.q1'), a: t('faqs.a1') },
    { q: t('faqs.q2'), a: t('faqs.a2') },
    { q: t('faqs.q3'), a: t('faqs.a3') },
    { q: t('faqs.q4'), a: t('faqs.a4') }
  ];

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    if (!feedback.trim() || !email.trim()) return;
    
    // Simulate API call
    setSubmitStatus('sending');
    setTimeout(() => {
      setSubmitStatus('success');
      setFeedback('');
      setEmail('');
      setTimeout(() => setSubmitStatus(''), 5000);
    }, 1000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title={t('help.title')} subtitle={t('help.subtitle')} />
      <div className="page-content">
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Quick Guide */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '20px' }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} style={{ color: 'var(--accent-blue)' }} /> {t('help.quickGuide')}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>{t('help.dashboardAnalytics')}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('help.dashboardDesc')}</span>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>{t('help.keywordTrends')}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('help.keywordDesc')}</span>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>{t('help.aiAssistant')}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('help.aiDesc')}</span>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>{t('help.competitorAnalysis')}</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{t('help.competitorDesc')}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* System Status */}
              <div className="card">
                <div className="card-header" style={{ marginBottom: '16px' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={18} style={{ color: 'var(--accent-green)' }} /> {t('help.systemStatus')}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{t('help.youtubeApi')}</span>
                    <span className="badge badge-green">{t('help.operational')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{t('help.supabaseBackend')}</span>
                    <span className="badge badge-green">{t('help.operational')}</span>
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="card">
                <div className="card-header" style={{ marginBottom: '16px' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} style={{ color: 'var(--accent-purple)' }} /> {t('help.contactSupport')}
                  </span>
                </div>
                <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('help.emailAddress')}</label>
                    <input 
                      type="email" 
                      required 
                      className="input-field" 
                      placeholder="you@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      disabled={submitStatus === 'sending'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{t('help.howCanWeHelp')}</label>
                    <textarea 
                      required 
                      className="input-field" 
                      placeholder={t('help.helpPlaceholder')} 
                      rows={4}
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      style={{ resize: 'vertical' }}
                      disabled={submitStatus === 'sending'}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submitStatus === 'sending'} style={{ justifyContent: 'center', marginTop: '8px' }}>
                    {submitStatus === 'sending' ? t('help.sending') : <><Send size={14} /> {t('help.sendMessage')}</>}
                  </button>
                  {submitStatus === 'success' && (
                    <div className="animate-fade-in" style={{ fontSize: '13px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '4px' }}>
                      <CheckCircle2 size={16} /> {t('help.messageSent')}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* FAQs */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HelpCircle size={18} style={{ color: 'var(--accent-orange)' }} /> {t('help.faqs')}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {FAQS.map((faq, index) => (
                <div key={index} style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-secondary)' }}>
                  <button 
                    onClick={() => toggleFaq(index)}
                    style={{ 
                      width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                      padding: '16px', background: 'transparent', color: 'var(--text-primary)', 
                      fontSize: '14px', fontWeight: 600, textAlign: 'left'
                    }}
                  >
                    {faq.q}
                    {openFaq === index ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {openFaq === index && (
                    <div className="animate-fade-in" style={{ padding: '0 16px 16px 16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
