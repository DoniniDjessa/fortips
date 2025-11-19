"use client";

import { useLang, useSetLang } from "@/lib/lang-context";

export default function LangToggle() {
  const lang = useLang();
  const setLang = useSetLang();

  const toggle = () => {
    const next = lang === "fr" ? "en" : "fr";
    setLang(next);
  };

  const flagCode = lang === "fr" ? "fr" : "gb";
  const altLabel = lang === "fr" ? "Français" : "English";

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center justify-center rounded-full bg-white px-2.5 py-1.5 shadow-sm transition hover:shadow dark:border dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100"
      aria-label={altLabel}
    >
      <span className="flex h-4 w-6 items-center justify-center overflow-hidden rounded-[6px] border border-emerald-200/70 bg-slate-50 dark:border-emerald-700/60">
        <img
          src={`https://flagcdn.com/24x18/${flagCode}.png`}
          alt={altLabel}
          width={24}
          height={18}
          className="block h-auto w-full"
        />
      </span>
    </button>
  );
}


