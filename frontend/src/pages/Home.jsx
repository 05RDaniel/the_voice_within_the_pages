import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/useLanguage';
import { useLayout } from '../contexts/LayoutContext';
import { useTutorial } from '../contexts/TutorialContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Home.css';

function Home() {
  const [loading, setLoading] = useState(true);
  const [showFirstTimePopup, setShowFirstTimePopup] = useState(true);
  const { t } = useLanguage();
  const { setPageTitle, setBackUrl } = useLayout();
  const { setOnTutorialOpen } = useTutorial();
  const navigate = useNavigate();

  useEffect(() => {
    setOnTutorialOpen(() => setShowFirstTimePopup(false));
    return () => setOnTutorialOpen(null);
  }, [setOnTutorialOpen]);

  useEffect(() => {
    setPageTitle(t(''));
    setBackUrl(null);
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
      <div className="home-container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="home-container">
      <Header />
      <main className="main-content home-main">
        <div className="home-ambient">
          <div className="home-glow home-glow-1" aria-hidden="true" />
          <div className="home-glow home-glow-2" aria-hidden="true" />
          <div className="home-glow home-glow-3" aria-hidden="true" />
          <div className="home-dust" aria-hidden="true" />
        </div>
        <div className="home-manuscript-wrap">
          <article className="home-manuscript">
            <div className="home-manuscript-inner">
              <div className="home-manuscript-corner home-manuscript-corner-tl" aria-hidden="true" />
              <div className="home-manuscript-corner home-manuscript-corner-tr" aria-hidden="true" />
              <div className="home-manuscript-corner home-manuscript-corner-bl" aria-hidden="true" />
              <div className="home-manuscript-corner home-manuscript-corner-br" aria-hidden="true" />
              <header className="home-manuscript-header">
                <h2 className="home-title">{t('welcomeTitle')}</h2>
              </header>
              <div className="home-manuscript-body">
                <p>{t('welcomeP1')}</p>
                <p>{t('welcomeP2')}</p>
                <p>{t('welcomeP3')}</p>
              </div>
            </div>
          </article>
          <div className="home-actions">
            <button type="button" className="home-action-btn" onClick={() => navigate('/scriptorium')} data-tutorial-target="scriptorium">
              <i className="fa-solid fa-book-open" />
              {t('scriptorium')}
            </button>
            <button type="button" className="home-action-btn home-action-btn-archive" disabled title={t('archive')} data-tutorial-target="archive">
              <i className="fa-solid fa-box-archive" />
              {t('archive')}
            </button>
          </div>
        </div>
      </main>
      {showFirstTimePopup && (
        <div className="home-first-time-popup" role="dialog" aria-label={t('firstTimeHere')}>
          <button
            type="button"
            className="home-first-time-close"
            onClick={() => setShowFirstTimePopup(false)}
            aria-label={t('close')}
            title={t('close')}
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <p className="home-first-time-text">{t('firstTimeHere')}</p>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default Home;
