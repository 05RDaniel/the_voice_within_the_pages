import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../components/Header.css';
import './Login.css';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

function Login() {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const showVerificationComplete = location.state?.verificationComplete === true;

  useEffect(() => {
    if (!languageDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (!e.target.closest('.login-language-wrap')) setLanguageDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [languageDropdownOpen]);

  const translateError = (errorMsg) => {
    const errorMap = {
      'Credenciales inválidas': 'invalidCredentials',
      'Usuario/Email y contraseña son requeridos': 'allFieldsRequired',
      'Debes verificar tu correo electrónico para acceder': 'emailNotVerified',
    };
    return errorMap[errorMsg] ? t(errorMap[errorMsg]) : errorMsg;
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setShowResendVerification(false);
    setResendMessage('');
    setLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403 && data.code === 'EMAIL_NOT_VERIFIED') {
          setError(translateError(data.error));
          setShowResendVerification(true);
          const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.usernameOrEmail);
          if (isEmail) setResendEmail(formData.usernameOrEmail);
        } else {
          setError(translateError(data.error || data.message) || t('loginError'));
        }
        return;
      }
      navigate('/home');
    } catch (err) {
      setError(t('loginError'));
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async (e) => {
    e.preventDefault();
    setResendMessage('');
    setResendLoading(true);
    try {
      const data = await api.post('/api/auth/resend-verification', { email: resendEmail });
      if (data.error) {
        setResendMessage(data.error);
      } else {
        setResendMessage(t('verificationEmailSent'));
      }
    } catch (err) {
      setResendMessage(t('loginError'));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-ambient" aria-hidden="true">
          <div className="login-glow login-glow-1" />
          <div className="login-glow login-glow-2" />
          <div className="login-glow login-glow-3" />
          <div className="login-dust" />
        </div>
        <div className="login-manuscript">
          <div className="login-buttons">
            <button
              type="button"
              onClick={toggleTheme}
              className="login-action-btn"
              title={theme === 'dark' ? t('lightMode') : t('darkMode')}
              aria-label={theme === 'dark' ? t('lightMode') : t('darkMode')}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <div className="login-language-wrap">
              <button
                type="button"
                className="login-action-btn"
                onClick={() => setLanguageDropdownOpen((o) => !o)}
                title={t('languageLabel')}
                aria-expanded={languageDropdownOpen}
                aria-haspopup="true"
              >
                <i className="fa-solid fa-language" />
              </button>
              {languageDropdownOpen && (
                <ul className="login-language-dropdown" role="menu">
                  {LANGUAGES.map(({ code, label }) => (
                    <li key={code} role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className={`login-language-option ${language === code ? 'active' : ''}`}
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
          </div>
          <div className="login-manuscript-inner">
            <div className="login-manuscript-corner login-manuscript-corner-tl" aria-hidden="true" />
            <div className="login-manuscript-corner login-manuscript-corner-tr" aria-hidden="true" />
            <div className="login-manuscript-corner login-manuscript-corner-bl" aria-hidden="true" />
            <div className="login-manuscript-corner login-manuscript-corner-br" aria-hidden="true" />
            <div className="login-header">
              <h1>{t('loginTitle')}</h1>
              <p>{t('loginSubtitle')}</p>
            </div>

            {showVerificationComplete && (
              <div className="login-success-message">
                {t('verificationCompleteMessage')}
              </div>
            )}
            {error && <div className="login-error-message">{error}</div>}
            {showResendVerification && (
              <div className="login-resend-verification">
                <p className="login-resend-label">{t('resendVerificationLabel')}</p>
                <form onSubmit={handleResendVerification} className="login-resend-form">
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder={t('email')}
                    required
                    disabled={resendLoading}
                    className="login-resend-input"
                  />
                  <button type="submit" disabled={resendLoading} className="login-resend-button">
                    {resendLoading ? t('sending') : t('resendVerificationButton')}
                  </button>
                </form>
                {resendMessage && <p className="login-resend-message">{resendMessage}</p>}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="usernameOrEmail">{t('usernameOrEmail')}</label>
                <input
                  type="text"
                  id="usernameOrEmail"
                  name="usernameOrEmail"
                  value={formData.usernameOrEmail}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">{t('password')}</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? t('loggingIn') : t('loginButton')}
              </button>
            </form>

            <div className="login-footer">
              <p>
                {t('noAccount')}{' '}
                <Link to="/register" className="link">{t('registerHere')}</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
