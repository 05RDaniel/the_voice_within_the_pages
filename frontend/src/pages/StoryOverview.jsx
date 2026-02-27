import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/useLanguage';
import { useLayout } from '../contexts/LayoutContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './StoryOverview.css';

function StoryOverview() {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sectionError, setSectionError] = useState('');
  const { t } = useLanguage();
  const { setPageTitle, setBackUrl } = useLayout();
  const navigate = useNavigate();

  useEffect(() => {
    setPageTitle(story?.title ?? '');
    setBackUrl('/stories');
  }, [story, setPageTitle, setBackUrl]);

  const fetchStory = async () => {
    try {
      const response = await api.get(`/api/stories/${id}`);
      if (response.error) {
        if (response.error === 'No autenticado') navigate('/login');
        else setError(response.error);
      } else {
        setError('');
        setStory(response.story);
      }
    } catch (err) {
      console.error('Error fetching story:', err);
      setError(t('errorLoadingStory'));
    }
  };

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      await fetchStory();
      setLoading(false);
    };
    run();
  }, [id, navigate, t]);

  // Character state
  const [showNewCharacter, setShowNewCharacter] = useState(false);
  const [newCharacter, setNewCharacter] = useState({ name: '', description: '' });
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [characterToDelete, setCharacterToDelete] = useState(null);
  const [creatingCharacter, setCreatingCharacter] = useState(false);
  const [updatingCharacter, setUpdatingCharacter] = useState(false);
  const [deletingCharacter, setDeletingCharacter] = useState(false);
  const [chapterVisibilityModal, setChapterVisibilityModal] = useState(null);
  const [updatingChapterVisibility, setUpdatingChapterVisibility] = useState(false);

  const handleCreateCharacter = async (e) => {
    e.preventDefault();
    setSectionError('');
    if (!newCharacter.name.trim()) {
      setSectionError(t('characterName') + ' required');
      return;
    }
    setCreatingCharacter(true);
    try {
      const response = await api.post('/api/characters', {
        storyId: id,
        name: newCharacter.name.trim(),
        description: newCharacter.description.trim() || undefined,
      });
      if (response.error) setSectionError(response.error);
      else {
        setShowNewCharacter(false);
        setNewCharacter({ name: '', description: '' });
        await fetchStory();
      }
    } catch (err) {
      setSectionError(t('errorLoadingStory'));
    } finally {
      setCreatingCharacter(false);
    }
  };

  const handleUpdateCharacter = async (e) => {
    e.preventDefault();
    if (!editingCharacter) return;
    setSectionError('');
    if (!editingCharacter.name.trim()) return;
    setUpdatingCharacter(true);
    try {
      const response = await api.put(`/api/characters/${editingCharacter.id}`, {
        name: editingCharacter.name.trim(),
        description: editingCharacter.description != null ? editingCharacter.description.trim() || null : null,
      });
      if (response.error) setSectionError(response.error);
      else {
        setEditingCharacter(null);
        await fetchStory();
      }
    } catch (err) {
      setSectionError(t('errorLoadingStory'));
    } finally {
      setUpdatingCharacter(false);
    }
  };

  const handleDeleteCharacter = async () => {
    if (!characterToDelete) return;
    setDeletingCharacter(true);
    setSectionError('');
    try {
      const response = await api.delete(`/api/characters/${characterToDelete.id}`);
      if (response.error) setSectionError(response.error);
      else {
        setCharacterToDelete(null);
        await fetchStory();
      }
    } catch (err) {
      setSectionError(t('errorLoadingStory'));
    } finally {
      setDeletingCharacter(false);
    }
  };

  if (loading) {
    return (
      <div className="story-overview-container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="story-overview-container">
        <Header />
        <div className="story-overview-error">
          <p>{error || t('errorLoadingStory')}</p>
          <button type="button" className="back-button" onClick={() => navigate('/stories')}>
            {t('back')}
          </button>
        </div>
      </div>
    );
  }

  const timelines = story.timelines || [];
  const characters = story.characters || [];
  const chapters = story.chapters || [];

  const getFirstPhrase = (content) => {
    if (!content || typeof content !== 'string') return '';
    const trimmed = content.trim();
    if (!trimmed) return '';
    const match = trimmed.match(/^[^.!?]*[.!?]?/);
    const first = match ? match[0].trim() : trimmed.slice(0, 80);
    return first.length < trimmed.length ? first + '…' : first;
  };

  const getVisibilityIcon = (vis) => {
    switch (vis) {
      case 'PUBLIC': return <i className="fa-solid fa-globe" title={t('public')} />;
      case 'PRIVATE': return <i className="fa-solid fa-lock" title={t('private')} />;
      default: return null;
    }
  };

  const handleConfirmChapterVisibility = async () => {
    if (!chapterVisibilityModal) return;
    const { chapter, newVisibility } = chapterVisibilityModal;
    setUpdatingChapterVisibility(true);
    setSectionError('');
    try {
      const response = await api.put(`/api/stories/${id}/chapters/${chapter.id}`, {
        visibility: newVisibility,
      });
      if (response.error) setSectionError(response.error);
      else {
        setChapterVisibilityModal(null);
        await fetchStory();
      }
    } catch (err) {
      setSectionError(t('errorLoadingStory'));
    } finally {
      setUpdatingChapterVisibility(false);
    }
  };

  return (
    <div className="story-overview-container">
      <Header />

      <div className="page-main story-overview-main">
        <div className="story-overview-layout">
          {/* Side: Líneas temporales */}
          <aside className="story-overview-aside story-overview-aside-left">
            <div className="story-overview-side-card">
              <h2 className="story-overview-side-card-title">
                <i className="fa-solid fa-clock-rotate-left"></i>
                {t('timelines')}
              </h2>
              {timelines.length === 0 ? (
                <p className="story-overview-empty">{t('noTimelinesYet')}</p>
              ) : (
                <div className="story-overview-side-list-wrap">
                  <div className="story-overview-timelines-list">
                    {timelines.map((tl) => (
                      <div
                        key={tl.id}
                        className="story-overview-timeline-card"
                        onClick={() => navigate(`/timeline/${tl.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/timeline/${tl.id}`); } }}
                      >
                        <span className="story-overview-timeline-name">{tl.name}</span>
                        <span className="story-overview-timeline-meta">
                          {tl._count?.plots ?? 0} {t('plots')}, {tl._count?.notes ?? 0} {t('notes')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Centro: capítulos */}
          <main className="story-overview-center">
            <div className="story-overview-center-inner">
              <div className="story-overview-actions">
                <button
                  type="button"
                  className="story-overview-edit-button"
                  onClick={() => navigate(`/story/${id}/edit`)}
                >
                  <i className="fa-solid fa-pen"></i>
                  <span>{t('editStory')}</span>
                </button>
              </div>
              <section className="story-overview-chapters-section" aria-label={t('chapters')}>
                <h2 className="story-overview-chapters-title">
                  <i className="fa-solid fa-book-open" />
                  {t('chapters')}
                </h2>
                {chapters.length === 0 ? (
                  <p className="story-overview-empty">{t('noChaptersYet')}</p>
                ) : (
                  <ul className="story-overview-chapters-list">
                    {chapters.map((ch) => (
                      <li key={ch.id} className="story-overview-chapter-card">
                        <div className="story-overview-chapter-main">
                          <div className="story-overview-chapter-info">
                            <h3 className="story-overview-chapter-name">{ch.name || t('untitledChapter')}</h3>
                            {ch.content && (
                              <p className="story-overview-chapter-preview">{getFirstPhrase(ch.content)}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            className="story-overview-chapter-privacy-btn"
                            onClick={() => {
                            const next = { PRIVATE: 'PUBLIC', PUBLIC: 'UNLISTED', UNLISTED: 'PRIVATE' }[ch.visibility] || 'PUBLIC';
                            setChapterVisibilityModal({ chapter: ch, newVisibility: next });
                          }}
                            title={t('changeChapterVisibility')}
                            aria-label={t('changeChapterVisibility')}
                          >
                            {ch.visibility === 'PRIVATE' ? (
                              <i className="fa-solid fa-lock" />
                            ) : (
                              <i className="fa-solid fa-lock-open" />
                            )}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </main>

          {/* Side: Personajes */}
          <aside className="story-overview-aside story-overview-aside-right">
            <div className="story-overview-side-card">
              <div className="story-overview-section-head">
                <h2 className="story-overview-side-card-title">
                  <i className="fa-solid fa-users"></i>
                  {t('characters')}
                </h2>
                <button type="button" className="story-overview-add-btn" onClick={() => { setSectionError(''); setNewCharacter({ name: '', description: '' }); setShowNewCharacter(true); }}>
                  <i className="fa-solid fa-plus"></i> {t('addCharacter')}
                </button>
              </div>
              {characters.length === 0 ? (
                <p className="story-overview-empty">{t('noCharactersYet')}</p>
              ) : (
                <div className="story-overview-side-list-wrap">
                  <ul className="story-overview-characters-list">
                    {characters.map((ch) => (
                      <li key={ch.id} className="story-overview-character-item">
                        <div className="story-overview-character-content">
                          <strong className="story-overview-character-name">{ch.name}</strong>
                          {ch.description && (
                            <p className="story-overview-character-desc">{ch.description}</p>
                          )}
                        </div>
                        <div className="story-overview-item-actions">
                          <button type="button" className="story-overview-edit-btn" onClick={() => setEditingCharacter({ ...ch, description: ch.description ?? '' })} title={t('editCharacter')}><i className="fa-solid fa-pen"></i></button>
                          <button type="button" className="story-overview-delete-btn" onClick={() => setCharacterToDelete(ch)} title={t('delete')}><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {sectionError && <div className="story-overview-toast-error">{sectionError}</div>}

      {/* New Character Modal */}
      {showNewCharacter && (
        <div className="story-overview-modal-overlay" onClick={() => setShowNewCharacter(false)}>
          <div className="story-overview-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('newCharacter')}</h3>
            <form onSubmit={handleCreateCharacter}>
              <div className="story-overview-form-group">
                <label>{t('characterName')}</label>
                <input type="text" value={newCharacter.name} onChange={(e) => setNewCharacter({ ...newCharacter, name: e.target.value })} disabled={creatingCharacter} autoFocus />
              </div>
              <div className="story-overview-form-group">
                <label>{t('characterDescription')}</label>
                <textarea value={newCharacter.description} onChange={(e) => setNewCharacter({ ...newCharacter, description: e.target.value })} disabled={creatingCharacter} rows={3} />
              </div>
              <div className="story-overview-modal-buttons">
                <button type="button" className="story-overview-cancel-btn" onClick={() => setShowNewCharacter(false)} disabled={creatingCharacter}>{t('cancel')}</button>
                <button type="submit" className="story-overview-submit-btn" disabled={creatingCharacter}>{creatingCharacter ? t('creating') : t('create')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Character Modal */}
      {editingCharacter && (
        <div className="story-overview-modal-overlay" onClick={() => setEditingCharacter(null)}>
          <div className="story-overview-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('editCharacter')}</h3>
            <form onSubmit={handleUpdateCharacter}>
              <div className="story-overview-form-group">
                <label>{t('characterName')}</label>
                <input type="text" value={editingCharacter.name} onChange={(e) => setEditingCharacter({ ...editingCharacter, name: e.target.value })} disabled={updatingCharacter} />
              </div>
              <div className="story-overview-form-group">
                <label>{t('characterDescription')}</label>
                <textarea value={editingCharacter.description ?? ''} onChange={(e) => setEditingCharacter({ ...editingCharacter, description: e.target.value })} disabled={updatingCharacter} rows={3} />
              </div>
              <div className="story-overview-modal-buttons">
                <button type="button" className="story-overview-cancel-btn" onClick={() => setEditingCharacter(null)} disabled={updatingCharacter}>{t('cancel')}</button>
                <button type="submit" className="story-overview-submit-btn" disabled={updatingCharacter}>{updatingCharacter ? t('saving') : t('save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Character Confirm */}
      {characterToDelete && (
        <div className="story-overview-modal-overlay" onClick={() => !deletingCharacter && setCharacterToDelete(null)}>
          <div className="story-overview-modal story-overview-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{t('confirmDeleteCharacter')}</h3>
            <p className="story-overview-confirm-msg">{characterToDelete.name}</p>
            <div className="story-overview-modal-buttons">
              <button type="button" className="story-overview-cancel-btn" onClick={() => setCharacterToDelete(null)} disabled={deletingCharacter}>{t('cancel')}</button>
              <button type="button" className="story-overview-delete-confirm-btn" onClick={handleDeleteCharacter} disabled={deletingCharacter}>{deletingCharacter ? t('deleting') : t('delete')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Change chapter visibility confirm */}
      {chapterVisibilityModal && (() => {
        const visLabel = { PUBLIC: t('public'), PRIVATE: t('private') }[chapterVisibilityModal.newVisibility] || chapterVisibilityModal.newVisibility;
        const chapterName = `"${chapterVisibilityModal.chapter.name || t('untitledChapter')}"`;
        const confirmText = t('confirmChangeChapterVisibilityMessage')
          .replace('{name}', chapterName)
          .replace('{visibility}', visLabel);
        return (
          <div className="story-overview-modal-overlay" onClick={() => !updatingChapterVisibility && setChapterVisibilityModal(null)}>
            <div className="story-overview-modal story-overview-confirm-modal" onClick={(e) => e.stopPropagation()}>
              <p className="story-overview-confirm-msg story-overview-confirm-msg-long">{confirmText}</p>
              <div className="story-overview-modal-buttons">
                <button type="button" className="story-overview-cancel-btn" onClick={() => setChapterVisibilityModal(null)} disabled={updatingChapterVisibility}>{t('cancel')}</button>
                <button type="button" className="story-overview-submit-btn" onClick={handleConfirmChapterVisibility} disabled={updatingChapterVisibility}>
                  {updatingChapterVisibility ? t('saving') : t('confirm')}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      <Footer />
    </div>
  );
}

export default StoryOverview;
