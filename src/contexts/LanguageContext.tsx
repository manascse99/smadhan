import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

// Import all translations
import en from "@/locales/en.json";
import hi from "@/locales/hi.json";
import ta from "@/locales/ta.json";
import te from "@/locales/te.json";
import bn from "@/locales/bn.json";
import mr from "@/locales/mr.json";
import gu from "@/locales/gu.json";
import kn from "@/locales/kn.json";
import ml from "@/locales/ml.json";
import pa from "@/locales/pa.json";

type TranslationKey = keyof typeof en;

const translations: Record<string, Record<string, string>> = {
  en,
  hi,
  ta,
  te,
  bn,
  mr,
  gu,
  kn,
  ml,
  pa,
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("preferred_language") || "en";
  });

  useEffect(() => {
    const fetchLanguagePreference = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if ((data as any)?.preferred_language) {
          const lang = (data as any).preferred_language;
          setLanguageState(lang);
          localStorage.setItem("preferred_language", lang);
        }
      } catch (error) {
        console.error("Error fetching language preference:", error);
      }
    };

    fetchLanguagePreference();
  }, [user]);

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    localStorage.setItem("preferred_language", lang);

    if (user) {
      try {
        await supabase
          .from("profiles")
          .update({ preferred_language: lang } as any)
          .eq("id", user.id);
      } catch (error) {
        console.error("Error saving language preference:", error);
      }
    }
  };

  const t = (key: string): string => {
    const currentTranslations = translations[language] || translations.en;
    return currentTranslations[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
