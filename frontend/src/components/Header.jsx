import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/useLanguage';
import { useLayout } from '../contexts/LayoutContext';
import './Header.css';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scriptoriumOpen, setScriptoriumOpen] = useState(false);
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { pageTitle, backUrl } = useLayout();
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.header-menu-container')) {
        setMenuOpen(false);
        setScriptoriumOpen(false);
        setLanguageDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (!showLogoutConfirm) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') setShowLogoutConfirm(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showLogoutConfirm]);

  const handleLogoutClick = () => {
    setMenuOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutConfirm(false);
    try {
      await api.post('/api/auth/logout', {});
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  const goTo = (path) => {
    setMenuOpen(false);
    setScriptoriumOpen(false);
    navigate(path);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Left: Home + Back */}
        <div className="header-left">
          <button
            type="button"
            className="header-icon-btn"
            onClick={() => navigate('/home')}
            title={t('home')}
            aria-label={t('home')}
          >
            <i className="fa-solid fa-house" />
          </button>
          {backUrl != null && (
            <button
              type="button"
              className="header-icon-btn"
              onClick={() => navigate(backUrl)}
              title={t('back')}
              aria-label={t('back')}
            >
              <i className="fa-solid fa-arrow-left" />
            </button>
          )}
        </div>

        {/* Center: Page title */}
        <div className="header-center">
          <h1 className="header-title">{pageTitle || '\u00A0'}</h1>
        </div>

        {/* Right: Menu dropdown */}
        <div className="header-right">
          <div className="header-menu-container">
            <button
              type="button"
              className="header-menu-trigger"
              onClick={() => {
                if (menuOpen) setLanguageDropdownOpen(false);
                setMenuOpen((o) => !o);
              }}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              data-tutorial-target="menu"
            >
              <i className="fa-solid fa-bars" />
              <span>{t('menu')}</span>
            </button>
            {menuOpen && (
              <nav className="header-dropdown" aria-label={t('menu')}>
                <ul className="header-dropdown-list">
                  <li>
                    <button type="button" className="header-dropdown-item" onClick={() => goTo('/home')}>
                      <i className="fa-solid fa-house" />
                      {t('home')}
                    </button>
                  </li>
                  <li className="header-dropdown-submenu">
                    <button
                      type="button"
                      className="header-dropdown-item header-dropdown-submenu-trigger"
                      onClick={() => setScriptoriumOpen((o) => !o)}
                      aria-expanded={scriptoriumOpen}
                    >
                      <i className="fa-solid fa-book-open" />
                      {t('scriptorium')}
                      <i className={`fa-solid fa-chevron-${scriptoriumOpen ? 'up' : 'down'}`} />
                    </button>
                    {scriptoriumOpen && (
                      <ul className="header-dropdown-sublist">
                        <li>
                          <button type="button" className="header-dropdown-subitem" onClick={() => goTo('/scriptorium')}>
                            {t('scriptorium')}
                          </button>
                        </li>
                        <li>
                          <button type="button" className="header-dropdown-subitem" onClick={() => goTo('/stories')}>
                            {t('stories')}
                          </button>
                        </li>
                        <li>
                          <button type="button" className="header-dropdown-subitem" onClick={() => goTo('/plots')}>
                            {t('plots')}
                          </button>
                        </li>
                      </ul>
                    )}
                  </li>
                  <li>
                    <button type="button" className="header-dropdown-item" onClick={() => goTo('/profile')}>
                      <i className="fa-solid fa-user" />
                      {t('myProfile')}
                    </button>
                  </li>
                  <li>
                    <button type="button" className="header-dropdown-item" disabled>
                      <i className="fa-solid fa-box-archive" />
                      {t('archive')}
                    </button>
                  </li>
                </ul>
                <div className="header-dropdown-divider" />
                <div className="header-dropdown-actions">
                  <div className="header-language-wrap">
                    <button
                      type="button"
                      className="header-dropdown-action header-language-trigger"
                      onClick={() => setLanguageDropdownOpen((o) => !o)}
                      title={t('languageLabel')}
                      aria-expanded={languageDropdownOpen}
                      aria-haspopup="true"
                    >
                      <i className="fa-solid fa-language" />
                    </button>
                    {languageDropdownOpen && (
                      <ul className="header-language-dropdown" role="menu">
                        {LANGUAGES.map(({ code, label }) => (
                          <li key={code} role="none">
                            <button
                              type="button"
                              role="menuitem"
                              className={`header-language-option ${language === code ? 'active' : ''}`}
                              onClick={() => {
                                setLanguage(code);
                                setLanguageDropdownOpen(false);
                              }}
                            >
                              {label}
                              {language === code && <i className="fa-solid fa-check" />}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    className="header-dropdown-action"
                    onClick={() => { toggleTheme(); setMenuOpen(false); }}
                    title={theme === 'dark' ? t('lightMode') : t('darkMode')}
                  >
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                </div>
                <div className="header-dropdown-divider" />
                <ul className="header-dropdown-list">
                  <li>
                    <button type="button" className="header-dropdown-item header-dropdown-item-logout" onClick={handleLogoutClick}>
                      <i className="fa-solid fa-right-from-bracket" />
                      {t('logout')}
                    </button>
                  </li>
                </ul>
              </nav>
            )}
          </div>
        </div>
      </div>

      {/* Modal confirmación cerrar sesión */}
      {showLogoutConfirm && (
        <div
          className="header-logout-modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="header-logout-modal-title"
        >
          <div className="header-logout-modal" onClick={(e) => e.stopPropagation()}>
            <p id="header-logout-modal-title" className="header-logout-modal-message">
              {t('confirmLogoutMessage')}
            </p>
            <div className="header-logout-modal-actions">
              <button type="button" className="header-logout-modal-btn header-logout-modal-cancel" onClick={() => setShowLogoutConfirm(false)}>
                {t('cancel')}
              </button>
              <button type="button" className="header-logout-modal-btn header-logout-modal-confirm" onClick={handleLogoutConfirm}>
                {t('confirmLogoutConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
