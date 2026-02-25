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
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('PRIVATE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const saveTimeoutRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await api.get(`/api/stories/${id}`);
        if (response.error) {
          if (response.error === 'No autenticado') {
            navigate('/login');
          } else {
            setError(response.error);
          }
        } else {
          setStory(response.story);
          setTitle(response.story.title);
          setContent(response.story.content ?? '');
          setVisibility(response.story.visibility);
        }
      } catch (err) {
        console.error('Error fetching story:', err);
        setError(t('errorLoadingStory'));
      } finally {
        setLoading(false);
      }
    };

    fetchStory();
  }, [id, navigate, t]);

  // Auto-save with debounce
  useEffect(() => {
    if (!story || loading) return;

    setSaved(false);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, visibility]);

  const handleSave = async () => {
    if (!story || saving) return;

    setSaving(true);
    setError('');

    try {
      const response = await api.put(`/api/stories/${id}`, {
        title,
        content,
        visibility
      });

      if (response.error) {
        setError(response.error);
      } else {
        setStory(response.story);
        setSaved(true);
      }
    } catch (err) {
      console.error('Error saving story:', err);
      setError(t('errorSavingStory'));
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (!saved) {
      handleSave();
    }
    navigate(`/story/${id}`);
  };

  const handleAddSeparator = () => {
    const label = t('separatorDefaultLabel');
    const separator = `\n\n<separator>${label}</separator>\n\n`;
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = content.slice(0, start);
      const after = content.slice(end);
      setContent(before + separator + after);
      setTimeout(() => {
        ta.focus();
        const openTagLen = '\n\n<separator>'.length;
        const selectStart = start + openTagLen;
        const selectEnd = selectStart + label.length;
        ta.setSelectionRange(selectStart, selectEnd);
      }, 0);
    } else {
      setContent((prev) => prev + separator);
    }
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'PUBLIC':
        return <i className="fa-solid fa-globe"></i>;
      case 'PRIVATE':
        return <i className="fa-solid fa-lock"></i>;
      case 'UNLISTED':
        return <i className="fa-solid fa-link"></i>;
      default:
        return null;
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
          <i className="fa-solid fa-exclamation-triangle"></i>
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
          <button className="editor-back-button" onClick={handleBack} title={t('backToStories')}>
            <i className="fa-solid fa-arrow-left"></i>
          </button>
          <div className="save-status">
            {saving ? (
              <span className="status-saving"><i className="fa-solid fa-spinner fa-spin"></i> {t('saving')}</span>
            ) : saved ? (
              <span className="status-saved"><i className="fa-solid fa-check"></i> {t('saved')}</span>
            ) : (
              <span className="status-unsaved"><i className="fa-solid fa-circle"></i> {t('unsaved')}</span>
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
            className="editor-settings-button"
            onClick={() => setShowSettings(!showSettings)}
            title={t('settings')}
          >
            {getVisibilityIcon()}
          </button>
          <button
            className="editor-theme-button"
            onClick={toggleTheme}
            title={theme === 'dark' ? t('lightMode') : t('darkMode')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-dropdown">
          <div className="settings-item">
            <label>{t('visibility')}</label>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="PRIVATE">{t('private')}</option>
              <option value="PUBLIC">{t('public')}</option>
              <option value="UNLISTED">{t('unlisted')}</option>
            </select>
          </div>
        </div>
      )}

      {error && <div className="editor-error">{error}</div>}

      <main className="editor-main">
        <textarea
          ref={textareaRef}
          className="editor-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('storyContentPlaceholder')}
          spellCheck="true"
        />
      </main>

      <footer className="editor-footer">
        <div className="editor-footer-left">
          <button type="button" className="editor-add-separator-button" onClick={handleAddSeparator} title={t('addSeparator')}>
            <i className="fa-solid fa-scissors"></i> {t('addSeparator')}
          </button>
        </div>
        <div className="editor-footer-right">
          <button className="save-button" onClick={handleSave} disabled={saving || saved}>
            <i className="fa-solid fa-floppy-disk"></i> {t('save')}
          </button>
        </div>
      </footer>
    </div>
  );
}

export default StoryEditor;
