"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useMobileMenu } from "./mobile-menu-context";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const lang = useLang();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success(t(lang, "common.signedOut"));
    setTimeout(() => { router.push("/login"); }, 50);
  };

  const navItems = [
    {
      href: "/predictions",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M3 9h18" />
          <path d="M9 21V9" />
        </svg>
      ),
      label: t(lang, "nav.myPredictions"),
      desc: t(lang, "nav.myPredictionsDesc"),
    },
    {
      href: "/predictions/new",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M5 12h14" />
          <path d="M12 5v14" />
        </svg>
      ),
      label: t(lang, "nav.newPrediction"),
      desc: t(lang, "nav.newPredictionDesc"),
    },
    {
      href: "/stats",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      ),
      label: t(lang, "nav.statistics"),
      desc: t(lang, "nav.statisticsDesc"),
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex h-[calc(100vh-3rem)] flex-col justify-between rounded-[2.2rem] border border-slate-200/70 bg-white/70 p-4 shadow-[0_30px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-[0_28px_70px_rgba(15,23,42,0.7)] ${
          isCollapsed ? "mx-3 mt-4 w-[4.75rem]" : "mx-6 mt-6 w-[16rem]"
        }`}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-[1.6rem] border border-slate-200/70 bg-white/80 px-3 py-2 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
            {!isCollapsed && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
                  {t(lang, "nav.navigation")}
                </p>
                <p className="text-[9px] text-slate-400 dark:text-slate-500">
                  {t(lang, "nav.quickSelection")}
                </p>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200/70 bg-white text-slate-500 transition hover:border-[var(--color-falcon-primary)] hover:text-[var(--color-falcon-primary)] dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
              aria-label={isCollapsed ? t(lang, "nav.expand") : t(lang, "nav.collapse")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? "" : "rotate-180"}`}
              >
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-3.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.label : undefined}
                  className={`group relative flex items-center gap-3 rounded-[1.5rem] border border-transparent px-3 py-3 text-slate-500 transition-all duration-200 hover:border-[var(--color-falcon-primary)]/50 hover:bg-white/90 hover:text-[var(--color-falcon-primary)] dark:text-slate-200 dark:hover:bg-slate-900/70 ${
                    isCollapsed ? "justify-center px-0 py-2" : ""
                  } ${isActive ? "border-[var(--color-falcon-primary)] bg-white text-[var(--color-falcon-primary)] shadow-md dark:bg-slate-900/70" : ""}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(44,123,229,0.08)] text-[var(--color-falcon-primary)] shadow-sm dark:bg-[rgba(44,123,229,0.16)] ${isCollapsed ? "" : "mr-1.5"}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-200">
                        {item.label}
                      </div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-400">{item.desc}</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
        {!isCollapsed && (
          <div className="space-y-3.5">
            <div className="rounded-[1.6rem] border border-slate-200/80 bg-white/85 p-4 text-[9px] text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-200">
                {t(lang, "nav.quickTips")}
              </p>
              <p className="mt-2 leading-4">
                {t(lang, "nav.quickTipsText")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/profile"
                className={`group relative flex items-center gap-3 rounded-[1.5rem] border border-transparent px-3 py-3 text-slate-500 transition-all duration-200 hover:border-[var(--color-falcon-primary)]/50 hover:bg-white/90 hover:text-[var(--color-falcon-primary)] dark:text-slate-200 dark:hover:bg-slate-900/70 ${
                  pathname === "/profile" ? "border-[var(--color-falcon-primary)] bg-white text-[var(--color-falcon-primary)] shadow-md dark:bg-slate-900/70" : ""
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(44,123,229,0.08)] text-[var(--color-falcon-primary)] shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-200">
                    {t(lang, "nav.profile")}
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-400">{t(lang, "nav.profileDesc")}</div>
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                className="group relative flex items-center gap-3 rounded-[1.5rem] border border-transparent px-3 py-3 text-slate-500 transition-all duration-200 hover:border-[rgba(230,55,87,0.5)] hover:bg-[rgba(230,55,87,0.08)] hover:text-[#c81f3f] dark:text-slate-200 dark:hover:bg-[rgba(230,55,87,0.14)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(230,55,87,0.08)] text-[#c81f3f] shadow-sm dark:bg-[rgba(230,55,87,0.14)]">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 8L19 12M19 12L15 16M19 12H9M13 5H7C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-200">
                    {t(lang, "nav.signOut")}
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-400">{t(lang, "nav.signOutDesc")}</div>
                </div>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Sidebar Overlay */}
      <>
        <div
          className={`md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <aside className={`md:hidden fixed left-0 top-0 z-50 h-full w-[16rem] overflow-y-auto rounded-r-[2.2rem] border-r border-slate-200/70 bg-white/95 p-4 shadow-[0_30px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_28px_70px_rgba(15,23,42,0.7)] transition-transform duration-300 ease-out ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-300">
                  {t(lang, "nav.menu")}
                </p>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200/70 bg-white text-slate-500 transition hover:border-[var(--color-falcon-primary)] hover:text-[var(--color-falcon-primary)] dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
                aria-label={t(lang, "common.close")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                >
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group relative flex items-center gap-3 rounded-[1.5rem] border border-transparent px-3 py-3 text-slate-500 transition-all duration-200 hover:border-[var(--color-falcon-primary)]/50 hover:bg-white/90 hover:text-[var(--color-falcon-primary)] dark:text-slate-200 dark:hover:bg-slate-900/70 ${
                  pathname === "/profile" ? "border-[var(--color-falcon-primary)] bg-white text-[var(--color-falcon-primary)] shadow-md dark:bg-slate-900/70" : ""
                }`}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(44,123,229,0.08)] text-[var(--color-falcon-primary)] shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-200">
                    {t(lang, "nav.profile")}
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-white">{t(lang, "nav.profileDesc")}</div>
                </div>
              </Link>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="group relative flex items-center gap-3 rounded-[1.5rem] border border-transparent px-3 py-3 text-slate-500 transition-all duration-200 hover:border-[rgba(230,55,87,0.5)] hover:bg-[rgba(230,55,87,0.08)] hover:text-[#c81f3f] dark:text-slate-200 dark:hover:bg-[rgba(230,55,87,0.14)]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[rgba(230,55,87,0.08)] text-[#c81f3f] shadow-sm dark:bg-[rgba(230,55,87,0.14)]">
                  <svg
                    className="h-5 w-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M15 8L19 12M19 12L15 16M19 12H9M13 5H7C5.89543 5 5 5.89543 5 7V17C5 18.1046 5.89543 19 7 19H13"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-200">
                    {t(lang, "nav.signOut")}
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-white">{t(lang, "nav.signOutDesc")}</div>
                </div>
              </button>
            </div>
          </aside>
        </>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 z-50 w-full overflow-hidden border-t border-slate-200/70 bg-white/90 backdrop-blur-lg dark:border-slate-700/60 dark:bg-slate-900/70">
        <div className="mx-auto flex h-12 w-full max-w-full items-center justify-around gap-2 px-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  isActive
                    ? "border-[var(--color-falcon-primary)] bg-[rgba(44,123,229,0.12)] text-[var(--color-falcon-primary)]"
                    : "border-transparent text-slate-500 dark:text-slate-300"
                } transition`}
              >
                <span className="inline-flex h-[18px] w-[18px] items-center justify-center">{item.icon}</span>
              </Link>
            );
          })}
          <Link
            href="/profile"
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              pathname === "/profile"
                ? "border-[var(--color-falcon-primary)] bg-[rgba(44,123,229,0.12)] text-[var(--color-falcon-primary)]"
                : "border-transparent text-slate-500 dark:text-slate-300"
            } transition`}
          >
            <span className="inline-flex h-[18px] w-[18px] items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px]">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </span>
          </Link>
        </div>
      </nav>
    </>
  );
}

