import { useState, useEffect, useRef } from 'react';
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
  const [dragState, setDragState] = useState(null);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const axisRef = useRef(null);

  // Calculate minimum chapters needed based on plots (round up for decimal values)
  const getMinChapters = () => {
    if (!timeline || timeline.plots.length === 0) {
      return 1;
    }
    return Math.ceil(Math.max(...timeline.plots.map(p => p.end)));
  };

  const fetchTimeline = async () => {
    try {
      const timelineResponse = await api.get(`/api/timelines/${id}`);
      if (timelineResponse.error) {
        setError(timelineResponse.error);
      } else {
        setTimeline(timelineResponse.timeline);
        const maxEnd = timelineResponse.timeline.plots.length > 0 
          ? Math.ceil(Math.max(...timelineResponse.timeline.plots.map(p => p.end)))
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
            ? Math.ceil(Math.max(...timelineResponse.timeline.plots.map(p => p.end)))
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

  // Start drag (move or resize)
  const startDrag = (e, plot, mode) => {
    e.preventDefault();
    e.stopPropagation();

    if (!axisRef.current) return;

    const rect = axisRef.current.getBoundingClientRect();

    setDragState({
      mode, // 'move' | 'resize-start' | 'resize-end'
      plotId: plot.id,
      originalStart: plot.start,
      originalEnd: plot.end,
      startX: e.clientX,
      axisWidth: rect.width,
    });
  };

  // Update plot position/length while dragging (works with quarter chapters)
  const updatePlotDuringDrag = (clientX, state) => {
    if (!state || !timeline || !axisRef.current) return;

    const { mode, plotId, originalStart, originalEnd, startX, axisWidth } = state;
    if (!axisWidth || chapterCount <= 0) return;

    const deltaPx = clientX - startX;
    const chapterWidthPx = axisWidth / chapterCount;
    if (!chapterWidthPx) return;

    // Calculate delta in quarter chapters (each chapter has 4 quarters)
    // Each quarter is 0.25 of a chapter
    const quarterWidthPx = chapterWidthPx / 4;
    const deltaQuarters = deltaPx / quarterWidthPx;
    
    // Round to nearest quarter (0.25 increments)
    const deltaQuartersRounded = Math.round(deltaQuarters) * 0.25;

    let newStart = originalStart;
    let newEnd = originalEnd;

    if (mode === 'move') {
      const length = originalEnd - originalStart;
      newStart = originalStart + deltaQuartersRounded;
      newEnd = newStart + length;
    } else if (mode === 'resize-start') {
      newStart = originalStart + deltaQuartersRounded;
    } else if (mode === 'resize-end') {
      newEnd = originalEnd + deltaQuartersRounded;
    }

    // Clamp to valid range (1 to chapterCount)
    newStart = Math.max(1, Math.min(newStart, chapterCount));
    newEnd = Math.max(1, Math.min(newEnd, chapterCount));

    // Ensure start <= end
    if (newStart > newEnd) {
      if (mode === 'resize-start') {
        newStart = newEnd;
      } else if (mode === 'resize-end') {
        newEnd = newStart;
      } else {
        const length = originalEnd - originalStart;
        newStart = Math.max(1, Math.min(newStart, chapterCount - length));
        newEnd = newStart + length;
      }
    }

    setTimeline(prev => ({
      ...prev,
      plots: prev.plots.map(p =>
        p.id === plotId ? { ...p, start: newStart, end: newEnd } : p
      ),
    }));
  };

  // Global mouse move/up handlers for dragging
  useEffect(() => {
    if (!dragState) return;

    const currentState = dragState;

    const handleMouseMove = (e) => {
      updatePlotDuringDrag(e.clientX, currentState);
    };

    const handleMouseUp = async () => {
      const plot = timeline?.plots.find(p => p.id === currentState.plotId);

      // Clear drag state first so UI updates
      setDragState(null);

      if (!plot) return;

      try {
        await api.put(`/api/plots/${plot.id}`, {
          start: plot.start,
          end: plot.end,
        });
      } catch (err) {
        console.error('Error updating plot:', err);
        setPlotError(t('errorUpdatingPlot'));

        // Revert to original values on error
        setTimeline(prev => ({
          ...prev,
          plots: prev.plots.map(p =>
            p.id === currentState.plotId
              ? { ...p, start: currentState.originalStart, end: currentState.originalEnd }
              : p
          ),
        }));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, chapterCount, timeline, t]);

  // Calculate position percentage for a chapter value (supports decimals for quarters)
  const getPosition = (value, totalChapters) => {
    return ((value - 1) / totalChapters) * 100;
  };

  // Calculate width percentage for a range (supports decimals for quarters)
  const getWidth = (start, end, totalChapters) => {
    return ((end - start) / totalChapters) * 100;
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

  // Format chapter value for display (handles quarters)
  const formatChapterValue = (value) => {
    const chapter = Math.floor(value);
    const quarter = (value % 1) * 4;
    if (quarter === 0) {
      return chapter.toString();
    }
    return `${chapter}.${Math.round(quarter)}`;
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

          <div className="timeline-axis" ref={axisRef}>
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
                    className={`timeline-plot-segment ${dragState?.plotId === plot.id ? 'dragging' : ''}`}
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 2)}%`,
                      backgroundColor: color,
                    }}
                    title={`${plot.name}: ${t('chapter')} ${formatChapterValue(plot.start)} - ${formatChapterValue(plot.end)}`}
                    onMouseDown={(e) => startDrag(e, plot, 'move')}
                  >
                    <div
                      className="plot-handle left"
                      onMouseDown={(e) => startDrag(e, plot, 'resize-start')}
                    />
                    <div
                      className="plot-handle right"
                      onMouseDown={(e) => startDrag(e, plot, 'resize-end')}
                    />
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
                  <span className="legend-range">{t('chapter')} {formatChapterValue(plot.start)} - {formatChapterValue(plot.end)}</span>
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
                    step="0.25"
                    value={newPlot.start}
                    onChange={(e) => setNewPlot({ ...newPlot, start: parseFloat(e.target.value) || 1 })}
                    disabled={creating}
                  />
                </div>
                <div className="form-group">
                  <label>{t('endChapter')}</label>
                  <input
                    type="number"
                    min="1"
                    max={chapterCount}
                    step="0.25"
                    value={newPlot.end}
                    onChange={(e) => setNewPlot({ ...newPlot, end: parseFloat(e.target.value) || 1 })}
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
