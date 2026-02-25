import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/useLanguage';
import { useLayout } from '../contexts/LayoutContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Plots.css';

function Plots() {
  const [loading, setLoading] = useState(true);
  const [timelines, setTimelines] = useState([]);
  const [error, setError] = useState('');
  const [showNewTimelineModal, setShowNewTimelineModal] = useState(false);
  const [newTimeline, setNewTimeline] = useState({ storyId: '', name: '' });
  const [stories, setStories] = useState([]);
  const [creating, setCreating] = useState(false);
  const [timelineToDelete, setTimelineToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [timelineError, setTimelineError] = useState('');
  const [selectedStoryId, setSelectedStoryId] = useState(null); // null = todas; id = filtrar por esa historia
  const { t } = useLanguage();
  const { setPageTitle, setBackUrl } = useLayout();
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle(t('plots'));
    setBackUrl('/scriptorium');
  }, [t, setPageTitle, setBackUrl]);

  const filteredTimelines = selectedStoryId
    ? timelines.filter((tl) => tl.story?.id === selectedStoryId)
    : timelines;

  const fetchTimelines = async () => {
    try {
      const response = await api.get('/api/timelines');
      if (response.timelines) setTimelines(response.timelines);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const fetchStories = async () => {
    try {
      const response = await api.get('/api/stories');
      if (response.stories) setStories(response.stories);
    } catch (err) {
      console.error('Error loading stories:', err);
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

        await Promise.all([fetchTimelines(), fetchStories()]);
      } catch (err) {
        console.error('Error:', err);
        setError(t('errorLoadingTimelines'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, t]);

  const openNewTimelineModal = async () => {
    setTimelineError('');
    setNewTimeline({ storyId: '', name: '' });
    setShowNewTimelineModal(true);
    try {
      const storiesResponse = await api.get('/api/stories');
      if (storiesResponse.stories) setStories(storiesResponse.stories);
    } catch (err) {
      console.error('Error loading stories:', err);
      setTimelineError(t('errorLoadingTimelines'));
    }
  };

  const handleCreateTimeline = async (e) => {
    e.preventDefault();
    setTimelineError('');

    if (!newTimeline.storyId) {
      setTimelineError(t('storyRequired'));
      return;
    }

    setCreating(true);
    try {
      const response = await api.post('/api/timelines', {
        storyId: newTimeline.storyId,
        name: newTimeline.name.trim() || undefined
      });

      if (response.error) {
        setTimelineError(response.error);
      } else {
        setShowNewTimelineModal(false);
        setNewTimeline({ storyId: '', name: '' });
        await fetchTimelines();
      }
    } catch (err) {
      console.error('Error creating timeline:', err);
      setTimelineError(t('errorCreatingTimeline'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTimeline = async () => {
    if (!timelineToDelete) return;
    setDeleting(true);
    setTimelineError('');
    try {
      const response = await api.delete(`/api/timelines/${timelineToDelete.id}`);
      if (response.error) {
        setTimelineError(response.error);
      } else {
        setTimelineToDelete(null);
        await fetchTimelines();
      }
    } catch (err) {
      console.error('Error deleting timeline:', err);
      setTimelineError(t('errorDeletingTimeline'));
    } finally {
      setDeleting(false);
    }
  };

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

      <div className="page-main plots-main">
        <div className="plots-layout">
          <aside className="plots-aside">
            <div className="plots-stories-card">
              <h3 className="plots-stories-card-title">{t('stories')}</h3>
              {stories.length === 0 ? (
                <p className="plots-stories-card-empty">{t('noStoriesYet')}</p>
              ) : (
                <div className="plots-stories-list-wrap">
                  <ul className="plots-stories-list">
                    <li key="all" className="plots-stories-list-item">
                      <button
                        type="button"
                        className={`plots-stories-link ${selectedStoryId === null ? 'selected' : ''}`}
                        onClick={() => setSelectedStoryId(null)}
                      >
                        {t('allStories')}
                      </button>
                    </li>
                    {stories.map((story) => (
                      <li key={story.id} className="plots-stories-list-item">
                        <button
                          type="button"
                          className={`plots-stories-link ${selectedStoryId === story.id ? 'selected' : ''}`}
                          onClick={() => setSelectedStoryId(selectedStoryId === story.id ? null : story.id)}
                        >
                          {story.title || t('untitledStory')}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>

          <main className="plots-main-content">
        <div className="page-content">
        {error && <p className="plots-error">{error}</p>}

        <div className="timelines-grid">
          <button
            type="button"
            className="timeline-card timeline-card-new"
            onClick={openNewTimelineModal}
            aria-label={t('newTimeline')}
          >
            <span className="timeline-card-new-circle">
              <i className="fa-solid fa-plus"></i>
            </span>
          </button>
          {filteredTimelines.map((timeline) => (
              <div 
                key={timeline.id} 
                className="timeline-card"
                onClick={() => navigate(`/timeline/${timeline.id}`)}
              >
                <div className="timeline-card-content">
                  <div className="timeline-header">
                    <h3 className="timeline-name">{timeline.name}</h3>
                    <span className="timeline-story-title">{timeline.story.title}</span>
                  </div>
                  <div className="timeline-info">
                    <span className="timeline-plots-count">
                      <i className="fa-solid fa-diagram-project"></i>
                      {timeline.plots.length} {timeline.plots.length === 1 ? t('plot') : t('plots')}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="timeline-card-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTimelineError('');
                    setTimelineToDelete(timeline);
                  }}
                  title={t('delete')}
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            ))}
        </div>
        </div>
      </main>
        </div>
      </div>

      {/* New Timeline Modal */}
      {showNewTimelineModal && (
        <div className="plot-modal-overlay" onClick={() => setShowNewTimelineModal(false)}>
          <div className="plot-modal plots-timeline-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('newTimeline')}</h2>
            <form onSubmit={handleCreateTimeline}>
              <div className="form-group">
                <label>{t('story')}</label>
                <select
                  value={newTimeline.storyId}
                  onChange={(e) => setNewTimeline({ ...newTimeline, storyId: e.target.value })}
                  disabled={creating}
                  required
                >
                  <option value="">{t('selectStory')}</option>
                  {stories.map((story) => (
                    <option key={story.id} value={story.id}>
                      {story.title || t('untitledStory')}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t('timelineName')}</label>
                <input
                  type="text"
                  value={newTimeline.name}
                  onChange={(e) => setNewTimeline({ ...newTimeline, name: e.target.value })}
                  placeholder={t('timelineNamePlaceholder')}
                  disabled={creating}
                />
              </div>
              {timelineError && <p className="plot-error">{timelineError}</p>}
              <div className="modal-buttons">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => setShowNewTimelineModal(false)}
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

      {/* Delete timeline confirmation */}
      {timelineToDelete && (
        <div className="plot-modal-overlay" onClick={() => !deleting && setTimelineToDelete(null)}>
          <div className="plot-modal plots-timeline-modal plots-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h2>{t('confirmDeleteTimeline')}</h2>
            <p className="plot-confirm-message">
              {t('deleteTimelineConfirmMessage').replace('{name}', timelineToDelete.name)}
            </p>
            {timelineError && <p className="plot-error">{timelineError}</p>}
            <div className="modal-buttons">
              <button
                type="button"
                className="cancel-button"
                onClick={() => setTimelineToDelete(null)}
                disabled={deleting}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="confirm-delete-button"
                onClick={handleDeleteTimeline}
                disabled={deleting}
              >
                {deleting ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default Plots;
