import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Home.css';

function Home() {
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
      <div className="home-container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Header />

      <main className="home-main">
        <section className="welcome-section">
          <h2>{t('welcomeTitle')}</h2>
          <br/>
          <p>{t('welcomeP1')}</p>
          <br/>
          <p>{t('welcomeP2')}</p>
          <br/>
          <p>{t('welcomeP3')}</p>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;
