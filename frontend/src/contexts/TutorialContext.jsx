import { createContext, useContext, useState, useCallback, useRef } from 'react';

const TutorialContext = createContext();

const TUTORIAL_STEPS_BY_PATH = {
  '/home': [
    { titleKey: 'tutorialHomeScriptoriumTitle', bodyKey: 'tutorialHomeScriptoriumBody', targetId: 'scriptorium' },
    { titleKey: 'tutorialHomeArchiveTitle', bodyKey: 'tutorialHomeArchiveBody', targetId: 'archive' },
    { titleKey: 'tutorialHomeMenuTitle', bodyKey: 'tutorialHomeMenuBody', targetId: 'menu' },
  ],
};

export function TutorialProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [pathname, setPathname] = useState('');
  const [stepIndex, setStepIndex] = useState(0);
  const onTutorialOpenRef = useRef(null);

  const steps = TUTORIAL_STEPS_BY_PATH[pathname] || [];
  const currentStep = steps[stepIndex] ?? null;
  const hasNext = stepIndex < steps.length - 1;
  const hasPrev = stepIndex > 0;

  const openTutorial = useCallback((path) => {
    const p = path || '';
    const stepsForPath = TUTORIAL_STEPS_BY_PATH[p] || [];
    if (stepsForPath.length === 0) return;
    setPathname(p);
    setStepIndex(0);
    setIsOpen(true);
    onTutorialOpenRef.current?.();
  }, []);

  const closeTutorial = useCallback(() => {
    setIsOpen(false);
  }, []);

  const nextStep = useCallback(() => {
    if (hasNext) setStepIndex((i) => i + 1);
    else closeTutorial();
  }, [hasNext, closeTutorial]);

  const prevStep = useCallback(() => {
    if (hasPrev) setStepIndex((i) => i - 1);
  }, [hasPrev]);

  const setOnTutorialOpen = useCallback((callback) => {
    onTutorialOpenRef.current = callback;
  }, []);

  const value = {
    isOpen,
    steps,
    currentStep,
    stepIndex,
    stepCount: steps.length,
    hasNext,
    hasPrev,
    openTutorial,
    closeTutorial,
    nextStep,
    prevStep,
    setOnTutorialOpen,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
}
