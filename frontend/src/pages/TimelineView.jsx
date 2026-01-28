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
  const [chapterCount, setChapterCount] = useState(5);
  const [showNewPlotModal, setShowNewPlotModal] = useState(false);
  const [newPlot, setNewPlot] = useState({ name: '', start: 1, end: 1 });
  const [creating, setCreating] = useState(false);
  const [plotError, setPlotError] = useState('');
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Calculate minimum chapters needed based on plots
  const getMinChapters = () => {
    if (!timeline || timeline.plots.length === 0) {
      return 1;
    }
    return Math.max(...timeline.plots.map(p => p.end));
  };

  const fetchTimeline = async () => {
    try {
      const timelineResponse = await api.get(`/api/timelines/${id}`);
      if (timelineResponse.error) {
        setError(timelineResponse.error);
      } else {
        setTimeline(timelineResponse.timeline);
        const maxEnd = timelineResponse.timeline.plots.length > 0 
          ? Math.max(...timelineResponse.timeline.plots.map(p => p.end))
          : 5;
        setChapterCount(prev => Math.max(prev, maxEnd));
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

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
          const maxEnd = timelineResponse.timeline.plots.length > 0 
            ? Math.max(...timelineResponse.timeline.plots.map(p => p.end))
            : 5;
          setChapterCount(Math.max(maxEnd, 5));
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

  // Add chapter
  const handleAddChapter = () => {
    setChapterCount(prev => prev + 1);
  };

  // Remove chapter (only if no plots extend to that chapter)
  const handleRemoveChapter = () => {
    const minRequired = getMinChapters();
    if (chapterCount > minRequired && chapterCount > 1) {
      setChapterCount(prev => prev - 1);
    }
  };

  // Create new plot
  const handleCreatePlot = async (e) => {
    e.preventDefault();
    setPlotError('');

    if (!newPlot.name.trim()) {
      setPlotError(t('plotNameRequired'));
      return;
    }

    if (newPlot.start > newPlot.end) {
      setPlotError(t('startCantBeGreaterThanEnd'));
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/api/plots', {
        timelineId: id,
        name: newPlot.name.trim(),
        start: newPlot.start,
        end: newPlot.end
      });

      if (response.error) {
        setPlotError(response.error);
      } else {
        setShowNewPlotModal(false);
        setNewPlot({ name: '', start: 1, end: 1 });
        // Refresh timeline
        await fetchTimeline();
      }
    } catch (err) {
      console.error('Error creating plot:', err);
      setPlotError(t('errorCreatingPlot'));
    } finally {
      setCreating(false);
    }
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

  const chapters = getChapters(chapterCount);
  const minChapters = getMinChapters();

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
          <button 
            className="new-plot-button"
            onClick={() => setShowNewPlotModal(true)}
          >
            <i className="fa-solid fa-plus"></i>
            {t('newPlot')}
          </button>
        </div>

        <div className="timeline-schematic">
          {/* Chapter controls */}
          <div className="chapter-controls">
            <button 
              className="chapter-control-button remove"
              onClick={handleRemoveChapter}
              disabled={chapterCount <= minChapters || chapterCount <= 1}
              title={t('removeChapter')}
            >
              <i className="fa-solid fa-minus"></i>
            </button>
            <span className="chapter-count">{chapterCount} {chapterCount === 1 ? t('chapterSingular') : t('chapters')}</span>
            <button 
              className="chapter-control-button add"
              onClick={handleAddChapter}
              title={t('addChapter')}
            >
              <i className="fa-solid fa-plus"></i>
            </button>
          </div>

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

      {/* New Plot Modal */}
      {showNewPlotModal && (
        <div className="plot-modal-overlay" onClick={() => setShowNewPlotModal(false)}>
          <div className="plot-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('newPlot')}</h2>
            <form onSubmit={handleCreatePlot}>
              <div className="form-group">
                <label>{t('plotName')}</label>
                <input
                  type="text"
                  value={newPlot.name}
                  onChange={(e) => setNewPlot({ ...newPlot, name: e.target.value })}
                  placeholder={t('plotNamePlaceholder')}
                  disabled={creating}
                  autoFocus
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('startChapter')}</label>
                  <input
                    type="number"
                    min="1"
                    max={chapterCount}
                    value={newPlot.start}
                    onChange={(e) => setNewPlot({ ...newPlot, start: parseInt(e.target.value) || 1 })}
                    disabled={creating}
                  />
                </div>
                <div className="form-group">
                  <label>{t('endChapter')}</label>
                  <input
                    type="number"
                    min="1"
                    max={chapterCount}
                    value={newPlot.end}
                    onChange={(e) => setNewPlot({ ...newPlot, end: parseInt(e.target.value) || 1 })}
                    disabled={creating}
                  />
                </div>
              </div>
              {plotError && <p className="plot-error">{plotError}</p>}
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setShowNewPlotModal(false)}
                  disabled={creating}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="submit" 
                  className="create-button"
                  disabled={creating}
                >
                  {creating ? t('creating') : t('create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimelineView;
