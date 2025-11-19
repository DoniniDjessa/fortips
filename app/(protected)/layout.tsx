"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/app/(auth)/theme-toggle";
import LangToggle from "@/app/(auth)/lang-toggle";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import Loader from "@/app/components/loader";
import Sidebar from "./sidebar";
import { MobileMenuProvider, useMobileMenu } from "./mobile-menu-context";

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const lang = useLang();
  const [ready, setReady] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const { setIsMobileMenuOpen } = useMobileMenu();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      const rawEmail = user.email || "";
      const safeEmail = rawEmail.endsWith("@tip.local") ? "" : rawEmail;
      const dn = (user.user_metadata as any)?.pseudo || safeEmail || "";
      setDisplayName(dn);
      setReady(true);
    })();
  }, [router]);

  return (
    <div className="relative flex min-h-svh w-full overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-10rem] h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle,rgba(44,123,229,0.2),transparent_60%)] blur-3xl opacity-80 dark:opacity-60" />
        <div className="absolute right-[-18rem] top-1/3 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(0,210,122,0.18),transparent_65%)] blur-[160px] opacity-80 dark:opacity-60" />
      </div>
      <Sidebar />
      {/* Mobile Menu Button - Fixed to top-left */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed left-4 top-4 z-50 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200/70 bg-white/90 backdrop-blur-sm text-slate-500 shadow-sm transition hover:border-[var(--color-falcon-primary)] hover:text-[var(--color-falcon-primary)] dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200"
        aria-label={t(lang, "nav.menu")}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div className="relative z-10 flex min-w-0 flex-1 flex-col px-4 pb-10 pt-6 md:px-8 md:pb-8">
        <header className="falcon-nav mb-6">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:text-[var(--color-falcon-primary)] dark:text-slate-300"
            >
              <Image 
                src="/cpf.webp" 
                alt={t(lang, "app.logoAlt")} 
                width={120}
                height={36}
                className="h-9 w-auto"
                priority
              />
            </Link>
            <p className="falcon-nav-title">
              {t(lang, "common.dashboard")}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2">
              <span className="falcon-chip">
                <svg className="h-3.5 w-3.5 text-[var(--color-falcon-primary)]" fill="none" viewBox="0 0 24 24">
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 6v6h4.5"
                  />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
                </svg>
                {t(lang, "common.synced")}
              </span>
              {displayName && (
                <span className="falcon-chip-success">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 21.75a9.75 9.75 0 1 0 0-19.5 9.75 9.75 0 0 0 0 19.5Zm4.53-11.47-5.025 5.025a.75.75 0 0 1-1.06 0L7.47 12.33a.75.75 0 1 1 1.06-1.06l2.145 2.145 4.495-4.495a.75.75 0 1 1 1.06 1.06Z" />
                  </svg>
                  {displayName}
                </span>
              )}
            </div>
            <ThemeToggle />
            <LangToggle />
          </div>
        </header>
        <main className="falcon-scroll flex-1 overflow-auto pb-20 md:pb-10">
          {!ready ? (
            <div className="flex min-h-[420px] items-center justify-center">
              <Loader size="lg" text={t(lang, "common.loading")} />
            </div>
          ) : (
            children
          )}
        </main>
        <div className="mt-6 flex items-center justify-between text-[9px] text-slate-500/80 dark:text-slate-400/80">
          <span>© {new Date().getFullYear()} {t(lang, "app.name")}</span>
          <div className="inline-flex gap-3">
            <Link href="/support" className="hover:text-[var(--color-falcon-primary)]">
              {t(lang, "common.support")}
            </Link>
            <Link href="/settings" className="hover:text-[var(--color-falcon-primary)]">
              {t(lang, "common.settings")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <MobileMenuProvider>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </MobileMenuProvider>
  );
}


