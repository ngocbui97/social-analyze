import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Topbar from '../components/Topbar';
import { useTracker } from '../hooks/useTracker';
import { DollarSign, BarChart2, Briefcase, Calculator, TrendingUp } from 'lucide-react';

export default function Monetization() {
  const { t } = useTranslation();
  useTracker('Monetization');

  const [views, setViews] = useState(10000);
  const [niche, setNiche] = useState('tech');
  const [integration, setIntegration] = useState('integrated60');
  const [valuation, setValuation] = useState({ min: 0, max: 0, avg: 0 });

  const nicheCpm = {
    finance: 35,
    tech: 20,
    education: 15,
    entertainment: 10,
    gaming: 8
  };

  const integrationMultiplier = {
    integrated30: 0.7,
    integrated60: 1.0,
    dedicated: 2.5
  };

  useEffect(() => {
    // Calculate Valuation
    const baseCpm = nicheCpm[niche] || 15;
    const multi = integrationMultiplier[integration] || 1.0;
    
    const baseValue = (views / 1000) * baseCpm * multi;
    
    // Create a range (+/- 20%)
    setValuation({
      min: Math.round(baseValue * 0.8),
      avg: Math.round(baseValue),
      max: Math.round(baseValue * 1.2)
    });
  }, [views, niche, integration]);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Topbar title={t('common.monetization', 'Monetization')} subtitle={t('monetization.subtitle', 'Sponsorship Valuation Calculator')} />
      
      <div className="page-content" style={{ maxWidth: '1000px', width: '100%', margin: '0 auto' }}>
        
        <div style={{ marginBottom: '24px', padding: '20px', background: 'linear-gradient(135deg, rgba(34, 211, 165, 0.1), rgba(79, 125, 255, 0.05))', borderRadius: '12px', border: '1px solid rgba(34, 211, 165, 0.2)' }}>
          <h2 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: 'var(--text-primary)' }}>
            <DollarSign style={{ color: 'var(--accent-green)' }} /> {t('monetization.introTitle', 'Know Your Worth')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.5 }}>
            {t('monetization.introDesc', 'Use this calculator to determine a fair market value for brand sponsorships on your channel. Values are estimates based on standard industry CPMs for different niches.')}
          </p>
        </div>

        <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>
          
          {/* Inputs */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '20px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calculator size={18} style={{ color: 'var(--accent-blue)' }} /> {t('monetization.calculator', 'Valuation Inputs')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('monetization.avgViews', 'Average Views (Last 30 Days)')}
                </label>
                <div style={{ position: 'relative' }}>
                  <BarChart2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="number" 
                    value={views} 
                    onChange={(e) => setViews(Number(e.target.value))}
                    min="100"
                    style={{ width: '100%', padding: '12px 12px 12px 36px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '15px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('monetization.niche', 'Channel Niche')}
                </label>
                <select 
                  value={niche} 
                  onChange={(e) => setNiche(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer' }}
                >
                  <option value="finance">{t('monetization.nicheFinance', 'Finance & Business (High CPM)')}</option>
                  <option value="tech">{t('monetization.nicheTech', 'Technology & Software')}</option>
                  <option value="education">{t('monetization.nicheEducation', 'Education & How-to')}</option>
                  <option value="entertainment">{t('monetization.nicheEntertainment', 'Entertainment & Vlogs')}</option>
                  <option value="gaming">{t('monetization.nicheGaming', 'Gaming')}</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('monetization.integrationType', 'Integration Type')}
                </label>
                <select 
                  value={integration} 
                  onChange={(e) => setIntegration(e.target.value)}
                  style={{ width: '100%', padding: '12px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', cursor: 'pointer' }}
                >
                  <option value="integrated30">{t('monetization.int30', '30-second Integrated (Standard)')}</option>
                  <option value="integrated60">{t('monetization.int60', '60-second Integrated (Premium)')}</option>
                  <option value="dedicated">{t('monetization.intDedicated', 'Dedicated Video (Full Focus)')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'var(--accent-green)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />
            
            <div className="card-header" style={{ marginBottom: '24px' }}>
              <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingUp size={18} style={{ color: 'var(--accent-green)' }} /> {t('monetization.results', 'Estimated Value')}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', borderBottom: '1px solid var(--border)', marginBottom: '20px' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t('monetization.suggestedRate', 'Suggested Rate')}</span>
              <span style={{ fontSize: '48px', fontWeight: 800, color: 'var(--accent-green)', lineHeight: 1 }}>
                ${valuation.avg.toLocaleString()}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>USD / integration</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px', marginBottom: '32px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('monetization.minimum', 'Minimum Acceptable')}</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>${valuation.min.toLocaleString()}</div>
              </div>
              <div style={{ width: '1px', background: 'var(--border)' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('monetization.startingOffer', 'Starting Negotiation')}</div>
                <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>${valuation.max.toLocaleString()}</div>
              </div>
            </div>

            <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Briefcase size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />
              <span>
                {t('monetization.tip', 'Pro Tip: Always start negotiations slightly above your average rate. Use your audience demographics (e.g., high US viewers) to justify premium pricing.')}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
