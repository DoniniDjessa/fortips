"use client";

import { useEffect, useState } from "react";

export type Lang = "fr" | "en";

export function useLang(defaultLang: Lang = "fr") {
  const [lang, setLang] = useState<Lang>(defaultLang);
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (stored === "fr" || stored === "en") setLang(stored);
  }, []);
  return lang;
}


