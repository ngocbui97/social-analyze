import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Topbar from '../components/Topbar';
import { useTracker } from '../hooks/useTracker';
import { Check, Info, Zap, ChevronDown, ChevronUp } from 'lucide-react';

export default function Pricing() {
  const { t } = useTranslation();
  useTracker('Pricing');

  const [isAnnual, setIsAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const basicFeatures = [
    t('pricing.featBasic1', 'Basic Channel Analytics'),
    t('pricing.featBasic2', 'Limited Keyword Searches (5/day)'),
    t('pricing.featBasic3', 'Standard Video Analysis'),
    t('pricing.featBasic4', 'Up to 2 Competitor Tracking'),
  ];

  const proFeatures = [
    t('pricing.featPro1', 'Unlimited Keyword Research'),
    t('pricing.featPro2', 'Advanced AI Script & Hook Optimizer'),
    t('pricing.featPro3', 'Full Competitor Intelligence'),
    t('pricing.featPro4', 'Studio Reports (Data Export Analysis)'),
    t('pricing.featPro5', 'Priority AI Processing'),
  ];

  const faqs = [
    { q: t('pricing.faq1Q', 'Can I cancel my subscription at any time?'), a: t('pricing.faq1A', 'Yes, you can cancel your subscription at any time from your account settings. You will retain Pro access until the end of your billing cycle.') },
    { q: t('pricing.faq2Q', 'Is my payment information secure?'), a: t('pricing.faq2A', 'Absolutely. We use Stripe, a bank-level security payment processor, to handle all transactions. We do not store your credit card information.') },
    { q: t('pricing.faq3Q', 'Do you offer refunds?'), a: t('pricing.faq3A', 'We offer a 7-day money-back guarantee if you are not satisfied with the Pro features. Just contact our support team.') },
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <Topbar title={t('pricing.title', 'Upgrade to Pro')} subtitle={t('pricing.subtitle', 'Supercharge your YouTube growth with advanced analytics and AI')} />
      
      <div className="page-content" style={{ maxWidth: '1000px', width: '100%', margin: '0 auto', padding: '40px 24px' }}>
        
        {/* Toggle Billing */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', padding: '6px', borderRadius: '40px', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setIsAnnual(false)}
              style={{
                padding: '8px 24px', borderRadius: '30px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                background: !isAnnual ? 'var(--bg-card)' : 'transparent',
                color: !isAnnual ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: !isAnnual ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {t('pricing.monthly', 'Monthly')}
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              style={{
                padding: '8px 24px', borderRadius: '30px', border: 'none', fontSize: '14px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px',
                background: isAnnual ? 'var(--bg-card)' : 'transparent',
                color: isAnnual ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: isAnnual ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              {t('pricing.yearly', 'Yearly')} <span style={{ background: 'var(--accent-green-dim)', color: 'var(--accent-green)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px', textTransform: 'uppercase' }}>{t('pricing.save20', 'Save 20%')}</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid-2-lg" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '32px', marginBottom: '64px', alignItems: 'stretch' }}>
          
          {/* Basic Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', marginBottom: '8px' }}>{t('pricing.freePlan', 'Basic')}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', minHeight: '42px' }}>{t('pricing.freeDesc', 'Perfect for getting started and understanding your baseline.')}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '32px' }}>
              <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>{t('pricing.freePrice', '$0')}</span>
            </div>
            
            <button className="btn btn-ghost" style={{ width: '100%', marginBottom: '32px', border: '1px solid var(--border)' }} disabled>
              {t('pricing.currentPlan', 'Current Plan')}
            </button>

            <div style={{ flex: 1 }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {basicFeatures.map((feat, idx) => (
                  <li key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.4 }}>
                    <Check size={16} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Pro Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg, rgba(155, 89, 245, 0.05) 0%, rgba(34, 40, 49, 0) 100%)', border: '2px solid var(--accent-purple)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, padding: '6px 24px', background: 'var(--accent-purple)', color: '#fff', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', transform: 'rotate(45deg) translate(30px, -20px)', letterSpacing: '1px' }}>PRO</div>
            
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Zap style={{ color: 'var(--accent-purple)' }} /> {t('pricing.proPlan', 'Creator Pro')}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', minHeight: '42px' }}>{t('pricing.proDesc', 'Everything you need to scale your channel and dominate your niche.')}</p>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                {isAnnual ? t('pricing.proPriceYearly', '$12') : t('pricing.proPriceMonthly', '$15')}
              </span>
              <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>{t('pricing.perMonth', '/ month')}</span>
            </div>
            
            <div style={{ minHeight: '20px', marginBottom: '32px' }}>
              {isAnnual && (
                <span style={{ fontSize: '13px', color: 'var(--accent-green)' }}>{t('pricing.billedAnnually', 'Billed $144 annually')}</span>
              )}
            </div>
            
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '32px', background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))', border: 'none', padding: '12px' }}>
              {t('pricing.upgradeNow', 'Upgrade Now')}
            </button>

            <div style={{ flex: 1 }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {basicFeatures.map((feat, idx) => (
                  <li key={`b-${idx}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.4 }}>
                    <Check size={16} style={{ color: 'var(--accent-green)', flexShrink: 0, marginTop: '2px' }} />
                    <span>{feat}</span>
                  </li>
                ))}
                {proFeatures.map((feat, idx) => (
                  <li key={`p-${idx}`} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.4 }}>
                    <Check size={16} style={{ color: 'var(--accent-purple)', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontWeight: 600 }}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>

        {/* FAQ Section */}
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '24px', textAlign: 'center', marginBottom: '32px', color: 'var(--text-primary)' }}>
            {t('pricing.faqTitle', 'Frequently Asked Questions')}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, index) => (
              <div key={index} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <button 
                  onClick={() => toggleFaq(index)}
                  style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', fontSize: '16px', fontWeight: 600, textAlign: 'left' }}
                >
                  {faq.q}
                  {openFaq === index ? <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={20} style={{ color: 'var(--text-muted)' }} />}
                </button>
                {openFaq === index && (
                  <div style={{ padding: '0 20px 20px 20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6 }}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
