import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../components/Header.css';
import './Register.css';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

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
      const response = await api.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (response.error) {
        setError(translateError(response.error));
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(t('registerError'));
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        <div className="register-card">
          <div className="register-buttons">
            <button onClick={toggleTheme} className="theme-toggle-button" title={theme === 'dark' ? t('lightMode') : t('darkMode')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={toggleLanguage} className="lang-toggle-button" title={language === 'es' ? 'English' : 'Español'}>
              {language === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
          <div className="register-header">
            <h1>{t('registerTitle')}</h1>
            <p>{t('registerSubtitle')}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="register-form">
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
                pattern="[a-zA-Z0-9_-]+"
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
              className="register-button"
              disabled={loading}
            >
              {loading ? t('registering') : t('registerButton')}
            </button>
          </form>

          <div className="register-footer">
            <p>
              {t('hasAccount')}{' '}
              <Link to="/login" className="link">{t('loginHere')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
