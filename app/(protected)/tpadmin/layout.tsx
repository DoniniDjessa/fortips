"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/lang";
import {
  TPADMIN_ACCESS_CODE,
  TPADMIN_ACCESS_STORAGE_KEY,
  TPADMIN_ACCESS_CODE_STORAGE_KEY,
} from "@/lib/tpadmin";

export default function TpAdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const lang = useLang();
  const [input, setInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.sessionStorage.getItem(TPADMIN_ACCESS_STORAGE_KEY);
    const storedCode = window.sessionStorage.getItem(TPADMIN_ACCESS_CODE_STORAGE_KEY);
    if (stored === "true" && storedCode === TPADMIN_ACCESS_CODE) {
      setIsUnlocked(true);
    }
    setIsReady(true);
  }, []);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (input.trim() === TPADMIN_ACCESS_CODE) {
      window.sessionStorage.setItem(TPADMIN_ACCESS_STORAGE_KEY, "true");
      window.sessionStorage.setItem(TPADMIN_ACCESS_CODE_STORAGE_KEY, TPADMIN_ACCESS_CODE);
      setIsUnlocked(true);
    } else {
      router.replace("/");
    }
  };

  if (!isReady) {
    return null;
  }

  if (!isUnlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900/5 p-4 dark:bg-slate-900/40">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg ring-1 ring-slate-900/5 dark:bg-slate-800 dark:ring-slate-700"
        >
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {lang === "fr" ? "Espace réservé" : "Restricted area"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            {lang === "fr"
              ? "Saisissez le code d'accès pour consulter la zone d'administration."
              : "Enter the access code to view the admin area."}
          </p>
          <label className="mt-4 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {lang === "fr" ? "Code d'accès" : "Access code"}
          </label>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium tracking-[0.3em] text-slate-900 outline-none transition focus:border-falcon-primary focus:ring-2 focus:ring-falcon-primary/40 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            placeholder="••••"
          />
          <button
            type="submit"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-falcon-primary px-4 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-falcon-primary"
          >
            {lang === "fr" ? "Valider" : "Submit"}
          </button>
        </form>
      </div>
    );
  }

  return <>{children}</>;
}

