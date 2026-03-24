import React from 'react';

export default function TermsOfService() {
  return (
    <div style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-primary)', lineHeight: '1.6' }}>
      <h1>Terms of Service</h1>
      <p>Last Updated: March 24, 2026</p>

      <section>
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing SocialIQ Analyze, you agree to be bound by these Terms of Service and all applicable laws and regulations.</p>
      </section>

      <section>
        <h2>2. Use License</h2>
        <p>Permission is granted to use SocialIQ Analyze for personal or commercial YouTube channel management. You may not attempt to decompile or reverse engineer any software contained on the website.</p>
      </section>

      <section>
        <h2>3. Disclaimer</h2>
        <p>The materials on SocialIQ Analyze are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability.</p>
      </section>

      <section>
        <h2>4. Limitations</h2>
        <p>In no event shall SocialIQ Analyze or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit) arising out of the use or inability to use the tools.</p>
      </section>

      <section>
        <h2>5. Governing Law</h2>
        <p>These terms and conditions are governed by and construed in accordance with the laws of your jurisdiction.</p>
      </section>

      <div style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid var(--border)' }}>
        <a href="/login" style={{ color: 'var(--accent-red)', textDecoration: 'none' }}>← Back to Login</a>
      </div>
    </div>
  );
}
