import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import './Plots.css';

function Plots() {
  const [loading, setLoading] = useState(true);
  const [timelines, setTimelines] = useState([]);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authResponse = await api.get('/api/auth/me');
        if (authResponse.error) {
          navigate('/login');
          return;
        }

        const timelinesResponse = await api.get('/api/timelines');
        if (timelinesResponse.timelines) {
          setTimelines(timelinesResponse.timelines);
        }
      } catch (err) {
        console.error('Error:', err);
        setError(t('errorLoadingTimelines'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, t]);

  if (loading) {
    return (
      <div className="plots-container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="plots-container">
      <Header />

      <main className="plots-main">
        <h1 className="plots-title">{t('timelines')}</h1>

        {error && <p className="plots-error">{error}</p>}

        {timelines.length === 0 ? (
          <div className="no-timelines">
            <i className="fa-solid fa-clock-rotate-left"></i>
            <p>{t('noTimelinesYet')}</p>
            <span>{t('createStoryForTimeline')}</span>
          </div>
        ) : (
          <div className="timelines-grid">
            {timelines.map((timeline) => (
              <div 
                key={timeline.id} 
                className="timeline-card"
                onClick={() => navigate(`/timeline/${timeline.id}`)}
              >
                <div className="timeline-header">
                  <h3 className="timeline-story-title">{timeline.story.title}</h3>
                </div>
                <div className="timeline-info">
                  <span className="timeline-plots-count">
                    <i className="fa-solid fa-diagram-project"></i>
                    {timeline.plots.length} {timeline.plots.length === 1 ? t('plot') : t('plots')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Plots;
