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
      setError(lang === "fr" ? "Mot de passe requis" : "Password required");
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
        setError(lang === "fr" ? "Email déjà utilisé" : "Email already in use");
        setLoading(false);
        return;
      }
      if (pseudoTaken) {
        setError(lang === "fr" ? "Pseudo déjà utilisé" : "Username already in use");
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
          toast.success(lang === "fr" ? "Compte créé" : "Account created");
          setTimeout(() => { window.location.href = "/"; }, 50);
        } else {
          toast.success(lang === "fr" ? "Compte créé" : "Account created");
          setTimeout(() => { window.location.href = "/login"; }, 50);
        }
      } else {
        toast.success(lang === "fr" ? "Compte créé" : "Account created");
        setTimeout(() => { window.location.href = "/"; }, 50);
      }
    } catch (err) {
      setError("Inscription échouée / Registration failed");
      toast.error(lang === "fr" ? "Inscription échouée" : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-700 rounded-2xl shadow-sm p-4 sm:p-6">
      <h1 className="text-xl font-bold mb-1 font-[family-name:var(--font-fira-sans-condensed)] text-gray-900 dark:text-gray-100">
        {t(lang, "auth.register")}
      </h1>
      <p className="text-xs text-gray-600 dark:text-gray-300 mb-6">
        {lang === "fr" ? "Remplissez au moins email ou pseudo." : "Fill at least email or username."}
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs text-gray-700 dark:text-gray-200">{t(lang, "auth.email")}</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-600 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
            placeholder="email@site.com"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-gray-700 dark:text-gray-200">{t(lang, "auth.pseudo")}</label>
          <input
            type="text"
            value={form.pseudo}
            onChange={(e) => setForm((f) => ({ ...f, pseudo: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-600 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
            placeholder="Votre pseudo"
            autoComplete="nickname"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-gray-700 dark:text-gray-200">{t(lang, "auth.password")}</label>
          <div className="relative">
            <input
              type={showPwd ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-600 px-4 py-3 pr-12 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-200">
              {showPwd ? (lang === "fr" ? "Masquer" : "Hide") : (lang === "fr" ? "Afficher" : "Show")}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-gray-700 dark:text-gray-200">{t(lang, "auth.confirmPassword")}</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-600 px-4 py-3 pr-12 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-200">
              {showConfirm ? (lang === "fr" ? "Masquer" : "Hide") : (lang === "fr" ? "Afficher" : "Show")}
            </button>
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-slate-800 dark:text-gray-100 px-4 py-3 font-medium hover:opacity-90 active:opacity-80 transition"
        >
          {loading ? (lang === "fr" ? "Création..." : "Creating...") : t(lang, "auth.createAccount")}
        </button>
      </form>
      <div className="mt-4 text-xs text-gray-600 dark:text-gray-300">
        {t(lang, "auth.haveAccount")} {" "}
        <Link href="/login" className="underline">{t(lang, "auth.signIn")}</Link>
      </div>
    </div>
  );
}


