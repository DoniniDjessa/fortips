"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ProfilePage() {
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
        setMsg("Email requis / Email required");
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
        if (j?.error === "email_in_use") setMsg("Email déjà utilisé / Email already in use");
        else setMsg("Erreur / Error");
      } else {
        setMsg("Enregistré / Saved");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <div className="bg-white dark:bg-slate-700 rounded-2xl shadow-sm p-4 sm:p-6">
        <h1 className="text-2xl font-bold mb-4 font-[family-name:var(--font-fira-sans-condensed)] text-gray-900 dark:text-gray-100">Profil</h1>
        <form onSubmit={onSave} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm text-gray-700 dark:text-gray-200">Pseudo</label>
            <input
              disabled
              value={pseudo}
              className="w-full rounded-xl border border-gray-300 dark:border-slate-500 bg-gray-100 dark:bg-slate-600 px-4 py-3 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm text-gray-700 dark:text-gray-200">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full rounded-xl border border-gray-300 dark:border-slate-500 bg-white dark:bg-slate-600 px-4 py-3 text-gray-900 dark:text-gray-100"
              placeholder="email@site.com"
            />
          </div>
          {msg && <div className="text-sm text-gray-700 dark:text-gray-200">{msg}</div>}
          <button type="submit" disabled={saving} className="inline-flex items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-slate-800 dark:text-gray-100 px-4 py-3 font-medium hover:opacity-90 active:opacity-80 transition">
            {saving ? "Enregistrement... / Saving..." : "Enregistrer / Save"}
          </button>
        </form>
      </div>
    </div>
  );
}


