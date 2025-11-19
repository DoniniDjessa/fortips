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
      <div className="text-[10px] text-center text-slate-500 dark:text-slate-300">
        {t(lang, "auth.needAccount")}{" "}
        <Link href="/register" className="font-semibold text-[var(--color-falcon-primary)] no-underline hover:underline">
          {t(lang, "auth.register")}
        </Link>
      </div>
    </div>
  );
}


