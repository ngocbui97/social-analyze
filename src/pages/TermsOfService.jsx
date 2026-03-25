import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function TermsOfService() {
  const { t } = useTranslation();
  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)', lineHeight: '1.6', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', right: '20px' }}>
        <LanguageSwitcher />
      </div>

      <h1>{t('terms.title')}</h1>
      <p>{t('terms.lastUpdated')}</p>

      <section>
        <h2>{t('terms.acceptance')}</h2>
        <p>{t('terms.acceptanceDesc')}</p>
      </section>

      <section>
        <h2>{t('terms.license')}</h2>
        <p>{t('terms.licenseDesc')}</p>
      </section>

      <section>
        <h2>{t('terms.disclaimer')}</h2>
        <p>{t('terms.disclaimerDesc')}</p>
      </section>

      <section>
        <h2>{t('terms.limitations')}</h2>
        <p>{t('terms.limitationsDesc')}</p>
      </section>

      <section>
        <h2>{t('terms.law')}</h2>
        <p>{t('terms.lawDesc')}</p>
      </section>

      <div style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid var(--border)' }}>
        <a href="/login" style={{ color: 'var(--accent-red)', textDecoration: 'none' }}>← {t('privacy.back')}</a>
      </div>
    </div>
  );
}
