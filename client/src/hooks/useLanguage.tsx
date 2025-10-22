import React, { createContext, useContext, useState, useEffect } from 'react';
import { initI18n, setAppLanguage, getAppLanguage, t, formatNumber, formatDate } from '../i18n';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => Promise<void>;
  t: (key: string, options?: any) => string;
  formatNumber: (number: number, locale?: string) => string;
  formatDate: (date: Date, locale?: string) => string;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<string>('fr');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        await initI18n();
        const savedLanguage = getAppLanguage();
        setCurrentLanguage(savedLanguage);
      } catch (error) {
        console.warn('Failed to initialize language:', error);
        setCurrentLanguage('fr'); // Fallback to French
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  const handleSetLanguage = async (lang: string) => {
    try {
      await setAppLanguage(lang);
      setCurrentLanguage(lang);
    } catch (error) {
      console.warn('Failed to set language:', error);
    }
  };

  const value: LanguageContextType = {
    currentLanguage,
    setLanguage: handleSetLanguage,
    t,
    formatNumber,
    formatDate,
    isLoading,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Convenience hook for translations
export function useTranslation() {
  const { t, currentLanguage } = useLanguage();
  return { t, currentLanguage };
}
