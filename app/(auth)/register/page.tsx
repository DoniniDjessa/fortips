"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import { toast } from "sonner";

type FormState = {
  email: string;
  pseudo: string;
  password: string;
  confirm: string;
};

export default function RegisterPage() {
  const lang = useLang();
  const [form, setForm] = useState<FormState>({ email: "", pseudo: "", password: "", confirm: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.email && !form.pseudo) {
      setError(t(lang, "auth.requiredEmailOrPseudo"));
      return;
    }
    if (!form.password || !form.confirm) {
      setError(t(lang, "auth.passwordRequired"));
      return;
    }
    if (form.password !== form.confirm) {
      setError(t(lang, "auth.pwdsNoMatch"));
      return;
    }
    setLoading(true);
    try {
      // Pre-check availability
      const availRes = await fetch("/api/profile/check-availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email || undefined, pseudo: form.pseudo || undefined }),
      });
      if (!availRes.ok) throw new Error("availability_failed");
      const { emailTaken, pseudoTaken } = await availRes.json();
      if (emailTaken) {
        setError(t(lang, "auth.emailInUse"));
        setLoading(false);
        return;
      }
      if (pseudoTaken) {
        setError(t(lang, "auth.pseudoInUse"));
        setLoading(false);
        return;
      }
      // If email provided, sign up with email; else create an email alias using pseudo (cannot sign up without email in Supabase auth)
      // Use admin-backed registration to allow pseudo-only signup
      const regRes = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email || null, pseudo: form.pseudo || null, password: form.password }),
      });
      if (!regRes.ok) throw new Error("register_failed");
      const reg = await regRes.json();
      const finalEmail = reg.email as string;
      // Sign in and redirect
      const signRes = await supabase.auth.signInWithPassword({ email: finalEmail, password: form.password });
      if (signRes.error) {
        // fallback: if auto-login blocked (e.g., email confirmation required), still send to home if session exists, else to login
        const session = (await supabase.auth.getSession()).data.session;
        if (session) {
          toast.success(t(lang, "auth.accountCreated"));
          setTimeout(() => { window.location.href = "/"; }, 50);
        } else {
          toast.success(t(lang, "auth.accountCreated"));
          setTimeout(() => { window.location.href = "/login"; }, 50);
        }
      } else {
        toast.success(t(lang, "auth.accountCreated"));
        setTimeout(() => { window.location.href = "/"; }, 50);
      }
    } catch (err) {
      setError(t(lang, "auth.registrationFailed"));
      toast.error(t(lang, "auth.registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="falcon-muted">{t(lang, "auth.createAccount")}</span>
        <h1 className="falcon-title">{t(lang, "auth.register")}</h1>
        <p className="falcon-subtitle">{t(lang, "auth.createAccountSubtitle")}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="falcon-form-label">{t(lang, "auth.email")}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="falcon-form-control"
            placeholder="email@site.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <label className="falcon-form-label">{t(lang, "auth.pseudo")}</label>
          <input
            type="text"
            value={form.pseudo}
            onChange={(e) => setForm((f) => ({ ...f, pseudo: e.target.value }))}
            className="falcon-form-control"
            placeholder={t(lang, "auth.yourUsername")}
            autoComplete="nickname"
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
              autoComplete="new-password"
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
        <div className="space-y-2">
          <label className="falcon-form-label">{t(lang, "auth.confirmPassword")}</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              className="falcon-form-control pr-16"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 transition hover:text-[var(--color-falcon-primary)] dark:text-slate-200"
            >
              {showConfirm ? t(lang, "auth.hide") : t(lang, "auth.show")}
            </button>
          </div>
        </div>
        {error && <div className="falcon-error">{error}</div>}
        <button type="submit" disabled={loading} className="falcon-btn-primary w-full">
          {loading ? t(lang, "auth.creating") : t(lang, "auth.createAccount")}
        </button>
      </form>
      <div className="text-[10px] text-center text-slate-500 dark:text-slate-300">
        {t(lang, "auth.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-[var(--color-falcon-primary)] no-underline hover:underline">
          {t(lang, "auth.signIn")}
        </Link>
      </div>
    </div>
  );
}


