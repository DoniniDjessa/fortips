"use client";

import { useEffect, useState } from "react";

export type Lang = "fr" | "en";

export default function LangToggle() {
  const [lang, setLang] = useState<Lang>("fr");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    if (stored === "fr" || stored === "en") setLang(stored);
  }, []);

  const toggle = () => {
    const next = lang === "fr" ? "en" : "fr";
    setLang(next);
    localStorage.setItem("lang", next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm bg-white text-gray-900 shadow-sm hover:shadow dark:bg-slate-700 dark:text-gray-100 transition"
      aria-label="Changer la langue / Change language"
    >
      {lang === "fr" ? "FR" : "EN"}
    </button>
  );
}


