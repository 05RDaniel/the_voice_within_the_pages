import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import Header from '../components/Header';
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
  const navigate = useNavigate();

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

  const stripHtml = (html) => {
    if (!html) return '';
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const getPreviewText = (content) => {
    const plainText = stripHtml(content);
    if (plainText.length > 150) {
      return plainText.substring(0, 150) + '...';
    }
    return plainText;
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

      <main className="stories-main">
        <div className="stories-header">
          <h1>{t('myStories')}</h1>
          <button 
            className="new-story-button"
            onClick={() => setShowNewStoryForm(true)}
          >
            <i className="fa-solid fa-plus"></i> {t('newStory')}
          </button>
        </div>

        {error && <div className="stories-error">{error}</div>}

        {/* New Story Modal */}
        {showNewStoryForm && (
          <div className="new-story-overlay" onClick={() => setShowNewStoryForm(false)}>
            <div className="new-story-modal" onClick={(e) => e.stopPropagation()}>
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
          <div className="new-story-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
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

        {stories.length === 0 ? (
          <div className="no-stories">
            <i className="fa-solid fa-book-open"></i>
            <p>{t('noStoriesYet')}</p>
            <p className="hint">{t('createFirstStory')}</p>
          </div>
        ) : (
          <div className="stories-grid">
            {stories.map((story) => (
              <div 
                key={story.id} 
                className="story-card"
                onClick={() => navigate(`/story/${story.id}`)}
              >
                <div className="story-header">
                  <h3>{story.title}</h3>
                  <div className="story-actions">
                    <span className="visibility-icon">{getVisibilityIcon(story.visibility)}</span>
                    <button 
                      className="delete-icon-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(story);
                      }}
                      title={t('delete')}
                    >
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
                {story.content && (
                  <p className="story-preview">
                    {getPreviewText(story.content)}
                  </p>
                )}
                <div className="story-footer">
                  <span className="story-date">
                    <i className="fa-solid fa-calendar"></i> {formatDate(story.createdAt)}
                  </span>
                  {story.updatedAt !== story.createdAt && (
                    <span className="story-updated">
                      <i className="fa-solid fa-pen"></i> {formatDate(story.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Stories;
