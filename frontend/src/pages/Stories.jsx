import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useLayout } from '../contexts/LayoutContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './Stories.css';

function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewStoryForm, setShowNewStoryForm] = useState(false);
  const [newStory, setNewStory] = useState({ title: '', visibility: 'PRIVATE' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { t } = useLanguage();
  const { setPageTitle, setBackUrl } = useLayout();
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle(t('stories'));
    setBackUrl('/scriptorium');
  }, [t, setPageTitle, setBackUrl]);

  const fetchStories = async () => {
    try {
      const response = await api.get('/api/stories');
      if (response.error) {
        if (response.error === 'No autenticado') {
          navigate('/login');
        }
        setError(response.error);
      } else {
        setStories(response.stories || []);
      }
    } catch (err) {
      console.error('Error fetching stories:', err);
      setError(t('errorLoadingStories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [navigate]);

  const handleCreateStory = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await api.post('/api/stories', newStory);
      if (response.error) {
        setError(response.error);
      } else {
        setStories([response.story, ...stories]);
        setNewStory({ title: '', visibility: 'PRIVATE' });
        setShowNewStoryForm(false);
      }
    } catch (err) {
      console.error('Error creating story:', err);
      setError(t('errorCreatingStory'));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteStory = async (storyId) => {
    setDeleting(true);
    try {
      const response = await api.delete(`/api/stories/${storyId}`);
      if (response.error) {
        setError(response.error);
      } else {
        setStories(stories.filter(s => s.id !== storyId));
      }
    } catch (err) {
      console.error('Error deleting story:', err);
      setError(t('errorDeletingStory'));
    } finally {
      setDeleting(false);
      setDeleteConfirm(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'PUBLIC':
        return <i className="fa-solid fa-globe" title={t('public')}></i>;
      case 'PRIVATE':
        return <i className="fa-solid fa-lock" title={t('private')}></i>;
      case 'UNLISTED':
        return <i className="fa-solid fa-link" title={t('unlisted')}></i>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="stories-container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  return (
    <div className="stories-container">
      <Header />

      <div className="page-main stories-main">
        <div className="stories-layout">
          <aside className="stories-aside">
            <div className="stories-aside-card">
              <h3 className="stories-aside-card-title">{t('quickAccess')}</h3>
              <ul className="stories-aside-list">
                <li>
                  <button type="button" className="stories-aside-link" onClick={() => navigate('/scriptorium')}>
                    <i className="fa-solid fa-feather-pointed"></i> {t('scriptorium')}
                  </button>
                </li>
                <li>
                  <button type="button" className="stories-aside-link" onClick={() => navigate('/plots')}>
                    <i className="fa-solid fa-diagram-project"></i> {t('timelines')}
                  </button>
                </li>
                <li>
                  <button type="button" className="stories-aside-link" onClick={() => navigate('/profile')}>
                    <i className="fa-solid fa-user"></i> {t('myProfile')}
                  </button>
                </li>
              </ul>
            </div>
          </aside>

          <main className="stories-main-content">
            <div className="page-content">
        {error && <p className="stories-error">{error}</p>}

        <div className="stories-grid">
          <button
            type="button"
            className="story-card story-card-new"
            onClick={() => setShowNewStoryForm(true)}
            aria-label={t('newStory')}
          >
            <span className="story-card-new-circle">
              <i className="fa-solid fa-plus"></i>
            </span>
          </button>
          {stories.map((story) => (
            <div
              key={story.id}
              className="story-card"
              onClick={() => navigate(`/story/${story.id}`)}
            >
              <div className="story-card-content">
                <div className="story-card-header">
                  <h3 className="story-card-title">{story.title}</h3>
                  <span className="story-card-meta">
                    {getVisibilityIcon(story.visibility)} {t(story.visibility.toLowerCase())}
                  </span>
                </div>
                <div className="story-card-footer">
                  <span className="story-card-date">
                    <i className="fa-solid fa-calendar"></i> {formatDate(story.createdAt)}
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="story-card-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(story);
                }}
                title={t('delete')}
              >
                <i className="fa-solid fa-trash"></i>
              </button>
            </div>
          ))}
        </div>

        {stories.length === 0 && !error && (
          <div className="no-stories">
            <i className="fa-solid fa-book-open"></i>
            <p>{t('noStoriesYet')}</p>
            <p className="no-stories-hint">{t('createFirstStory')}</p>
          </div>
        )}

        {/* New Story Modal */}
        {showNewStoryForm && (
          <div className="story-modal-overlay" onClick={() => setShowNewStoryForm(false)}>
            <div className="story-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{t('createNewStory')}</h2>
              <form onSubmit={handleCreateStory}>
                <div className="form-group">
                  <label htmlFor="title">{t('storyTitle')}</label>
                  <input
                    type="text"
                    id="title"
                    value={newStory.title}
                    onChange={(e) => setNewStory({ ...newStory, title: e.target.value })}
                    required
                    disabled={creating}
                    placeholder={t('storyTitlePlaceholder')}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="visibility">{t('visibility')}</label>
                  <select
                    id="visibility"
                    value={newStory.visibility}
                    onChange={(e) => setNewStory({ ...newStory, visibility: e.target.value })}
                    disabled={creating}
                  >
                    <option value="PRIVATE">{t('private')}</option>
                    <option value="PUBLIC">{t('public')}</option>
                    <option value="UNLISTED">{t('unlisted')}</option>
                  </select>
                </div>
                <div className="modal-buttons">
                  <button 
                    type="button" 
                    className="cancel-button"
                    onClick={() => setShowNewStoryForm(false)}
                    disabled={creating}
                  >
                    {t('cancel')}
                  </button>
                  <button type="submit" className="create-button" disabled={creating}>
                    {creating ? '...' : t('create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="story-modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="story-modal story-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <h2>{t('confirmDelete')}</h2>
              <p>{t('deleteStoryWarning')}</p>
              <p className="delete-story-title">"{deleteConfirm.title}"</p>
              <div className="modal-buttons">
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="button" 
                  className="delete-button"
                  onClick={() => handleDeleteStory(deleteConfirm.id)}
                  disabled={deleting}
                >
                  {deleting ? '...' : t('delete')}
                </button>
              </div>
            </div>
          </div>
        )}
            </div>
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default Stories;
