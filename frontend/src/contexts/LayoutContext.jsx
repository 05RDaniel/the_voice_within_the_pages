import { createContext, useContext, useState } from 'react';

const LayoutContext = createContext();

export function LayoutProvider({ children }) {
  const [pageTitle, setPageTitle] = useState('');
  const [backUrl, setBackUrl] = useState(null);

  return (
    <LayoutContext.Provider value={{ pageTitle, setPageTitle, backUrl, setBackUrl }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}
