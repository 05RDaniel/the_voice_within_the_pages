import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import './Header.css';

function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/api/auth/me');
        if (!response.error) {
          setUser(response.user);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout', {});
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    }
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDropdownOpen(false);
    handleLogout();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownOpen && !event.target.closest('.profile-dropdown-container')) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="action-buttons">
          <i className="fa-solid fa-house home-icon" onClick={() => navigate('/home')} title={t('home')}></i>
          <button className="action-button">{t('archive')}</button>
          <button className="action-button" onClick={() => navigate('/scriptorium')}>{t('scriptorium')}</button>
        </div>
        <div className="header-center"></div>
        <div className="header-right">
          <div className="profile-dropdown-container">
            <div 
              className="profile-picture-placeholder" 
              onClick={toggleDropdown}
              style={{ cursor: 'pointer' }}
            >
              {user?.profileImage ? (
                <img 
                  src={user.profileImage} 
                  alt="Profile" 
                  className="header-profile-image"
                />
              ) : (
                <i className="fa-solid fa-user header-profile-icon"></i>
              )}
            </div>
            {dropdownOpen && (
              <div className="profile-dropdown">
                <button onClick={handleProfileClick} className="dropdown-item">
                  {t('myProfile')}
                </button>
                <button 
                  onClick={handleLogoutClick} 
                  className="dropdown-item"
                  type="button"
                >
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
          <button onClick={toggleLanguage} className="lang-toggle-button" title={language === 'es' ? 'English' : 'Español'}>
            {language === 'es' ? 'EN' : 'ES'}
          </button>
          <button onClick={toggleTheme} className="theme-toggle-button" title={theme === 'dark' ? t('lightMode') : t('darkMode')}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
