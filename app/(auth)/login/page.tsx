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
      toast.success(lang === "fr" ? "Connexion réussie" : "Login successful");
      setTimeout(() => { window.location.href = "/"; }, 50);
    } catch (err) {
      setError(t(lang, "auth.login") + " failed");
      toast.error(lang === "fr" ? "Échec de connexion" : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-700 rounded-2xl shadow-sm p-4 sm:p-6">
      <h1 className="text-xl font-bold mb-1 font-[family-name:var(--font-fira-sans-condensed)] text-gray-900 dark:text-gray-100">
        {t(lang, "auth.login")}
      </h1>
      <p className="text-xs text-gray-600 dark:text-gray-300 mb-6">
        {lang === "fr" ? "Utilisez votre email ou pseudo et mot de passe." : "Use your email or username and password."}
      </p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs text-gray-700 dark:text-gray-200">{t(lang, "auth.emailOrPseudo")}</label>
          <input
            type="text"
            value={form.identifier}
            onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-600 px-4 py-3 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500 transition"
            placeholder={lang === "fr" ? "email@site.com / pseudo" : "email@site.com / username"}
            autoComplete="username"
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
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 dark:text-gray-200">
              {showPwd ? (lang === "fr" ? "Masquer" : "Hide") : (lang === "fr" ? "Afficher" : "Show")}
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
          {loading ? (lang === "fr" ? "Connexion..." : "Signing in...") : t(lang, "auth.signIn")}
        </button>
      </form>
      <div className="mt-4 text-xs text-gray-600 dark:text-gray-300">
        {t(lang, "auth.needAccount")} {" "}
        <Link href="/register" className="underline">{t(lang, "auth.register")}</Link>
      </div>
    </div>
  );
}


