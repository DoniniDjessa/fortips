"use client";

import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import { toast } from "sonner";

export default function SignOutButton() {
  const lang = useLang();
  const onClick = async () => {
    await supabase.auth.signOut();
    toast.success(t(lang, "common.signedOut"));
    setTimeout(() => { window.location.href = "/login"; }, 50);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t(lang, "nav.signOut")}
      className="inline-flex items-center justify-center rounded-full border border-[rgba(230,55,87,0.35)] bg-[rgba(230,55,87,0.08)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#c81f3f] shadow-sm transition hover:translate-y-[-1px] hover:bg-[rgba(230,55,87,0.12)] hover:shadow-md active:translate-y-0 dark:border-[rgba(230,55,87,0.45)] dark:bg-[rgba(230,55,87,0.14)] dark:text-[#f8c6d2] sm:gap-2 sm:px-4"
    >
      <span className="hidden sm:inline">{t(lang, "nav.signOut")}</span>
      <svg
        className="h-4 w-4 sm:h-0 sm:w-0 sm:absolute"
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
    </button>
  );
}


