"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const prefersDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = stored ? stored === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", shouldDark);
    setIsDark(shouldDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light" : "Switch to dark"}
      title={isDark ? "Light" : "Dark"}
      className="inline-flex items-center justify-center rounded-full h-9 w-9 bg-white text-gray-900 shadow-sm hover:shadow dark:bg-slate-700 dark:text-gray-100 transition"
    >
      {isDark ? (
        // Sun icon when dark (to indicate switching to light)
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12Z" />
          <path fillRule="evenodd" d="M12 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V3A.75.75 0 0 1 12 2.25Zm0 16.5a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Zm9-7.5a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5H20.25a.75.75 0 0 1 .75.75Zm-16.5 0a.75.75 0 0 1-.75.75H2.25a.75.75 0 0 1 0-1.5H3.75a.75.75 0 0 1 .75.75Zm12.728 6.478a.75.75 0 0 1 1.06 1.06l-1.06 1.061a.75.75 0 0 1-1.061-1.06l1.061-1.061Zm-11.313-11.314a.75.75 0 1 1 1.061 1.061L5.906 7.097A.75.75 0 0 1 4.845 6.036l1.06-1.061Zm12.374 1.06a.75.75 0 1 1-1.06-1.06l1.06-1.061a.75.75 0 0 1 1.061 1.06l-1.061 1.061ZM6.966 18.228a.75.75 0 0 1-1.06 1.06l-1.061-1.06a.75.75 0 1 1 1.06-1.061l1.061 1.061Z" clipRule="evenodd" />
        </svg>
      ) : (
        // New darker moon icon
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M17.293 14.95a6.75 6.75 0 1 1-8.243-8.243 7.5 7.5 0 1 0 8.243 8.243Z" />
        </svg>
      )}
    </button>
  );
}


