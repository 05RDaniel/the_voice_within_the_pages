import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import './Scriptorium.css';

function Scriptorium() {
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await api.get('/api/auth/me');
        if (response.error) {
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

      <main className="scriptorium-main">
        <h1 className="scriptorium-title">{t('scriptoriumWelcome')}</h1>
        
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
          
          <div className="scriptorium-card">
            <div className="card-icon">
              <i className="fa-solid fa-diagram-project"></i>
            </div>
            <h2>{t('plots')}</h2>
            <p>{t('plotsDescription')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Scriptorium;

