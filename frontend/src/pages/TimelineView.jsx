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

  // Calculate number of chapters needed
  const getChapterCount = () => {
    if (!timeline || timeline.plots.length === 0) {
      return 5; // Default 5 chapters
    }
    const maxEnd = Math.max(...timeline.plots.map(p => p.end));
    return Math.max(maxEnd, 5); // At least 5 chapters
  };

  // Calculate position percentage for a chapter value (1-based)
  const getPosition = (value, totalChapters) => {
    return ((value - 1) / totalChapters) * 100;
  };

  // Calculate width percentage for a range
  const getWidth = (start, end, totalChapters) => {
    return ((end - start + 1) / totalChapters) * 100;
  };

  // Generate colors for plots
  const getPlotColor = (index) => {
    const colors = [
      '#c45050', '#50a0c4', '#7ab87a', '#c4a050', 
      '#a050c4', '#50c4a0', '#c47050', '#5070c4'
    ];
    return colors[index % colors.length];
  };

  // Generate chapters array
  const getChapters = (count) => {
    return Array.from({ length: count }, (_, i) => i + 1);
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

  const chapterCount = getChapterCount();
  const chapters = getChapters(chapterCount);

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
          {/* Chapter headers */}
          <div className="chapter-headers">
            {chapters.map((chapter) => (
              <div 
                key={chapter} 
                className="chapter-header"
                style={{ width: `${100 / chapterCount}%` }}
              >
                <span className="chapter-label">{t('chapter')} {chapter}</span>
              </div>
            ))}
          </div>

          <div className="timeline-axis">
            {/* Chapter divisions */}
            <div className="chapter-divisions">
              {chapters.map((chapter) => (
                <div 
                  key={chapter} 
                  className="chapter-section"
                  style={{ width: `${100 / chapterCount}%` }}
                >
                  {/* Quarter divisions */}
                  <div className="quarter-divisions">
                    {[0, 1, 2, 3].map((quarter) => (
                      <div key={quarter} className="quarter-section">
                        <div className="quarter-line"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Main timeline line */}
            <div className="timeline-line"></div>

            {/* Plots on timeline */}
            <div className="timeline-plots">
              {timeline.plots.map((plot, index) => {
                const left = getPosition(plot.start, chapterCount);
                const width = getWidth(plot.start, plot.end, chapterCount);
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
                    title={`${plot.name}: ${t('chapter')} ${plot.start} - ${plot.end}`}
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
                  <span className="legend-range">{t('chapter')} {plot.start} - {plot.end}</span>
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
