"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import Loader from "@/app/components/loader";

export default function TipLeadLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.replace("/");
        return;
      }

      const { data } = await supabase
        .from("tip-users")
        .select("role")
        .eq("id", userData.user.id)
        .single();

      if (data?.role !== "admin") {
        router.replace("/");
        return;
      }

      setAuthorized(true);
    } catch (err) {
      router.replace("/");
    } finally {
      setChecking(false);
    }
  };

  if (checking || !authorized) {
    return (
      <div className="min-h-svh flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  return <>{children}</>;
}

