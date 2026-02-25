import { useContext } from 'react';
import { LanguageContext } from './languageContextRef';

export const useLanguage = () => useContext(LanguageContext);
