import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
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
  const [activeFormats, setActiveFormats] = useState({});
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isInitialLoad = useRef(true);

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
          setContent(response.story.content || '');
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

  // Set initial content when loaded
  useEffect(() => {
    if (editorRef.current && content && isInitialLoad.current) {
      editorRef.current.innerHTML = content;
      isInitialLoad.current = false;
    }
  }, [content, loading]);

  // Auto-save with debounce
  useEffect(() => {
    if (!story || loading || isInitialLoad.current) return;
    
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

    const currentContent = editorRef.current ? editorRef.current.innerHTML : content;

    try {
      const response = await api.put(`/api/stories/${id}`, {
        title,
        content: currentContent,
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
    navigate('/stories');
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      setContent(editorRef.current.innerHTML);
      updateActiveFormats();
    }
  };

  const updateActiveFormats = useCallback(() => {
    const formats = {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikeThrough: document.queryCommandState('strikeThrough'),
    };
    setActiveFormats(formats);
  }, []);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleEditorChange();
  };

  const formatText = (format) => {
    execCommand(format);
  };

  const setFontSize = (size) => {
    // Remove existing font-size and apply new one via formatBlock for headings
    if (size === 'p') {
      execCommand('formatBlock', 'p');
    } else {
      execCommand('formatBlock', size);
    }
  };

  const insertList = (type) => {
    if (type === 'ul') {
      execCommand('insertUnorderedList');
    } else {
      execCommand('insertOrderedList');
    }
  };

  const insertQuote = () => {
    execCommand('formatBlock', 'blockquote');
  };

  const getWordCount = () => {
    if (!editorRef.current) return 0;
    const text = editorRef.current.innerText || '';
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const getCharCount = () => {
    if (!editorRef.current) return 0;
    return (editorRef.current.innerText || '').length;
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      formatText('bold');
    }
    // Ctrl/Cmd + I for italic
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      formatText('italic');
    }
    // Ctrl/Cmd + U for underline
    if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      formatText('underline');
    }
  };

  const handleSelectionChange = () => {
    updateActiveFormats();
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

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
    <div className="editor-container" onKeyDown={handleKeyDown}>
      {/* Editor Header */}
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

      {/* Formatting Toolbar */}
      <div className="formatting-toolbar">
        <div className="toolbar-group">
          <select 
            className="toolbar-select"
            onChange={(e) => setFontSize(e.target.value)}
            defaultValue="p"
          >
            <option value="p">{t('paragraph')}</option>
            <option value="h1">{t('heading')} 1</option>
            <option value="h2">{t('heading')} 2</option>
            <option value="h3">{t('heading')} 3</option>
          </select>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button 
            className={`toolbar-button ${activeFormats.bold ? 'active' : ''}`}
            onClick={() => formatText('bold')}
            title={`${t('bold')} (Ctrl+B)`}
          >
            <i className="fa-solid fa-bold"></i>
          </button>
          <button 
            className={`toolbar-button ${activeFormats.italic ? 'active' : ''}`}
            onClick={() => formatText('italic')}
            title={`${t('italic')} (Ctrl+I)`}
          >
            <i className="fa-solid fa-italic"></i>
          </button>
          <button 
            className={`toolbar-button ${activeFormats.underline ? 'active' : ''}`}
            onClick={() => formatText('underline')}
            title={`${t('underline')} (Ctrl+U)`}
          >
            <i className="fa-solid fa-underline"></i>
          </button>
          <button 
            className={`toolbar-button ${activeFormats.strikeThrough ? 'active' : ''}`}
            onClick={() => formatText('strikeThrough')}
            title={t('strikethrough')}
          >
            <i className="fa-solid fa-strikethrough"></i>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button 
            className="toolbar-button"
            onClick={() => insertList('ul')}
            title={t('bulletList')}
          >
            <i className="fa-solid fa-list-ul"></i>
          </button>
          <button 
            className="toolbar-button"
            onClick={() => insertList('ol')}
            title={t('numberedList')}
          >
            <i className="fa-solid fa-list-ol"></i>
          </button>
          <button 
            className="toolbar-button"
            onClick={insertQuote}
            title={t('quote')}
          >
            <i className="fa-solid fa-quote-left"></i>
          </button>
        </div>

        <div className="toolbar-divider"></div>

        <div className="toolbar-group">
          <button 
            className="toolbar-button"
            onClick={() => execCommand('justifyLeft')}
            title={t('alignLeft')}
          >
            <i className="fa-solid fa-align-left"></i>
          </button>
          <button 
            className="toolbar-button"
            onClick={() => execCommand('justifyCenter')}
            title={t('alignCenter')}
          >
            <i className="fa-solid fa-align-center"></i>
          </button>
          <button 
            className="toolbar-button"
            onClick={() => execCommand('justifyRight')}
            title={t('alignRight')}
          >
            <i className="fa-solid fa-align-right"></i>
          </button>
          <button 
            className="toolbar-button"
            onClick={() => execCommand('justifyFull')}
            title={t('alignJustify')}
          >
            <i className="fa-solid fa-align-justify"></i>
          </button>
        </div>
      </div>

      {/* Settings Dropdown */}
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

      {/* Error Message */}
      {error && <div className="editor-error">{error}</div>}

      {/* Main Editor */}
      <main className="editor-main">
        <div
          ref={editorRef}
          className="editor-content"
          contentEditable
          onInput={handleEditorChange}
          onBlur={handleEditorChange}
          data-placeholder={t('startWriting')}
          suppressContentEditableWarning
        />
      </main>

      {/* Editor Footer */}
      <footer className="editor-footer">
        <div className="word-count">
          <span>{getWordCount()} {t('words')}</span>
          <span className="separator">|</span>
          <span>{getCharCount()} {t('characters')}</span>
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
