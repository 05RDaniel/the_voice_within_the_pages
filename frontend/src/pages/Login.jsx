import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import '../components/Header.css';
import './Login.css';

function Login() {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const translateError = (errorMsg) => {
    const errorMap = {
      'Credenciales inválidas': 'invalidCredentials',
      'Usuario/Email y contraseña son requeridos': 'allFieldsRequired',
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

    try {
      const response = await api.post('/api/auth/login', formData);
      
      if (response.error) {
        setError(translateError(response.error));
      } else {
        navigate('/home');
      }
    } catch (err) {
      setError(t('loginError'));
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-buttons">
            <button onClick={toggleTheme} className="theme-toggle-button" title={theme === 'dark' ? t('lightMode') : t('darkMode')}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button onClick={toggleLanguage} className="lang-toggle-button" title={language === 'es' ? 'English' : 'Español'}>
              {language === 'es' ? 'EN' : 'ES'}
            </button>
          </div>
          <div className="login-header">
            <h1>{t('loginTitle')}</h1>
            <p>{t('loginSubtitle')}</p>
          </div>

          {error && <div className="error-message">{error}</div>}

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
  );
}

export default Login;
