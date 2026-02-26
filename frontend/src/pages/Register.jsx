import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/useLanguage';
import '../components/Header.css';
import './Login.css';
import './Register.css';

const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyError, setVerifyError] = useState('');
  const [resendMessage, setResendMessage] = useState('');
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

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
      'El email ya está registrado': 'emailAlreadyExists',
      'El nombre de usuario ya está en uso': 'usernameAlreadyExists',
      'El formato del email no es válido': 'invalidEmailFormat',
      'El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números, guiones y guiones bajos': 'invalidUsernameFormat',
      'Todos los campos son requeridos': 'allFieldsRequired',
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
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError(t('passwordsNoMatch'));
      setLoading(false);
      return;
    }

    try {
      const payload = { username: formData.username, email: formData.email, password: '[REDACTED]' };
      console.log('[Register] POST /api/auth/register', payload);
      const response = await api.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      console.log('[Register] register response', { error: response.error, needsVerification: response.needsVerification });
      if (response.error) {
        setError(translateError(response.error));
      } else if (response.needsVerification) {
        setRegistered(true);
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(t('registerError'));
      console.error('[Register] request failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setVerifyError('');
    setResendMessage('');
    const codeStr = verificationCode.replace(/\D/g, '').slice(0, 6);
    if (codeStr.length !== 6) {
      setVerifyError(t('codeMustBe6Digits'));
      return;
    }
    setVerifyLoading(true);
    try {
      console.log('[Register] POST /api/auth/verify-email', { email: formData.email, codeLength: codeStr.length });
      const data = await api.post('/api/auth/verify-email', {
        email: formData.email,
        code: codeStr,
      });
      console.log('[Register] verify-email response', { error: data.error, message: data.message });
      if (data.error) {
        setVerifyError(data.error);
        return;
      }
      navigate('/login');
    } catch (err) {
      setVerifyError(t('verificationFailed'));
      console.error('[Register] verify-email request failed', err);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendCode = async (e) => {
    e.preventDefault();
    setVerifyError('');
    setResendMessage('');
    setResendLoading(true);
    try {
      console.log('[Register] POST /api/auth/resend-verification', { email: formData.email });
      const data = await api.post('/api/auth/resend-verification', { email: formData.email });
      console.log('[Register] resend-verification response', { error: data.error, message: data.message });
      if (data.error) {
        setResendMessage(data.error);
      } else {
        setResendMessage(t('verificationEmailSent'));
      }
    } catch (err) {
      setResendMessage(t('registerError'));
      console.error('[Register] resend-verification request failed', err);
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
              <h1>{t('registerTitle')}</h1>
              <p>{t('registerSubtitle')}</p>
            </div>

            {error && <div className="login-error-message">{error}</div>}

            {registered ? (
              <div className="register-verify-block">
                  <>
                    <p className="register-verify-intro">{t('checkEmailForCode')}</p>
                    <form onSubmit={handleVerifyCode} className="register-verify-form">
                      <div className="form-group">
                        <label htmlFor="register-code">{t('verificationCodeLabel')}</label>
                        <input
                          id="register-code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={verificationCode}
                          onChange={(e) => {
                            setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                            setVerifyError('');
                            setResendMessage('');
                          }}
                          placeholder={t('verificationCodePlaceholder')}
                          maxLength={6}
                          disabled={verifyLoading}
                          className="register-code-input"
                        />
                      </div>
                      {verifyError && <p className="register-verify-error">{verifyError}</p>}
                      {resendMessage && <p className="register-resend-message">{resendMessage}</p>}
                      <div className="register-verify-buttons">
                        <button
                          type="submit"
                          className="login-button"
                          disabled={verifyLoading || verificationCode.replace(/\D/g, '').length !== 6}
                        >
                          {verifyLoading ? t('verifying') : t('verifyButton')}
                        </button>
                        <button
                          type="button"
                          className="register-resend-button"
                          onClick={handleResendCode}
                          disabled={resendLoading}
                        >
                          {resendLoading ? t('sending') : t('resendCodeButton')}
                        </button>
                      </div>
                    </form>
                    <div className="login-footer">
                      <p>
                        {t('hasAccount')}{' '}
                        <Link to="/login" className="link">{t('loginHere')}</Link>
                      </p>
                    </div>
                  </>
              </div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="login-form">
                  <div className="form-group">
                    <label htmlFor="username">{t('username')}</label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={loading}
                      minLength={3}
                      maxLength={20}
                      pattern="[-a-zA-Z0-9_]+"
                    />
                    <small className="form-hint">{t('usernameHint')}</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">{t('email')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
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

                  <div className="form-group">
                    <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
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
                    {loading ? t('registering') : t('registerButton')}
                  </button>
                </form>

                <div className="login-footer">
                  <p>
                    {t('hasAccount')}{' '}
                    <Link to="/login" className="link">{t('loginHere')}</Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
