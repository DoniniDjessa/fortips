"use client";

import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import { toast } from "sonner";

export default function SignOutButton() {
  const lang = useLang();
  const onClick = async () => {
    await supabase.auth.signOut();
    toast.success(lang === "fr" ? "Déconnecté" : "Signed out");
    setTimeout(() => { window.location.href = "/login"; }, 50);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium bg-white text-gray-900 shadow-sm hover:shadow dark:bg-slate-700 dark:text-gray-100 transition"
    >
      {t(lang, "auth.login") === "Connexion" ? (lang === "fr" ? "Déconnexion" : "Sign out") : (lang === "fr" ? "Déconnexion" : "Sign out")}
    </button>
  );
}


