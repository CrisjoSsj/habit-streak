import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Language, TranslationKey, getTranslation, translations } from "@/lib/i18n";

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  translations: typeof translations.es | typeof translations.en;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem("habittrack-lang");
    return (stored === "en" || stored === "es") ? stored : "es";
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("habittrack-lang", lang);
  };

  const t = (key: TranslationKey): string => getTranslation(language, key);

  const currentTranslations = translations[language];

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations: currentTranslations }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
