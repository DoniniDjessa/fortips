"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "fr" | "en";

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextType | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (stored === "fr" || stored === "en") {
      setLangState(stored);
    }
  }, []);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("lang", newLang);
    }
  };

  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  const context = useContext(LangContext);
  if (!context) {
    // Fallback for components outside provider
    const [lang] = useState<Lang>(() => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("lang");
        return stored === "fr" || stored === "en" ? stored : "fr";
      }
      return "fr";
    });
    return lang;
  }
  return context.lang;
}

export function useSetLang() {
  const context = useContext(LangContext);
  if (!context) {
    return (newLang: Lang) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("lang", newLang);
      }
    };
  }
  return context.setLang;
}

