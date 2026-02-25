import { useState, useEffect, useRef, useCallback } from 'react';
import { useTutorial } from '../contexts/TutorialContext';
import { useLanguage } from '../contexts/useLanguage';
import './TutorialOverlay.css';

const CARD_WIDTH = 380;
const CARD_HEIGHT_ESTIMATE = 300;
const SPOTLIGHT_PADDING = 10;
const CARD_OFFSET = 16;

function TutorialOverlay() {
  const { isOpen, currentStep, stepIndex, stepCount, hasNext, hasPrev, closeTutorial, nextStep, prevStep } = useTutorial();
  const { t } = useLanguage();
  const [spotlightRect, setSpotlightRect] = useState(null);
  const [cardPosition, setCardPosition] = useState(null);
  const highlightedElRef = useRef(null);
  const cardRef = useRef(null);

  const removeHighlight = useCallback(() => {
    if (highlightedElRef.current) {
      highlightedElRef.current.classList.remove('tutorial-target-highlight');
      highlightedElRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isOpen || !currentStep?.targetId) {
      setSpotlightRect(null);
      setCardPosition(null);
      removeHighlight();
      return;
    }

    const run = () => {
      const el = document.querySelector(`[data-tutorial-target="${currentStep.targetId}"]`);
      if (!el) {
        setSpotlightRect(null);
        setCardPosition(null);
        removeHighlight();
        return;
      }

      removeHighlight();
      el.classList.add('tutorial-target-highlight');
      highlightedElRef.current = el;

      const rect = el.getBoundingClientRect();
      const padding = SPOTLIGHT_PADDING;
      const sr = {
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      };
      setSpotlightRect(sr);

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 16;
      let top = sr.top + sr.height + CARD_OFFSET;
      let left = sr.left + (sr.width / 2) - (CARD_WIDTH / 2);
      if (top + CARD_HEIGHT_ESTIMATE > vh - margin) {
        top = sr.top - CARD_HEIGHT_ESTIMATE - CARD_OFFSET;
      }
      if (left < margin) left = margin;
      if (left + CARD_WIDTH > vw - margin) left = vw - CARD_WIDTH - margin;
      if (top < margin) top = margin;
      setCardPosition({ top, left });
    };

    const raf = requestAnimationFrame(run);

    const handleUpdate = () => run();
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      removeHighlight();
    };
  }, [isOpen, currentStep?.targetId, stepIndex, removeHighlight]);

  useEffect(() => {
    return () => removeHighlight();
  }, [removeHighlight]);

  if (!isOpen || !currentStep) return null;

  const useDynamicPosition = spotlightRect != null && cardPosition != null;

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      {/* Backdrop: either full screen or 4 strips with hole */}
      {useDynamicPosition ? (
        <>
          <div className="tutorial-backdrop-strip" style={{ top: 0, left: 0, right: 0, height: spotlightRect.top }} onClick={closeTutorial} aria-hidden="true" />
          <div className="tutorial-backdrop-strip" style={{ top: spotlightRect.top + spotlightRect.height, left: 0, right: 0, bottom: 0 }} onClick={closeTutorial} aria-hidden="true" />
          <div className="tutorial-backdrop-strip" style={{ top: spotlightRect.top, left: 0, width: spotlightRect.left, height: spotlightRect.height }} onClick={closeTutorial} aria-hidden="true" />
          <div className="tutorial-backdrop-strip" style={{ top: spotlightRect.top, left: spotlightRect.left + spotlightRect.width, right: 0, height: spotlightRect.height }} onClick={closeTutorial} aria-hidden="true" />
          <div
            className="tutorial-spotlight-ring"
            style={{
              top: spotlightRect.top,
              left: spotlightRect.left,
              width: spotlightRect.width,
              height: spotlightRect.height,
            }}
            aria-hidden="true"
          />
        </>
      ) : (
        <div className="tutorial-backdrop" onClick={closeTutorial} aria-hidden="true" />
      )}

      <div
        ref={cardRef}
        className="tutorial-card"
        style={useDynamicPosition ? { position: 'fixed', top: cardPosition.top, left: cardPosition.left, maxWidth: CARD_WIDTH, zIndex: 1002 } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="tutorial-card-close"
          onClick={closeTutorial}
          aria-label={t('close')}
          title={t('close')}
        >
          <i className="fa-solid fa-xmark" />
        </button>
        <div className="tutorial-card-content">
          <h2 id="tutorial-title" className="tutorial-card-title">{t(currentStep.titleKey)}</h2>
          <p className="tutorial-card-body">{t(currentStep.bodyKey)}</p>
        </div>
        <div className="tutorial-card-footer">
          <span className="tutorial-step-indicator">
            {stepIndex + 1} / {stepCount}
          </span>
          <div className="tutorial-card-actions">
            {hasPrev && (
              <button type="button" className="tutorial-btn tutorial-btn-prev" onClick={prevStep}>
                {t('tutorialPrev')}
              </button>
            )}
            <button type="button" className="tutorial-btn tutorial-btn-next" onClick={nextStep}>
              {hasNext ? t('tutorialNext') : t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TutorialOverlay;
