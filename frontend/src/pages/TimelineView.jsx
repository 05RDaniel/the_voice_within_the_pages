import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/useLanguage';
import { useLayout } from '../contexts/LayoutContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './TimelineView.css';

function TimelineView() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [timeline, setTimeline] = useState(null);
  const [error, setError] = useState('');
  const [chapterCount, setChapterCount] = useState(9);
  const [showNewPlotModal, setShowNewPlotModal] = useState(false);
  const DEFAULT_PLOT_COLOR = '#8b7355';
  const [newPlot, setNewPlot] = useState({ name: '', description: '', start: 1, end: 2, color: DEFAULT_PLOT_COLOR });
  const [editingPlot, setEditingPlot] = useState(null);
  const [plotToDelete, setPlotToDelete] = useState(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [plotError, setPlotError] = useState('');
  const [dragState, setDragState] = useState(null);
  const [highlightedPlotId, setHighlightedPlotId] = useState(null);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const DEFAULT_NOTE_COLOR = '#6b5d4f';
  const [newNote, setNewNote] = useState({ name: '', position: 1, color: DEFAULT_NOTE_COLOR });
  const [editingNote, setEditingNote] = useState(null);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [creatingNote, setCreatingNote] = useState(false);
  const [updatingNote, setUpdatingNote] = useState(false);
  const [deletingNote, setDeletingNote] = useState(false);
  const [noteError, setNoteError] = useState('');
  const [highlightedNoteId, setHighlightedNoteId] = useState(null);
  const [noteTooltip, setNoteTooltip] = useState(null); // { names, left, top } for fixed-position tooltip
  const { t } = useLanguage();
  const { setPageTitle, setBackUrl } = useLayout();
  const navigate = useNavigate();
  const axisRef = useRef(null);

  useEffect(() => {
    setPageTitle(timeline?.name ?? '');
    setBackUrl('/plots');
  }, [timeline, setPageTitle, setBackUrl]);
  const schematicRef = useRef(null);
  const [schematicWidth, setSchematicWidth] = useState(0);

  // Measure schematic container when timeline is shown (schematic is in DOM)
  useEffect(() => {
    if (!timeline) return;
    const el = schematicRef.current;
    const measure = (target) => {
      if (!target) return;
      const w = target.clientWidth || target.getBoundingClientRect().width;
      if (w > 0) setSchematicWidth(w);
    };
    measure(el);
    const raf = requestAnimationFrame(() => measure(schematicRef.current));
    if (!el) return () => cancelAnimationFrame(raf);
    const ro = new ResizeObserver((entries) => {
      const target = entries[0]?.target;
      if (target) {
        const w = target.clientWidth || target.getBoundingClientRect().width;
        if (w > 0) setSchematicWidth(w);
      }
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [timeline]);

  // Min chapters so the latest plot end (inicio del capítulo N = fin del N-1) fits
  const getMinChapters = () => {
    if (!timeline || timeline.plots.length === 0) {
      return 1;
    }
    const maxEnd = Math.ceil(Math.max(...timeline.plots.map(p => p.end)));
    return Math.max(1, maxEnd - 1);
  };

  const fetchTimeline = async () => {
    try {
      const timelineResponse = await api.get(`/api/timelines/${id}`);
      if (timelineResponse.error) {
        setError(timelineResponse.error);
      } else {
        setError('');
        setTimeline(timelineResponse.timeline);
        if (timelineResponse.timeline.plots.length > 0) {
          const maxEnd = Math.ceil(Math.max(...timelineResponse.timeline.plots.map(p => p.end)));
          setChapterCount(prev => Math.max(prev, Math.max(1, maxEnd - 1)));
        }
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const authResponse = await api.get('/api/auth/me');
        if (authResponse.error || !authResponse.user) {
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
            : 9;
          const minChapters = maxEnd > 0 ? Math.max(1, maxEnd - 1) : 9;
          setChapterCount(Math.max(minChapters, 9));
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
        description: newPlot.description.trim() || undefined,
        start: newPlot.start,
        end: newPlot.end,
        color: newPlot.color || DEFAULT_PLOT_COLOR
      });

      if (response.error) {
        setPlotError(response.error);
      } else {
        setShowNewPlotModal(false);
        setNewPlot({ name: '', description: '', start: 1, end: 2, color: DEFAULT_PLOT_COLOR });
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

  // Update plot
  const handleUpdatePlot = async (e) => {
    e.preventDefault();
    if (!editingPlot) return;
    setPlotError('');
    if (!editingPlot.name.trim()) {
      setPlotError(t('plotNameRequired'));
      return;
    }
    if (editingPlot.start > editingPlot.end) {
      setPlotError(t('startCantBeGreaterThanEnd'));
      return;
    }
    setUpdating(true);
    try {
      const response = await api.put(`/api/plots/${editingPlot.id}`, {
        name: editingPlot.name.trim(),
        description: editingPlot.description != null ? editingPlot.description.trim() || null : null,
        start: editingPlot.start,
        end: editingPlot.end,
        color: editingPlot.color && /^#[0-9A-Fa-f]{6}$/.test(editingPlot.color) ? editingPlot.color : null
      });
      if (response.error) {
        setPlotError(response.error);
      } else {
        setEditingPlot(null);
        await fetchTimeline();
      }
    } catch (err) {
      console.error('Error updating plot:', err);
      setPlotError(t('errorUpdatingPlot'));
    } finally {
      setUpdating(false);
    }
  };

  // Delete plot (called from confirmation modal)
  const handleDeletePlot = async () => {
    if (!plotToDelete) return;
    setDeleting(true);
    setPlotError('');
    try {
      const response = await api.delete(`/api/plots/${plotToDelete.id}`);
      if (response.error) {
        setPlotError(response.error);
      } else {
        setPlotToDelete(null);
        await fetchTimeline();
      }
    } catch (err) {
      console.error('Error deleting plot:', err);
      setPlotError(t('errorDeletingPlot'));
    } finally {
      setDeleting(false);
    }
  };

  // Create new note
  const handleCreateNote = async (e) => {
    e.preventDefault();
    setNoteError('');
    if (!newNote.name.trim()) {
      setNoteError(t('noteNameRequired'));
      return;
    }
    setCreatingNote(true);
    try {
      const response = await api.post('/api/notes', {
        timelineId: id,
        name: newNote.name.trim(),
        position: newNote.position,
        color: newNote.color || DEFAULT_NOTE_COLOR,
      });
      if (response.error) {
        setNoteError(response.error);
      } else {
        setShowNewNoteModal(false);
        setNewNote({ name: '', position: 1, color: DEFAULT_NOTE_COLOR });
        await fetchTimeline();
      }
    } catch (err) {
      console.error('Error creating note:', err);
      setNoteError(t('errorCreatingNote'));
    } finally {
      setCreatingNote(false);
    }
  };

  // Update note
  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!editingNote) return;
    setNoteError('');
    if (!editingNote.name.trim()) {
      setNoteError(t('noteNameRequired'));
      return;
    }
    setUpdatingNote(true);
    try {
      const response = await api.put(`/api/notes/${editingNote.id}`, {
        name: editingNote.name.trim(),
        position: editingNote.position,
        color: editingNote.color && /^#[0-9A-Fa-f]{6}$/.test(editingNote.color) ? editingNote.color : null,
      });
      if (response.error) {
        setNoteError(response.error);
      } else {
        setEditingNote(null);
        await fetchTimeline();
      }
    } catch (err) {
      console.error('Error updating note:', err);
      setNoteError(t('errorUpdatingNote'));
    } finally {
      setUpdatingNote(false);
    }
  };

  // Delete note
  const handleDeleteNote = async () => {
    if (!noteToDelete) return;
    setDeletingNote(true);
    setNoteError('');
    try {
      const response = await api.delete(`/api/notes/${noteToDelete.id}`);
      if (response.error) {
        setNoteError(response.error);
      } else {
        setNoteToDelete(null);
        await fetchTimeline();
      }
    } catch (err) {
      console.error('Error deleting note:', err);
      setNoteError(t('errorDeletingNote'));
    } finally {
      setDeletingNote(false);
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

  // Global mouse move/up handlers for dragging
  useEffect(() => {
    if (!dragState) return;

    const currentState = dragState;

    const handleMouseMove = (e) => {
      const clientX = e.clientX;
      const state = currentState;
      if (!state || !timeline || !axisRef.current) return;
      const { mode, plotId, originalStart, originalEnd, startX, axisWidth } = state;
      if (!axisWidth || chapterCount <= 0) return;
      const deltaPx = clientX - startX;
      const chapterWidthPx = axisWidth / chapterCount;
      if (!chapterWidthPx) return;
      const quarterWidthPx = chapterWidthPx / 4;
      const deltaQuarters = deltaPx / quarterWidthPx;
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
      const maxPos = chapterCount + 1;
      newStart = Math.max(1, Math.min(newStart, maxPos));
      newEnd = Math.max(1, Math.min(newEnd, maxPos));
      if (newStart > newEnd) {
        if (mode === 'resize-start') newStart = newEnd;
        else if (mode === 'resize-end') newEnd = newStart;
        else {
          const length = originalEnd - originalStart;
          newStart = Math.max(1, Math.min(newStart, maxPos - length));
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

  // Plot color: use saved color or default
  const getPlotColor = (plot) => (plot?.color && /^#[0-9A-Fa-f]{6}$/.test(plot.color)) ? plot.color : DEFAULT_PLOT_COLOR;

  // Note color: use saved color or default
  const getNoteColor = (note) => (note?.color && /^#[0-9A-Fa-f]{6}$/.test(note.color)) ? note.color : DEFAULT_NOTE_COLOR;

  const notes = timeline?.notes ?? [];

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
        <div className="page-main timeline-view-main">
          <div className="page-content">
            <div className="timeline-error-page">
              <i className="fa-solid fa-exclamation-triangle"></i>
              <p>{error || t('timelineNotFound')}</p>
              <button onClick={() => navigate('/plots')} className="back-button">
                {t('backToTimelines')}
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const chapters = getChapters(chapterCount);
  const minChapters = getMinChapters();
  // 10 chapters visible before scroll; min 100px per chapter (a bit wider)
  const MIN_CHAPTER_PX = schematicWidth > 0 ? Math.max(100, Math.floor(schematicWidth / 10)) : 100;
  const timelineContentWidth = chapterCount * MIN_CHAPTER_PX;

  return (
    <div className="timeline-view-container">
      <Header />

      <div className="page-main timeline-view-main">
        <div className="timeline-view-layout">
          <aside className="timeline-view-aside">
            <div className="timeline-plots-card">
              <div className="timeline-aside-notes">
                <h3 className="timeline-plots-card-title">{t('notes')}</h3>
                <button type="button" className="new-note-button" onClick={() => { setNoteError(''); setNewNote({ name: '', position: 1, color: DEFAULT_NOTE_COLOR }); setShowNewNoteModal(true); }} title={t('newNote')}>
                  <i className="fa-solid fa-plus" />
                </button>
              </div>
              {notes.length === 0 ? (
                <p className="timeline-plots-card-empty">{t('noNotesYet')}</p>
              ) : (
                <div className="timeline-plots-list-wrap">
                  <ul className="timeline-notes-list">
                    {notes.map((note) => (
                      <li key={note.id} className={`timeline-notes-list-item ${highlightedNoteId === note.id ? 'highlighted' : ''}`}>
                        <div className="legend-item-main legend-item-clickable" onClick={() => setHighlightedNoteId(highlightedNoteId === note.id ? null : note.id)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHighlightedNoteId(highlightedNoteId === note.id ? null : note.id); } }}>
                          <span className="legend-color" style={{ backgroundColor: getNoteColor(note) }} />
                          <div className="legend-item-text">
                            <div className="legend-name">{note.name}</div>
                            <div className="legend-range">{t('chapter')} {formatChapterValue(note.position)}</div>
                          </div>
                        </div>
                        <button type="button" className="legend-edit-button" onClick={(e) => { e.stopPropagation(); setNoteError(''); setEditingNote({ ...note, color: note.color ?? DEFAULT_NOTE_COLOR }); }} title={t('editNote')}>
                          <i className="fa-solid fa-pen" />
                        </button>
                        <button type="button" className="legend-delete-button" onClick={(e) => { e.stopPropagation(); setNoteError(''); setNoteToDelete(note); }} title={t('delete')}>
                          <i className="fa-solid fa-trash" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="timeline-aside-tramas">
                <h3 className="timeline-plots-card-title timeline-tramas-title">{t('tramas')}</h3>
                <button type="button" className="new-plot-button-aside" onClick={() => setShowNewPlotModal(true)} title={t('newPlot')}>
                  <i className="fa-solid fa-plus" />
                </button>
              </div>
              {timeline.plots.length === 0 ? (
                <p className="timeline-plots-card-empty">{t('noPlotsYet')}</p>
              ) : (
                <div className="timeline-plots-list-wrap">
              <ul className="timeline-plots-list">
                {timeline.plots.map((plot) => (
                  <li key={plot.id} className={`timeline-plots-list-item ${highlightedPlotId === plot.id ? 'highlighted' : ''}`}>
                    <div
                      className="legend-item-main legend-item-clickable"
                      onClick={() => setHighlightedPlotId(highlightedPlotId === plot.id ? null : plot.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHighlightedPlotId(highlightedPlotId === plot.id ? null : plot.id); } }}
                      title={t('highlightOnTimeline')}
                    >
                      <span
                        className="legend-color"
                        style={{ backgroundColor: getPlotColor(plot) }}
                      />
                      <div className="legend-item-text">
                        <div className="legend-name">{plot.name}</div>
                        <div className="legend-range">{t('chapter')} {formatChapterValue(plot.start)} - {formatChapterValue(plot.end)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="legend-edit-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlotError('');
                        setEditingPlot({ ...plot, description: plot.description ?? '', color: plot.color ?? DEFAULT_PLOT_COLOR });
                      }}
                      title={t('editPlot')}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>
                    <button
                      type="button"
                      className="legend-delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPlotError('');
                        setPlotToDelete(plot);
                      }}
                      title={t('delete')}
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </li>
                ))}
              </ul>
                </div>
              )}
            </div>
          </aside>

          <main className="timeline-view-main-content">
            <div className="timeline-view-content">
            <div className="timeline-schematic">
          {/* Chapter controls and add actions: same row, add buttons on the right */}
          <div className="chapter-controls">
            <div className="chapter-controls-center">
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
          </div>

          {/* Only this part scrolls horizontally */}
          <div className="timeline-scroll-wrapper" ref={schematicRef}>
          <div className="timeline-scroll-content" style={{ width: timelineContentWidth, minWidth: timelineContentWidth }}>
            <div className="chapter-headers">
              {chapters.map((chapter) => (
                <div 
                  key={chapter} 
                  className="chapter-header"
                  style={{ width: MIN_CHAPTER_PX, minWidth: MIN_CHAPTER_PX }}
                >
                  <span className="chapter-label">{t('chapter')} {chapter}</span>
                </div>
              ))}
            </div>

            {/* Notas: puntos por encima de la línea divisora (solo puntos; tooltip fijo al hover, puede salir del row) */}
            <div className="timeline-notes-row" style={{ width: timelineContentWidth, minWidth: timelineContentWidth }}>
              {notes.map((note) => {
                const left = getPosition(note.position, chapterCount);
                const color = getNoteColor(note);
                const notesAtSamePosition = notes.filter(n => Math.abs(n.position - note.position) < 0.01);
                const names = notesAtSamePosition.map(n => n.name);
                return (
                  <div
                    key={note.id}
                    className={`timeline-note-marker ${highlightedNoteId === note.id ? 'highlighted' : ''}`}
                    style={{
                      left: `${left}%`,
                      backgroundColor: color,
                    }}
                    onClick={() => setHighlightedNoteId(highlightedNoteId === note.id ? null : note.id)}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setNoteTooltip({
                        names,
                        left: rect.left + rect.width / 2,
                        top: rect.top,
                      });
                    }}
                    onMouseLeave={() => setNoteTooltip(null)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setHighlightedNoteId(highlightedNoteId === note.id ? null : note.id); } }}
                  />
                );
              })}
            </div>
            {/* Tooltip en posición fija para que pueda sobresalir por encima del contenedor */}
            {noteTooltip && (
              <div
                className="timeline-note-tooltip-fixed"
                style={{
                  left: noteTooltip.left,
                  top: noteTooltip.top,
                }}
                role="tooltip"
              >
                {noteTooltip.names.map((name, i) => (
                  <span key={i} className="timeline-note-tooltip-line">{name}</span>
                ))}
              </div>
            )}

            <div
              className="timeline-axis"
              ref={axisRef}
              style={{
                width: timelineContentWidth,
                minWidth: timelineContentWidth,
                height: timeline.plots.length > 0
                  ? Math.max(100, timeline.plots.length * 40)
                  : 100
              }}
            >
              {/* Chapter divisions */}
              <div className="chapter-divisions">
                {chapters.map((chapter) => (
                  <div 
                    key={chapter} 
                    className="chapter-section"
                    style={{ width: MIN_CHAPTER_PX, minWidth: MIN_CHAPTER_PX, flex: `0 0 ${MIN_CHAPTER_PX}px` }}
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

            {/* Plots on timeline (stacked in rows) */}
            <div
              className="timeline-plots"
              style={{
                height: timeline.plots.length > 0 ? timeline.plots.length * 40 : 0
              }}
            >
              {timeline.plots.map((plot, index) => {
                const left = getPosition(plot.start, chapterCount);
                const width = getWidth(plot.start, plot.end, chapterCount);
                const color = getPlotColor(plot);
                const top = index * 40;

                return (
                  <div
                    key={plot.id}
                    className={`timeline-plot-segment ${dragState?.plotId === plot.id ? 'dragging' : ''} ${highlightedPlotId === plot.id ? 'highlighted' : ''}`}
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 2)}%`,
                      top: `${top}px`,
                      height: '36px',
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
          </div>
          </div>
            </div>
            </div>

          {timeline.plots.length === 0 && (
            <div className="no-plots">
              <i className="fa-solid fa-diagram-project"></i>
              <p>{t('noPlotsYet')}</p>
              <span>{t('addPlotsToTimeline')}</span>
            </div>
          )}

          </main>
        </div>
      </div>

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
              <div className="form-group">
                <label>{t('plotDescription')}</label>
                <textarea
                  value={newPlot.description}
                  onChange={(e) => setNewPlot({ ...newPlot, description: e.target.value })}
                  placeholder={t('plotDescriptionPlaceholder')}
                  disabled={creating}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>{t('plotColor')}</label>
                <div className="plot-color-input-wrap">
                  <input
                    type="color"
                    value={newPlot.color || DEFAULT_PLOT_COLOR}
                    onChange={(e) => setNewPlot({ ...newPlot, color: e.target.value })}
                    disabled={creating}
                    className="plot-color-picker"
                    title={t('plotColor')}
                  />
                  <input
                    type="text"
                    value={newPlot.color || DEFAULT_PLOT_COLOR}
                    onChange={(e) => setNewPlot({ ...newPlot, color: e.target.value })}
                    disabled={creating}
                    className="plot-color-hex"
                    placeholder="#8b7355"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('startChapter')}</label>
                  <input
                    type="number"
                    min="1"
                    max={chapterCount + 1}
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
                    max={chapterCount + 1}
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

      {/* Edit Plot Modal */}
      {editingPlot && (
        <div className="plot-modal-overlay" onClick={() => setEditingPlot(null)}>
          <div className="plot-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('editPlot')}</h2>
            <form onSubmit={handleUpdatePlot}>
              <div className="form-group">
                <label>{t('plotName')}</label>
                <input
                  type="text"
                  value={editingPlot.name}
                  onChange={(e) => setEditingPlot({ ...editingPlot, name: e.target.value })}
                  placeholder={t('plotNamePlaceholder')}
                  disabled={updating || deleting}
                />
              </div>
              <div className="form-group">
                <label>{t('plotDescription')}</label>
                <textarea
                  value={editingPlot.description ?? ''}
                  onChange={(e) => setEditingPlot({ ...editingPlot, description: e.target.value })}
                  placeholder={t('plotDescriptionPlaceholder')}
                  disabled={updating || deleting}
                  rows={3}
                />
              </div>
              <div className="form-group">
                <label>{t('plotColor')}</label>
                <div className="plot-color-input-wrap">
                  <input
                    type="color"
                    value={editingPlot.color ?? DEFAULT_PLOT_COLOR}
                    onChange={(e) => setEditingPlot({ ...editingPlot, color: e.target.value })}
                    disabled={updating || deleting}
                    className="plot-color-picker"
                    title={t('plotColor')}
                  />
                  <input
                    type="text"
                    value={editingPlot.color ?? DEFAULT_PLOT_COLOR}
                    onChange={(e) => setEditingPlot({ ...editingPlot, color: e.target.value })}
                    disabled={updating || deleting}
                    className="plot-color-hex"
                    placeholder="#8b7355"
                    maxLength={7}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>{t('startChapter')}</label>
                  <input
                    type="number"
                    min="1"
                    max={chapterCount + 1}
                    step="0.25"
                    value={editingPlot.start}
                    onChange={(e) => setEditingPlot({ ...editingPlot, start: parseFloat(e.target.value) || 1 })}
                    disabled={updating || deleting}
                  />
                </div>
                <div className="form-group">
                  <label>{t('endChapter')}</label>
                  <input
                    type="number"
                    min="1"
                    max={chapterCount + 1}
                    step="0.25"
                    value={editingPlot.end}
                    onChange={(e) => setEditingPlot({ ...editingPlot, end: parseFloat(e.target.value) || 1 })}
                    disabled={updating || deleting}
                  />
                </div>
              </div>
              {plotError && <p className="plot-error">{plotError}</p>}
              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setEditingPlot(null)}
                  disabled={updating}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="create-button"
                  disabled={updating}
                >
                  {updating ? t('creating') : t('savePlot')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete plot confirmation */}
      {plotToDelete && (
        <div className="plot-modal-overlay" onClick={() => !deleting && setPlotToDelete(null)}>
          <div className="plot-modal plot-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('confirmDeletePlot')}</h2>
            <p className="plot-confirm-message">
              {t('deletePlotConfirmMessage').replace('{name}', plotToDelete.name)}
            </p>
            {plotError && <p className="plot-error">{plotError}</p>}
            <div className="modal-buttons">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setPlotToDelete(null)}
                disabled={deleting}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="confirm-delete-button"
                onClick={handleDeletePlot}
                disabled={deleting}
              >
                {deleting ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Note Modal (no description) */}
      {showNewNoteModal && (
        <div className="plot-modal-overlay" onClick={() => setShowNewNoteModal(false)}>
          <div className="plot-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('newNote')}</h2>
            <form onSubmit={handleCreateNote}>
              <div className="form-group">
                <label>{t('noteName')}</label>
                <input type="text" value={newNote.name} onChange={(e) => setNewNote({ ...newNote, name: e.target.value })} placeholder={t('noteNamePlaceholder')} disabled={creatingNote} autoFocus />
              </div>
              <div className="form-group">
                <label>{t('notePosition')}</label>
                <input type="number" min="1" max={chapterCount + 1} step="0.25" value={newNote.position} onChange={(e) => setNewNote({ ...newNote, position: parseFloat(e.target.value) || 1 })} disabled={creatingNote} />
              </div>
              <div className="form-group">
                <label>{t('plotColor')}</label>
                <div className="plot-color-input-wrap">
                  <input type="color" value={newNote.color || DEFAULT_NOTE_COLOR} onChange={(e) => setNewNote({ ...newNote, color: e.target.value })} disabled={creatingNote} className="plot-color-picker" />
                  <input type="text" value={newNote.color || DEFAULT_NOTE_COLOR} onChange={(e) => setNewNote({ ...newNote, color: e.target.value })} disabled={creatingNote} className="plot-color-hex" maxLength={7} />
                </div>
              </div>
              {noteError && <p className="plot-error">{noteError}</p>}
              <div className="modal-buttons">
                <button type="button" className="cancel-button" onClick={() => setShowNewNoteModal(false)} disabled={creatingNote}>{t('cancel')}</button>
                <button type="submit" className="create-button" disabled={creatingNote}>{creatingNote ? t('creating') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal (no description) */}
      {editingNote && (
        <div className="plot-modal-overlay" onClick={() => setEditingNote(null)}>
          <div className="plot-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('editNote')}</h2>
            <form onSubmit={handleUpdateNote}>
              <div className="form-group">
                <label>{t('noteName')}</label>
                <input type="text" value={editingNote.name} onChange={(e) => setEditingNote({ ...editingNote, name: e.target.value })} placeholder={t('noteNamePlaceholder')} disabled={updatingNote} />
              </div>
              <div className="form-group">
                <label>{t('notePosition')}</label>
                <input type="number" min="1" max={chapterCount + 1} step="0.25" value={editingNote.position} onChange={(e) => setEditingNote({ ...editingNote, position: parseFloat(e.target.value) || 1 })} disabled={updatingNote} />
              </div>
              <div className="form-group">
                <label>{t('plotColor')}</label>
                <div className="plot-color-input-wrap">
                  <input type="color" value={editingNote.color ?? DEFAULT_NOTE_COLOR} onChange={(e) => setEditingNote({ ...editingNote, color: e.target.value })} disabled={updatingNote} className="plot-color-picker" />
                  <input type="text" value={editingNote.color ?? DEFAULT_NOTE_COLOR} onChange={(e) => setEditingNote({ ...editingNote, color: e.target.value })} disabled={updatingNote} className="plot-color-hex" maxLength={7} />
                </div>
              </div>
              {noteError && <p className="plot-error">{noteError}</p>}
              <div className="modal-buttons">
                <button type="button" className="cancel-button" onClick={() => setEditingNote(null)} disabled={updatingNote}>{t('cancel')}</button>
                <button type="submit" className="create-button" disabled={updatingNote}>{updatingNote ? t('creating') : t('savePlot')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete note confirmation */}
      {noteToDelete && (
        <div className="plot-modal-overlay" onClick={() => !deletingNote && setNoteToDelete(null)}>
          <div className="plot-modal plot-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('confirmDeleteNote')}</h2>
            <p className="plot-confirm-message">{t('deleteNoteConfirmMessage').replace('{name}', noteToDelete.name)}</p>
            {noteError && <p className="plot-error">{noteError}</p>}
            <div className="modal-buttons">
              <button type="button" className="cancel-button" onClick={() => setNoteToDelete(null)} disabled={deletingNote}>{t('cancel')}</button>
              <button type="button" className="confirm-delete-button" onClick={handleDeleteNote} disabled={deletingNote}>{deletingNote ? t('deleting') : t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default TimelineView;
