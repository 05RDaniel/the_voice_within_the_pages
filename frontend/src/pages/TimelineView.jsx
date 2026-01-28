import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
import './TimelineView.css';

function TimelineView() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState(null);
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

        const timelineResponse = await api.get(`/api/timelines/${id}`);
        if (timelineResponse.error) {
          setError(timelineResponse.error);
        } else {
          setTimeline(timelineResponse.timeline);
        }
      } catch (err) {
        console.error('Error:', err);
        setError(t('errorLoadingTimeline'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, t]);

  // Calculate timeline bounds
  const getTimelineBounds = () => {
    if (!timeline || timeline.plots.length === 0) {
      return { min: 0, max: 100 };
    }
    const starts = timeline.plots.map(p => p.start);
    const ends = timeline.plots.map(p => p.end);
    const min = Math.min(...starts);
    const max = Math.max(...ends);
    // Add some padding
    const padding = Math.max((max - min) * 0.1, 5);
    return { min: min - padding, max: max + padding };
  };

  // Calculate position percentage for a value
  const getPosition = (value, bounds) => {
    const range = bounds.max - bounds.min;
    if (range === 0) return 50;
    return ((value - bounds.min) / range) * 100;
  };

  // Generate colors for plots
  const getPlotColor = (index) => {
    const colors = [
      '#c45050', '#50a0c4', '#7ab87a', '#c4a050', 
      '#a050c4', '#50c4a0', '#c47050', '#5070c4'
    ];
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="timeline-view-container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  if (error || !timeline) {
    return (
      <div className="timeline-view-container">
        <Header />
        <main className="timeline-view-main">
          <div className="timeline-error-page">
            <i className="fa-solid fa-exclamation-triangle"></i>
            <p>{error || t('timelineNotFound')}</p>
            <button onClick={() => navigate('/plots')} className="back-button">
              {t('backToTimelines')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  const bounds = getTimelineBounds();

  return (
    <div className="timeline-view-container">
      <Header />

      <main className="timeline-view-main">
        <div className="timeline-view-header">
          <button 
            className="timeline-back-button" 
            onClick={() => navigate('/plots')}
          >
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="timeline-view-info">
            <h1 className="timeline-view-title">{timeline.name}</h1>
            <span className="timeline-view-story">{timeline.story.title}</span>
          </div>
        </div>

        <div className="timeline-schematic">
          <div className="timeline-axis">
            <div className="timeline-line"></div>
            
            {/* Timeline markers */}
            <div className="timeline-markers">
              {[0, 25, 50, 75, 100].map((percent) => {
                const value = Math.round(bounds.min + (bounds.max - bounds.min) * (percent / 100));
                return (
                  <div 
                    key={percent} 
                    className="timeline-marker"
                    style={{ left: `${percent}%` }}
                  >
                    <div className="marker-tick"></div>
                    <span className="marker-label">{value}</span>
                  </div>
                );
              })}
            </div>

            {/* Plots on timeline */}
            <div className="timeline-plots">
              {timeline.plots.map((plot, index) => {
                const left = getPosition(plot.start, bounds);
                const width = getPosition(plot.end, bounds) - left;
                const color = getPlotColor(index);
                
                return (
                  <div
                    key={plot.id}
                    className="timeline-plot-segment"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 2)}%`,
                      backgroundColor: color,
                    }}
                    title={`${plot.name}: ${plot.start} - ${plot.end}`}
                  >
                    <span className="plot-segment-label">{plot.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          {timeline.plots.length > 0 && (
            <div className="timeline-legend">
              {timeline.plots.map((plot, index) => (
                <div key={plot.id} className="legend-item">
                  <span 
                    className="legend-color" 
                    style={{ backgroundColor: getPlotColor(index) }}
                  ></span>
                  <span className="legend-name">{plot.name}</span>
                  <span className="legend-range">{plot.start} - {plot.end}</span>
                </div>
              ))}
            </div>
          )}

          {timeline.plots.length === 0 && (
            <div className="no-plots">
              <i className="fa-solid fa-diagram-project"></i>
              <p>{t('noPlotsYet')}</p>
              <span>{t('addPlotsToTimeline')}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default TimelineView;
