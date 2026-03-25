import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'zh', label: '中文 (简体)', flag: '🇨🇳' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLanguage = languages.find(l => i18n.language.startsWith(l.code)) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="language-switcher" ref={dropdownRef} style={{ position: 'relative' }}>
      <button 
        className="icon-btn" 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border)' }}
      >
        <Globe size={16} />
        <span style={{ fontSize: '13px', fontWeight: 500 }}>{currentLanguage.flag}</span>
        <ChevronDown size={12} style={{ transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0,
          width: '180px', background: 'var(--bg-card)',
          border: '1px solid var(--border-hover)', borderRadius: '12px',
          boxShadow: 'var(--shadow-lg)', zIndex: 1000, overflow: 'hidden',
          animation: 'fadeIn 0.2s ease'
        }}>
          {languages.map((lng) => (
            <button
              key={lng.code}
              onClick={() => changeLanguage(lng.code)}
              style={{
                width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px',
                background: i18n.language.startsWith(lng.code) ? 'var(--bg-secondary)' : 'transparent',
                color: i18n.language.startsWith(lng.code) ? 'var(--accent-red)' : 'var(--text-primary)',
                border: 'none', textAlign: 'left', cursor: 'pointer', transition: 'background 0.2s',
                fontSize: '13px'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = i18n.language.startsWith(lng.code) ? 'var(--bg-secondary)' : 'transparent'}
            >
              <span>{lng.flag}</span>
              <span>{lng.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
