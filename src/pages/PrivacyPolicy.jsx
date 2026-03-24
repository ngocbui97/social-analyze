import React from 'react';
import './Login.css'; // Reuse some basic styles or use new ones

export default function PrivacyPolicy() {
  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)', lineHeight: '1.6' }}>
      <h1>Privacy Policy for SocialIQ Analyze</h1>
      <p>Last Updated: March 24, 2026</p>

      <section>
        <h2>1. Introduction</h2>
        <p>SocialIQ Analyze ("we", "us", or "our") respects your privacy and is committed to protecting your personal data. This privacy policy informs you about how we handle your data when you visit our website and use our YouTube analytics tools.</p>
      </section>

      <section>
        <h2>2. Data We Collect</h2>
        <p>We use Google OAuth to authenticate you. We request access to:</p>
        <ul>
          <li>Your Google Account email and basic profile info.</li>
          <li>Read-only access to your YouTube channel statistics and content.</li>
        </ul>
        <p>We do <strong>not</strong> store your YouTube data on our servers. All analysis is performed in real-time or stored locally in your browser/database for your personal use only.</p>
      </section>

      <section>
        <h2>3. How We Use Your Data</h2>
        <p>We use the data to provide insights into your YouTube performance, keyword research, and competitor analysis. We also use your data to power our AI Assistant (via Google Gemini) for personalized growth advice.</p>
      </section>

      <section>
        <h2>4. Data Security</h2>
        <p>Your Google access tokens are handled securely and are never shared with third parties, except for the necessary communication with Google APIs and Gemini AI APIs.</p>
      </section>

      <section>
        <h2>5. Your Rights</h2>
        <p>You can revoke our access to your Google account at any time through your Google Security settings.</p>
      </section>

      <div style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid var(--border)' }}>
        <a href="/login" style={{ color: 'var(--accent-red)', textDecoration: 'none' }}>← Back to Login</a>
      </div>
    </div>
  );
}
