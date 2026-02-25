import { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/useLanguage';
import './VerifyEmail.css';

function VerifyEmail() {
  const location = useLocation();
  const initialEmail = (location.state?.email ?? '').trim();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.post('/api/auth/verify-email', {
        email: email.trim(),
        code: code.replace(/\s/g, ''),
      });
      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }
      setSuccess(true);
      setSuccessMessage(data.code === 'ALREADY_VERIFIED' ? t('verificationAlreadyVerified') : (data.message || t('verificationSuccess')));
    } catch (err) {
      setError(t('verificationFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(v);
    setError('');
  };

  if (success) {
    return (
      <div className="verify-email-container">
        <div className="verify-email-card">
          <h1>{t('verificationTitle')}</h1>
          <p className="verify-email-success">{successMessage}</p>
          <Link to="/login" className="verify-email-link">{t('loginHere')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        <h1>{t('verificationTitle')}</h1>
        <p className="verify-email-intro">{t('enterVerificationCode')}</p>

        <form onSubmit={handleSubmit} className="verify-email-form">
          <div className="form-group">
            <label htmlFor="verify-email">{t('email')}</label>
            <input
              id="verify-email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
              disabled={loading}
              placeholder="correo@ejemplo.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="verify-code">{t('verificationCodeLabel')}</label>
            <input
              id="verify-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={handleCodeChange}
              required
              disabled={loading}
              placeholder={t('verificationCodePlaceholder')}
              maxLength={6}
              className="verify-email-code-input"
            />
          </div>
          {error && <p className="verify-email-error">{error}</p>}
          <button type="submit" className="verify-email-submit" disabled={loading || code.length !== 6}>
            {loading ? t('verifying') : t('verifyButton')}
          </button>
        </form>

        <p className="verify-email-footer">
          {t('noCodeReceived')}{' '}
          <Link to="/login" className="verify-email-link-inline">{t('loginHere')}</Link>
          {' '}{t('andResendCode')}
        </p>
      </div>
    </div>
  );
}

export default VerifyEmail;
