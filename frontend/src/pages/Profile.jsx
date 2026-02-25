import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useLayout } from '../contexts/LayoutContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Profile.css';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const { language, t } = useLanguage();
  const { setPageTitle, setBackUrl } = useLayout();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  
  // View state: 'profile' or 'password'
  const [currentView, setCurrentView] = useState('profile');

  useEffect(() => {
    setPageTitle(t('profileTitle'));
    setBackUrl(null);
  }, [t, setPageTitle, setBackUrl]);
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/api/auth/me');
        if (response.error || !response.user) {
          navigate('/login');
        } else {
          setUser(response.user);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError(t('invalidImageType'));
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError(t('imageTooLarge'));
      return;
    }

    setError('');
    setUploading(true);

    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      const response = await api.put('/api/auth/profile-image', {
        profileImage: base64
      });

      if (response.error) {
        setError(response.error);
      } else {
        setUser(response.user);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(t('uploadError'));
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validate new passwords match
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      setPasswordError(t('newPasswordsDontMatch'));
      return;
    }

    setChangingPassword(true);

    try {
      const response = await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      if (response.error) {
        if (response.error === "La contraseña actual es incorrecta") {
          setPasswordError(t('currentPasswordIncorrect'));
        } else if (response.error === "La nueva contraseña debe ser diferente a la actual") {
          setPasswordError(t('samePasswordError'));
        } else {
          setPasswordError(t('passwordChangeError'));
        }
      } else {
        setPasswordSuccess(t('passwordChanged'));
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        // Go back to profile after a short delay
        setTimeout(() => {
          setCurrentView('profile');
          setPasswordSuccess('');
        }, 1500);
      }
    } catch (err) {
      console.error('Password change error:', err);
      setPasswordError(t('passwordChangeError'));
    } finally {
      setChangingPassword(false);
    }
  };

  const handleShowPasswordChange = () => {
    setCurrentView('password');
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
  };

  const handleCancelPasswordChange = () => {
    setCurrentView('profile');
    setPasswordError('');
    setPasswordSuccess('');
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: ''
    });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <Header />

      <div className="page-main profile-main">
        <div className="page-subheader profile-header">
          <button
            type="button"
            className="page-back-button"
            onClick={() => navigate('/home')}
            title={t('back')}
            aria-label={t('back')}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="page-subheader-title">
            <h1>{currentView === 'profile' ? t('profileTitle') : t('changePassword')}</h1>
          </div>
          <div className="page-subheader-actions" />
        </div>
        <div className="profile-layout">
          <aside className="profile-aside">
            <div className="profile-aside-card">
              <h3 className="profile-aside-card-title">{t('account')}</h3>
              <ul className="profile-aside-list">
                <li>
                  <button
                    type="button"
                    className={`profile-aside-link ${currentView === 'profile' ? 'active' : ''}`}
                    onClick={() => setCurrentView('profile')}
                  >
                    <i className="fa-solid fa-user"></i> {t('profileTitle')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className={`profile-aside-link ${currentView === 'password' ? 'active' : ''}`}
                    onClick={handleShowPasswordChange}
                  >
                    <i className="fa-solid fa-key"></i> {t('changePassword')}
                  </button>
                </li>
              </ul>
            </div>
          </aside>
          <main className="profile-main-content">
            <div className="page-content">
        {currentView === 'profile' ? (
          <section className="profile-section">
            
            <div className="profile-image-section">
              <div 
                className={`profile-image-container ${uploading ? 'uploading' : ''}`}
                onClick={handleImageClick}
                title={t('changeProfileImage')}
              >
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={t('profileImage')} 
                    className="profile-image"
                  />
                ) : (
                  <div className="profile-image-placeholder">
                    <i className="fa-solid fa-user"></i>
                  </div>
                )}
                <div className="profile-image-overlay">
                  <i className="fa-solid fa-camera"></i>
                </div>
                {uploading && (
                  <div className="upload-spinner">
                    <div className="spinner"></div>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <p className="image-hint">{t('clickToChangeImage')}</p>
              {error && <p className="image-error">{error}</p>}
            </div>
            
            <div className="profile-info">
              <div className="info-item">
                <label>{t('username')}</label>
                <div className="info-value">{user?.username}</div>
              </div>
              
              <div className="info-item">
                <label>{t('email')}</label>
                <div className="info-value">{user?.email}</div>
              </div>
              
              <div className="info-item">
                <label>{t('memberSince')}</label>
                <div className="info-value">
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </div>
              </div>
            </div>

            <button 
              className="show-password-change-button" 
              onClick={handleShowPasswordChange}
            >
              <i className="fa-solid fa-key"></i> {t('changePassword')}
            </button>
          </section>
        ) : (
          <section className="profile-section password-section">
            <form onSubmit={handlePasswordSubmit} className="password-form">
              {passwordError && <div className="password-error">{passwordError}</div>}
              {passwordSuccess && <div className="password-success">{passwordSuccess}</div>}
              
              <div className="form-group">
                <label htmlFor="currentPassword">{t('currentPassword')}</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  disabled={changingPassword}
                  placeholder="••••••••"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">{t('newPassword')}</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  disabled={changingPassword}
                  placeholder="••••••••"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmNewPassword">{t('confirmNewPassword')}</label>
                <input
                  type="password"
                  id="confirmNewPassword"
                  name="confirmNewPassword"
                  value={passwordData.confirmNewPassword}
                  onChange={handlePasswordChange}
                  required
                  disabled={changingPassword}
                  placeholder="••••••••"
                />
              </div>
              
              <div className="password-buttons">
                <button 
                  type="button" 
                  className="cancel-button" 
                  onClick={handleCancelPasswordChange}
                  disabled={changingPassword}
                >
                  {t('cancel')}
                </button>
                <button type="submit" className="change-password-button" disabled={changingPassword}>
                  {changingPassword ? '...' : t('changePassword')}
                </button>
              </div>
            </form>
          </section>
        )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Profile;
