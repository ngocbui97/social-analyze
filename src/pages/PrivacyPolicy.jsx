import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './Login.css'; // Reuse some basic styles or use new ones

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)', lineHeight: '1.6', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', right: '20px' }}>
        <LanguageSwitcher />
      </div>
      
      <h1>{t('privacy.title')}</h1>
      <p>{t('privacy.lastUpdated')}</p>

      <section>
        <h2>{t('privacy.introduction')}</h2>
        <p>{t('privacy.introDesc')}</p>
      </section>

      <section>
        <h2>{t('privacy.dataCollection')}</h2>
        <p>{t('privacy.dataCollectionDesc')}</p>
      </section>

      <section>
        <h2>{t('privacy.dataUsage')}</h2>
        <p>{t('privacy.dataUsageDesc')}</p>
      </section>

      <section>
        <h2>{t('privacy.security')}</h2>
        <p>{t('privacy.securityDesc')}</p>
      </section>

      <section>
        <h2>{t('privacy.rights')}</h2>
        <p>{t('privacy.rightsDesc')}</p>
      </section>

      <div style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid var(--border)' }}>
        <a href="/login" style={{ color: 'var(--accent-red)', textDecoration: 'none' }}>← {t('privacy.back')}</a>
      </div>
    </div>
  );
}
