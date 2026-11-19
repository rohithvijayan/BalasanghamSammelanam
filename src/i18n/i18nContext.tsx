import React, { createContext, useContext, useState, useEffect } from 'react';
import ml from './ml.json';
import en from './en.json';

export type Language = 'ml' | 'en';
type TranslationKeys = keyof typeof ml;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys, fallback?: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ml,
  en,
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred_lang');
    if (saved === 'ml' || saved === 'en') return saved;
    // Default to Malayalam if browser language begins with 'ml'
    if (typeof navigator !== 'undefined' && navigator.language?.startsWith('ml')) {
      return 'ml';
    }
    return 'ml'; // default for Balasangham conference is Malayalam
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred_lang', lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: TranslationKeys, fallback?: string): string => {
    const text = translations[language]?.[key] || translations['en']?.[key] || fallback || key;
    return text;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
