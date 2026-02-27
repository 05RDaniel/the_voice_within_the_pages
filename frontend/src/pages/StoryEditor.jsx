import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/useLanguage';
import { useTheme } from '../contexts/ThemeContext';
import './StoryEditor.css';

function StoryEditor() {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [title, setTitle] = useState('');
  const [chapters, setChapters] = useState([]);
  const [selectedChapterId, setSelectedChapterId] = useState(null);
  const [chapterName, setChapterName] = useState('');
  const [chapterContent, setChapterContent] = useState('');
  const [chapterVisibility, setChapterVisibility] = useState('PRIVATE');
  const [loading, setLoading] = useState(true);
  const [savingStory, setSavingStory] = useState(false);
  const [savingChapter, setSavingChapter] = useState(false);
  const [savedStory, setSavedStory] = useState(true);
  const [savedChapter, setSavedChapter] = useState(true);
  const [error, setError] = useState('');
  const [addingChapter, setAddingChapter] = useState(false);
  const [formatActive, setFormatActive] = useState({ bold: false, italic: false, underline: false });
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const storySaveTimeoutRef = useRef(null);
  const chapterSaveTimeoutRef = useRef(null);
  const editorRef = useRef(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await api.get(`/api/stories/${id}`);
        if (response.error) {
          if (response.error === 'No autenticado') navigate('/login');
          else setError(response.error);
        } else {
          setStory(response.story);
          setTitle(response.story.title ?? '');
          setChapters(response.story.chapters ?? []);
          const first = (response.story.chapters ?? [])[0];
          if (first) {
            setSelectedChapterId(first.id);
            setChapterName(first.name);
            setChapterContent(first.content ?? '');
            setChapterVisibility(first.visibility ?? 'PRIVATE');
          } else {
            setSelectedChapterId(null);
            setChapterName('');
            setChapterContent('');
            setChapterVisibility('PRIVATE');
          }
        }
      } catch (err) {
        setError(t('errorLoadingStory'));
      } finally {
        setLoading(false);
      }
    };
    fetchStory();
  }, [id, navigate, t]);

  const selectedChapter = chapters.find((c) => c.id === selectedChapterId);

  useEffect(() => {
    if (!story || loading) return;
    setSavedStory(false);
    if (storySaveTimeoutRef.current) clearTimeout(storySaveTimeoutRef.current);
    storySaveTimeoutRef.current = setTimeout(saveStory, 2000);
    return () => {
      if (storySaveTimeoutRef.current) clearTimeout(storySaveTimeoutRef.current);
    };
  }, [title]);

  useEffect(() => {
    if (!selectedChapterId || !story) return;
    setSavedChapter(false);
    if (chapterSaveTimeoutRef.current) clearTimeout(chapterSaveTimeoutRef.current);
    chapterSaveTimeoutRef.current = setTimeout(saveChapter, 2000);
    return () => {
      if (chapterSaveTimeoutRef.current) clearTimeout(chapterSaveTimeoutRef.current);
    };
  }, [chapterName, chapterContent, chapterVisibility]);

  useEffect(() => {
    if (selectedChapter) {
      setChapterName(selectedChapter.name);
      setChapterContent(selectedChapter.content ?? '');
      setChapterVisibility(selectedChapter.visibility ?? 'PRIVATE');
    }
  }, [selectedChapterId]);

  useEffect(() => {
    if (editorRef.current && selectedChapterId) {
      editorRef.current.innerHTML = selectedChapter?.content ?? '';
    }
  }, [selectedChapterId]);

  const updateFormatState = () => {
    const el = editorRef.current;
    if (!el || !selectedChapterId) return;
    const sel = document.getSelection();
    if (!sel || sel.rangeCount === 0 || !el.contains(sel.anchorNode)) {
      setFormatActive({ bold: false, italic: false, underline: false });
      return;
    }
    setFormatActive({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    });
  };

  useEffect(() => {
    document.addEventListener('selectionchange', updateFormatState);
    return () => document.removeEventListener('selectionchange', updateFormatState);
  }, [selectedChapterId]);

  const saveStory = async () => {
    if (!story || savingStory) return;
    setSavingStory(true);
    setError('');
    try {
      const response = await api.put(`/api/stories/${id}`, { title });
      if (response.error) setError(response.error);
      else {
        setStory(response.story);
        setSavedStory(true);
      }
    } catch (err) {
      setError(t('errorSavingStory'));
    } finally {
      setSavingStory(false);
    }
  };

  const applyFormat = (command) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, null);
    setChapterContent(el.innerHTML);
    setTimeout(updateFormatState, 0);
  };

  const saveChapter = async () => {
    if (!selectedChapterId || savingChapter) return;
    setSavingChapter(true);
    setError('');
    try {
      const response = await api.put(`/api/stories/${id}/chapters/${selectedChapterId}`, {
        name: chapterName,
        content: chapterContent,
        visibility: chapterVisibility,
      });
      if (response.error) setError(response.error);
      else {
        setChapters((prev) =>
          prev.map((c) => (c.id === selectedChapterId ? { ...c, ...response.chapter } : c))
        );
        setSavedChapter(true);
      }
    } catch (err) {
      setError(t('errorSavingStory'));
    } finally {
      setSavingChapter(false);
    }
  };

  const handleAddChapter = async () => {
    setAddingChapter(true);
    setError('');
    try {
      const response = await api.post(`/api/stories/${id}/chapters`, {
        name: t('untitledChapter') || 'Capítulo sin título',
        content: '',
        visibility: 'PRIVATE',
      });
      if (response.error) setError(response.error);
      else {
        setChapters((prev) => [...prev, response.chapter].sort((a, b) => a.order - b.order));
        setSelectedChapterId(response.chapter.id);
        setChapterName(response.chapter.name);
        setChapterContent(response.chapter.content ?? '');
        setChapterVisibility(response.chapter.visibility ?? 'PRIVATE');
      }
    } catch (err) {
      setError(t('errorSavingStory'));
    } finally {
      setAddingChapter(false);
    }
  };

  const handleDeleteChapter = async (chapterId) => {
    if (!chapterId) return;
    try {
      const response = await api.delete(`/api/stories/${id}/chapters/${chapterId}`);
      if (response.error) setError(response.error);
      else {
        const next = chapters.filter((c) => c.id !== chapterId);
        setChapters(next);
        if (selectedChapterId === chapterId) {
          const newSel = next[0]?.id ?? null;
          setSelectedChapterId(newSel);
          if (next[0]) {
            setChapterName(next[0].name);
            setChapterContent(next[0].content ?? '');
            setChapterVisibility(next[0].visibility ?? 'PRIVATE');
          } else {
            setChapterName('');
            setChapterContent('');
            setChapterVisibility('PRIVATE');
          }
        }
      }
    } catch (err) {
      setError(t('errorSavingStory'));
    }
  };

  const handleBack = () => {
    if (!savedStory) saveStory();
    if (selectedChapterId && !savedChapter) saveChapter();
    navigate(`/story/${id}`);
  };

  const getVisibilityIcon = (vis) => {
    switch (vis) {
      case 'PUBLIC': return <i className="fa-solid fa-globe" />;
      case 'PRIVATE': return <i className="fa-solid fa-lock" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="editor-container">
        <div className="loading">{t('loading')}</div>
      </div>
    );
  }

  if (error && !story) {
    return (
      <div className="editor-container">
        <div className="editor-error-page">
          <i className="fa-solid fa-exclamation-triangle" />
          <p>{error}</p>
          <button onClick={() => navigate('/stories')} className="back-button">
            {t('backToStories')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <header className="editor-header">
        <div className="editor-header-left">
          <button className="editor-back-button" onClick={handleBack} title={t('back')}>
            <i className="fa-solid fa-arrow-left" />
          </button>
          <div className="save-status">
            {savingStory || savingChapter ? (
              <span className="status-saving"><i className="fa-solid fa-spinner fa-spin" /> {t('saving')}</span>
            ) : savedStory && (selectedChapterId ? savedChapter : true) ? (
              <span className="status-saved"><i className="fa-solid fa-check" /> {t('saved')}</span>
            ) : (
              <span className="status-unsaved"><i className="fa-solid fa-circle" /> {t('unsaved')}</span>
            )}
          </div>
        </div>
        <div className="editor-header-center">
          <input
            type="text"
            className="title-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t('untitledStory')}
          />
        </div>
        <div className="editor-header-right">
          <button
            className="editor-theme-button"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {error && <div className="editor-error">{error}</div>}

      <div className="editor-body-with-chapters">
        <aside className="editor-chapters-sidebar">
          <div className="editor-chapters-head">
            <span className="editor-chapters-title">{t('chapters') || 'Capítulos'}</span>
            <button
              type="button"
              className="editor-add-chapter-btn"
              onClick={handleAddChapter}
              disabled={addingChapter}
              title={t('addChapter') || 'Añadir capítulo'}
            >
              <i className="fa-solid fa-plus" /> {t('addChapter') || 'Añadir'}
            </button>
          </div>
          <ul className="editor-chapters-list">
            {chapters.map((ch, idx) => (
              <li key={ch.id}>
                <button
                  type="button"
                  className={`editor-chapter-item ${selectedChapterId === ch.id ? 'active' : ''}`}
                  onClick={async () => {
                    if (selectedChapterId && selectedChapterId !== ch.id && !savedChapter) {
                      await saveChapter();
                    }
                    setSelectedChapterId(ch.id);
                  }}
                >
                  <span className="editor-chapter-num">{idx + 1}</span>
                  <span className="editor-chapter-name">{ch.name || t('untitledChapter')}</span>
                  <span className="editor-chapter-vis">{getVisibilityIcon(ch.visibility)}</span>
                </button>
                <button
                  type="button"
                  className="editor-chapter-delete"
                  onClick={(e) => { e.stopPropagation(); handleDeleteChapter(ch.id); }}
                  title={t('delete')}
                  aria-label={t('delete')}
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </li>
            ))}
          </ul>
          {chapters.length === 0 && (
            <p className="editor-chapters-empty">{t('noChaptersYet') || 'Añade un capítulo para empezar.'}</p>
          )}
        </aside>

        <main className="editor-main">
          {selectedChapterId ? (
            <>
              <div className="editor-chapter-meta">
                <input
                  type="text"
                  className="editor-chapter-name-input"
                  value={chapterName}
                  onChange={(e) => setChapterName(e.target.value)}
                  placeholder={t('untitledChapter') || 'Capítulo sin título'}
                />
                <select
                  value={chapterVisibility}
                  onChange={(e) => setChapterVisibility(e.target.value)}
                  className="editor-chapter-visibility"
                  title={t('visibility')}
                >
                  <option value="PRIVATE">{t('private')}</option>
                  <option value="PUBLIC">{t('public')}</option>
                </select>
              </div>
              <div className="editor-chapter-header">
                <div className="editor-format-toolbar">
                  <button
                    type="button"
                    className={`editor-format-btn ${formatActive.bold ? 'is-active' : ''}`}
                    title={t('bold') || 'Negrita'}
                    onClick={() => applyFormat('bold')}
                  >
                    <i className="fa-solid fa-bold" />
                  </button>
                  <button
                    type="button"
                    className={`editor-format-btn ${formatActive.italic ? 'is-active' : ''}`}
                    title={t('italic') || 'Cursiva'}
                    onClick={() => applyFormat('italic')}
                  >
                    <i className="fa-solid fa-italic" />
                  </button>
                  <button
                    type="button"
                    className={`editor-format-btn ${formatActive.underline ? 'is-active' : ''}`}
                    title={t('underline') || 'Subrayado'}
                    onClick={() => applyFormat('underline')}
                  >
                    <i className="fa-solid fa-underline" />
                  </button>
                </div>
              </div>
              <div
                ref={editorRef}
                className="editor-content editor-content-editable"
                contentEditable
                suppressContentEditableWarning
                data-placeholder={t('storyContentPlaceholder')}
                onInput={() => editorRef.current && setChapterContent(editorRef.current.innerHTML)}
                onFocus={updateFormatState}
                spellCheck
              />
            </>
          ) : (
            <div className="editor-no-chapter">
              <p>{t('noChaptersYet') || 'Añade un capítulo para empezar.'}</p>
              <button type="button" className="editor-add-chapter-btn-large" onClick={handleAddChapter} disabled={addingChapter}>
                <i className="fa-solid fa-plus" /> {t('addChapter') || 'Añadir capítulo'}
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default StoryEditor;
