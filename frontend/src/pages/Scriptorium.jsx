import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useLayout } from '../contexts/LayoutContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Scriptorium.css';

function Scriptorium() {
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const { setPageTitle, setBackUrl } = useLayout();
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle(t('scriptoriumWelcome'));
    setBackUrl('/home');
  }, [t, setPageTitle, setBackUrl]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/api/auth/me');
        if (response.error || !response.user) {
          navigate('/login');
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

  if (loading) {
    return (
      <div className="scriptorium-container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="scriptorium-container">
      <Header />

      <div className="page-main scriptorium-main">
        <div className="page-content">
          <div className="scriptorium-cards">
            <div className="scriptorium-card" onClick={() => navigate('/stories')}>
              <div className="card-icon">
                <i className="fa-solid fa-book-open"></i>
              </div>
              <h2>{t('stories')}</h2>
              <p>{t('storiesDescription')}</p>
            </div>
            
            <div className="scriptorium-card">
              <div className="card-icon">
                <i className="fa-solid fa-users"></i>
              </div>
              <h2>{t('characters')}</h2>
              <p>{t('charactersDescription')}</p>
            </div>
            
            <div className="scriptorium-card" onClick={() => navigate('/plots')}>
              <div className="card-icon">
                <i className="fa-solid fa-diagram-project"></i>
              </div>
              <h2>{t('plots')}</h2>
              <p>{t('plotsDescription')}</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Scriptorium;

