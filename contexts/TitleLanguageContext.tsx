import React, { createContext, useState, useContext, ReactNode } from 'react';
import { TitleLanguage } from '../types';

interface TitleLanguageContextType {
  titleLanguage: TitleLanguage;
  setTitleLanguage: (language: TitleLanguage) => void;
}

const TitleLanguageContext = createContext<TitleLanguageContextType | undefined>(undefined);

export const TitleLanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [titleLanguage, setTitleLanguage] = useState<TitleLanguage>('english');

  const value = { titleLanguage, setTitleLanguage };

  return (
    <TitleLanguageContext.Provider value={value}>
      {children}
    </TitleLanguageContext.Provider>
  );
};

export const useTitleLanguage = (): TitleLanguageContextType => {
  const context = useContext(TitleLanguageContext);
  if (context === undefined) {
    throw new Error('useTitleLanguage must be used within a TitleLanguageProvider');
  }
  return context;
};
