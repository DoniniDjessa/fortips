"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import { toast } from "sonner";

type FormState = {
  identifier: string; // email or pseudo
  password: string;
};

export default function LoginPage() {
  const lang = useLang();
  const [form, setForm] = useState<FormState>({ identifier: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.identifier || !form.password) {
      setError(t(lang, "auth.fillAll"));
      return;
    }
    setLoading(true);
    try {
      // If identifier looks like email, sign in with email; else use magic email fallback via RPC if needed.
      const isEmail = /.+@.+\..+/.test(form.identifier);
      if (isEmail) {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.identifier,
          password: form.password,
        });
        if (error) throw error;
      } else {
        // First try alias email built from pseudo
        const aliasEmail = `${form.identifier}@tip.local`;
        const aliasAttempt = await supabase.auth.signInWithPassword({
          email: aliasEmail,
          password: form.password,
        });
        if (aliasAttempt.error) {
          // Fallback: resolve pseudo -> real email via secure API
          const res = await fetch("/api/auth/resolve-pseudo", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pseudo: form.identifier }),
          });
          if (!res.ok) throw new Error("resolve_failed");
          const { email } = await res.json();
          const { error: signErr } = await supabase.auth.signInWithPassword({
            email,
            password: form.password,
          });
          if (signErr) throw signErr;
        }
      }
      toast.success(t(lang, "auth.loginSuccess"));
      setTimeout(() => { window.location.href = "/"; }, 50);
    } catch (err) {
      setError(t(lang, "auth.loginFailed"));
      toast.error(t(lang, "auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="falcon-muted">{t(lang, "auth.welcomeBack")}</span>
        <h1 className="falcon-title">{t(lang, "auth.login")}</h1>
        <p className="falcon-subtitle">{t(lang, "auth.loginSubtitle")}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="falcon-form-label">{t(lang, "auth.emailOrPseudo")}</label>
          <input
            type="text"
            value={form.identifier}
            onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
            className="falcon-form-control"
            placeholder={t(lang, "auth.emailPlaceholder")}
            autoComplete="username"
          />
        </div>
        <div className="space-y-2">
          <label className="falcon-form-label">{t(lang, "auth.password")}</label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="falcon-form-control pr-16"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-[var(--color-falcon-primary)] dark:text-slate-200"
            >
              {showPwd ? t(lang, "auth.hide") : t(lang, "auth.show")}
            </button>
          </div>
        </div>
        {error && <div className="falcon-error">{error}</div>}
        <button type="submit" disabled={loading} className="falcon-btn-primary w-full">
          {loading ? t(lang, "auth.signingIn") : t(lang, "auth.signIn")}
        </button>
      </form>
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => setShowLearnMoreModal(true)}
          className="falcon-btn-secondary w-full"
        >
          {t(lang, "home.learnMore")}
        </button>
        <div className="text-[10px] text-center text-slate-500 dark:text-slate-300">
          {t(lang, "auth.needAccount")}{" "}
          <Link href="/register" className="font-semibold text-[var(--color-falcon-primary)] no-underline hover:underline">
            {t(lang, "auth.register")}
          </Link>
        </div>
      </div>

      {/* Learn More Modal */}
      {showLearnMoreModal && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowLearnMoreModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-slate-200/70 bg-white/95 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/80 dark:shadow-[0_28px_70px_rgba(15,23,42,0.7)]">
              <button
                onClick={() => setShowLearnMoreModal(false)}
                className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200/70 bg-white text-slate-500 transition hover:border-[var(--color-falcon-primary)] hover:text-[var(--color-falcon-primary)] dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200"
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

              <div className="space-y-6">
                <div>
                  <h2 className="falcon-title mb-2">{t(lang, "app.name")}</h2>
                  <p className="falcon-subtitle">{t(lang, "home.appDescription")}</p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-200 mb-4">
                    {t(lang, "home.howItWorks")}
                  </h3>
                  <div className="space-y-4">
                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(44,123,229,0.12)] text-[var(--color-falcon-primary)] dark:bg-[rgba(44,123,229,0.22)]">
                          <span className="text-[11px] font-bold">1</span>
                        </span>
                        <div>
                          <h4 className="text-[11px] font-semibold text-slate-800 dark:text-white mb-1">
                            {t(lang, "home.step1Title")}
                          </h4>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300">
                            {t(lang, "home.step1Desc")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(44,123,229,0.12)] text-[var(--color-falcon-primary)] dark:bg-[rgba(44,123,229,0.22)]">
                          <span className="text-[11px] font-bold">2</span>
                        </span>
                        <div>
                          <h4 className="text-[11px] font-semibold text-slate-800 dark:text-white mb-1">
                            {t(lang, "home.step2Title")}
                          </h4>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300">
                            {t(lang, "home.step2Desc")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(44,123,229,0.12)] text-[var(--color-falcon-primary)] dark:bg-[rgba(44,123,229,0.22)]">
                          <span className="text-[11px] font-bold">3</span>
                        </span>
                        <div>
                          <h4 className="text-[11px] font-semibold text-slate-800 dark:text-white mb-1">
                            {t(lang, "home.step3Title")}
                          </h4>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300">
                            {t(lang, "home.step3Desc")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(44,123,229,0.12)] text-[var(--color-falcon-primary)] dark:bg-[rgba(44,123,229,0.22)]">
                          <span className="text-[11px] font-bold">4</span>
                        </span>
                        <div>
                          <h4 className="text-[11px] font-semibold text-slate-800 dark:text-white mb-1">
                            {t(lang, "home.step4Title")}
                          </h4>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300">
                            {t(lang, "home.step4Desc")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 dark:border-slate-700/60 dark:bg-slate-900/60">
                      <div className="flex items-start gap-3">
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(44,123,229,0.12)] text-[var(--color-falcon-primary)] dark:bg-[rgba(44,123,229,0.22)]">
                          <span className="text-[11px] font-bold">5</span>
                        </span>
                        <div>
                          <h4 className="text-[11px] font-semibold text-slate-800 dark:text-white mb-1">
                            {t(lang, "home.step5Title")}
                          </h4>
                          <p className="text-[10px] text-slate-600 dark:text-slate-300">
                            {t(lang, "home.step5Desc")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


