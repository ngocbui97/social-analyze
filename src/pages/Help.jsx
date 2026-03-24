import React, { useState } from 'react';
import Topbar from '../components/Topbar';
import { BookOpen, HelpCircle, MessageSquare, Server, ChevronDown, ChevronUp, Send, CheckCircle2 } from 'lucide-react';

const FAQS = [
  {
    q: "Why is my Dashboard or Analytics page blank?",
    a: "Ensure you have granted the correct permissions when signing in with Google. We require 'YouTube ' and 'YouTube Analytics' read-only scopes to fetch your channel data. If you denied these, please log out and sign in again, making sure to check both boxes."
  },
  {
    q: "How do I get a Gemini API Key?",
    a: "You can obtain a free Gemini API key from Google AI Studio. Go to Settings > API Integrations, click the link to generate a key, and paste it into the input field. The key is stored locally in your browser."
  },
  {
    q: "Is my data secure?",
    a: "Yes. We only request read-only access to your YouTube data. Your Gemini API key is stored securely in your browser's local storage and is never sent to our backend servers. Your feature usage logs are stored securely in Supabase for analytics purposes."
  },
  {
    q: "Can I track multiple YouTube channels?",
    a: "Currently, SocialIQ is designed to track the primary YouTube channel associated with your Google account. To track a different channel, you need to sign in with the Google account that owns or manages that specific channel."
  }
];

export default function Help() {
  const [openFaq, setOpenFaq] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [submitStatus, setSubmitStatus] = useState('');

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
      <Topbar title="Help & Support" subtitle="Guides, FAQs, and Contact Information" />
      <div className="page-content">
        <div style={{ maxWidth: '900px', margin: '0 auto', paddingBottom: '40px', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
            {/* Quick Guide */}
            <div className="card">
              <div className="card-header" style={{ marginBottom: '20px' }}>
                <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={18} style={{ color: 'var(--accent-blue)' }} /> Quick Guide
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>📊 Dashboard & Analytics</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>View your channel's top-level metrics, demographic breakdowns, and recent video performance. Only available for your own channel.</span>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>🔍 Keyword & Trends</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Research search volume estimators and find top trending videos based on specific keywords or regions.</span>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>🤖 AI Assistant</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Chat with Gemini AI to generate video ideas, script outlines, and channel growth strategies based on your real data.</span>
                </div>
                <div style={{ padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <strong style={{ display: 'block', fontSize: '13px', marginBottom: '4px', color: 'var(--text-primary)' }}>⚔️ Competitor Analysis</strong>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Search for other YouTube channels, view their public stats, and save them to your watch list for quick comparison.</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* System Status */}
              <div className="card">
                <div className="card-header" style={{ marginBottom: '16px' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Server size={18} style={{ color: 'var(--accent-green)' }} /> System Status
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>YouTube API Data</span>
                    <span className="badge badge-green">Operational</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>Supabase Backend</span>
                    <span className="badge badge-green">Operational</span>
                  </div>
                </div>
              </div>

              {/* Contact Support */}
              <div className="card">
                <div className="card-header" style={{ marginBottom: '16px' }}>
                  <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <MessageSquare size={18} style={{ color: 'var(--accent-purple)' }} /> Contact Support
                  </span>
                </div>
                <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Email Address</label>
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
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>How can we help?</label>
                    <textarea 
                      required 
                      className="input-field" 
                      placeholder="Describe your issue or feedback..." 
                      rows={4}
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      style={{ resize: 'vertical' }}
                      disabled={submitStatus === 'sending'}
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={submitStatus === 'sending'} style={{ justifyContent: 'center', marginTop: '8px' }}>
                    {submitStatus === 'sending' ? 'Sending...' : <><Send size={14} /> Send Message</>}
                  </button>
                  {submitStatus === 'success' && (
                    <div className="animate-fade-in" style={{ fontSize: '13px', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center', marginTop: '4px' }}>
                      <CheckCircle2 size={16} /> Message sent successfully! We'll be in touch.
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
                <HelpCircle size={18} style={{ color: 'var(--accent-orange)' }} /> Frequently Asked Questions
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
