"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import SignOutButton from "./signout-button";
import Link from "next/link";
import ThemeToggle from "@/app/(auth)/theme-toggle";
import LangToggle from "@/app/(auth)/lang-toggle";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [displayName, setDisplayName] = useState("");

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

  if (!ready) return null;

  return (
    <div className="min-h-svh flex flex-col text-sm">
      <header className="flex items-center justify-between p-4">
        <div className="text-sm sm:text-base text-gray-700 dark:text-gray-200">
          {displayName}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LangToggle />
          <Link href="/profile" className="text-sm underline text-gray-700 dark:text-gray-200">Profil</Link>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}


