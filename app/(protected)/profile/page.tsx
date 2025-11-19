"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const lang = useLang();
  const [email, setEmail] = useState("");
  const [pseudo, setPseudo] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) return;
      const rawEmail = user.email || "";
      const showEmail = rawEmail && !rawEmail.endsWith("@tip.local") ? rawEmail : "";
      setEmail(showEmail);
      setPseudo((user.user_metadata as any)?.pseudo || "");
    })();
  }, []);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setSaving(true);
    try {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) throw new Error("no_user");
      if (!email) {
        setMsg(t(lang, "common.emailRequired"));
        setSaving(false);
        return;
      }
      const res = await fetch("/api/profile/set-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, email }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        if (j?.error === "email_in_use") setMsg(t(lang, "common.emailInUse"));
        else setMsg(t(lang, "common.error"));
      } else {
        setMsg(t(lang, "common.saved"));
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 pb-20">
      <header className="flex items-center gap-3">
        <button onClick={() => router.push("/")} className="falcon-pill-link px-3 py-2">
          ← {t(lang, "common.back")}
        </button>
        <div>
          <span className="falcon-muted">{t(lang, "profile.account")}</span>
          <h1 className="falcon-title">{t(lang, "profile.profile")}</h1>
        </div>
      </header>

      <form onSubmit={onSave} className="falcon-shell space-y-5">
        <div className="space-y-2">
          <label className="falcon-form-label" htmlFor="pseudo">
            {t(lang, "profile.username")}
          </label>
          <input
            id="pseudo"
            disabled
            value={pseudo}
            className="falcon-form-control bg-slate-50 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400"
          />
          <p className="falcon-subtitle">
            {t(lang, "profile.usernameDesc")}
          </p>
        </div>

        <div className="space-y-2">
          <label className="falcon-form-label" htmlFor="email">
            {t(lang, "profile.email")}
          </label>
          <input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            className="falcon-form-control"
            placeholder="email@site.com"
          />
          <p className="falcon-subtitle">
            {t(lang, "profile.emailDesc")}
          </p>
        </div>

        {msg && (
          <div className="falcon-chip-success">
            {msg}
          </div>
        )}

        <button type="submit" disabled={saving} className="falcon-btn-primary w-full disabled:opacity-60">
          {saving ? t(lang, "common.saving") : t(lang, "common.save")}
        </button>
      </form>

      <div className="rounded-[1.8rem] border border-slate-200/70 bg-white/70 p-4 text-[10px] text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-400">
        <p className="font-semibold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-300">
          {t(lang, "common.needHelp")}
        </p>
        <p className="mt-2">
          {t(lang, "common.contactSupport")}
        </p>
        <Link href="/support" className="falcon-pill-link mt-3 inline-flex">
          {t(lang, "common.contactSupportLink")}
        </Link>
      </div>
    </div>
  );
}


