import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Language, translations } from '../i18n/locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.zh;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  // 始终使用英文，不再从存储中读取
  React.useEffect(() => {
    setLanguageState('en');
  }, []);

  const setLanguage = async (_lang: Language) => {
    // 不再允许切换语言，始终使用英文
    setLanguageState('en');
  };

  // 始终提供 context，即使在加载期间也使用默认值
  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

