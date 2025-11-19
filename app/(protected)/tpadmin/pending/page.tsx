"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import { toast } from "sonner";
import CompetitionBadge from "@/app/components/competition-badge";
import { TPADMIN_ACCESS_CODE, TPADMIN_ACCESS_CODE_STORAGE_KEY } from "@/lib/tpadmin";

type Prediction = {
  id: string;
  user_id: string;
  sport: string;
  competition: string;
  match_name: string;
  date: string;
  time: string;
  odds: number;
  probable_score: string | null;
  prediction_text: string;
  details: string | null;
  status: string;
  created_at: string;
  tip_users: { pseudo: string | null; email: string | null } | null;
  sameDateCount?: number;
  exceedsLimit?: boolean;
};

export default function AdminPendingPage() {
  const lang = useLang();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      // Get access code from session storage
      const accessCode =
        typeof window !== "undefined" ? window.sessionStorage.getItem(TPADMIN_ACCESS_CODE_STORAGE_KEY) : null;

      if (accessCode !== TPADMIN_ACCESS_CODE) {
        toast.error(t(lang, "admin.invalidCode"));
        setPredictions([]);
        setLoading(false);
        return;
      }

      // Use API route with admin client to bypass RLS
      const res = await fetch("/api/admin/pending-predictions", {
        headers: {
          "x-access-code": accessCode,
        },
      });

      if (res.status === 403) {
        toast.error(t(lang, "admin.accessDenied"));
        setPredictions([]);
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to fetch predictions");
      }

      const { data } = await res.json();
      console.log("Loaded predictions from API:", data?.length || 0, data);
      
      // Calculate prediction counts per user per date to identify violations
      const predictionsWithCounts = (data || []).map((p: Prediction) => {
        // Count how many predictions this user has for this date (including this one)
        const sameDateCount = (data || []).filter(
          (other: Prediction) => other.user_id === p.user_id && other.date === p.date
        ).length;
        return {
          ...p,
          sameDateCount, // Number of predictions this user has for this date
          exceedsLimit: sameDateCount > 2, // Flag if exceeds limit
        };
      });
      
      setPredictions(predictionsWithCounts);
    } catch (err: any) {
      console.error("Failed to load predictions:", err);
      toast.error(t(lang, "common.error") + ": " + (err.message || String(err)));
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (id: string, action: "validate" | "reject") => {
    const accessCode =
      typeof window !== "undefined" ? window.sessionStorage.getItem(TPADMIN_ACCESS_CODE_STORAGE_KEY) : null;

    if (accessCode !== TPADMIN_ACCESS_CODE) {
      toast.error(t(lang, "admin.invalidCode"));
      return;
    }

    try {
      setProcessingId(id);
      const { data: userData } = await supabase.auth.getUser();
      const payload: Record<string, unknown> = {
        prediction_id: id,
        action,
        access_code: accessCode,
      };
      if (userData.user) {
        payload.user_id = userData.user.id;
      }

      const res = await fetch("/api/admin/validate-prediction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 403) {
        toast.error(t(lang, "admin.accessDenied"));
        return;
      }

      if (!res.ok) throw new Error("Failed");

      toast.success(
        action === "validate"
          ? t(lang, "admin.predictionValidated")
          : t(lang, "admin.predictionRejected")
      );

      loadPredictions();
    } catch (err) {
      toast.error(t(lang, "common.error"));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto">
        <div className="text-xs text-gray-600 dark:text-gray-400">{t(lang, "common.loading")}</div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-4 font-[family-name:var(--font-fira-sans-condensed)] text-gray-900 dark:text-gray-100">
        {t(lang, "admin.pendingPredictions")}
      </h1>

      {predictions.length === 0 ? (
        <div className="bg-white dark:bg-slate-700 rounded-2xl shadow-sm p-6 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t(lang, "admin.noPendingPredictions")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((p) => {
            const userName = p.tip_users?.pseudo || p.tip_users?.email || "Unknown";
            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-700 rounded-xl shadow-sm p-4 border ${
                  p.exceedsLimit
                    ? "border-red-500 dark:border-red-600 bg-red-50 dark:bg-red-900/20"
                    : "border-gray-200 dark:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {t(lang, "user.userLabel")} <span className="font-medium">{userName}</span>
                      </div>
                      {p.exceedsLimit && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-red-500 bg-red-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-red-700 dark:border-red-600 dark:bg-red-900/40 dark:text-red-300">
                          ⚠️ {t(lang, "admin.exceedsLimit")} ({p.sameDateCount}/2)
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 mb-1">{p.match_name}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="capitalize">{p.sport}</span>
                      <CompetitionBadge code={p.competition} size="xs" />
                    </div>
                    <div className="text-[11px] text-gray-700 dark:text-gray-300 font-medium mb-1">{p.prediction_text}</div>
                    {p.probable_score && (
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                        {t(lang, "home.probableScore")}: {p.probable_score}
                      </div>
                    )}
                    {p.details && (
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 mt-2 leading-4">{p.details}</div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 mb-1">{p.odds.toFixed(2)}</div>
                    <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-3">
                      {new Date(p.date).toLocaleDateString()} {p.time}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleValidate(p.id, "validate")}
                        disabled={processingId === p.id}
                        className="inline-flex items-center justify-center rounded-lg bg-green-600 text-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        ✓ {t(lang, "admin.validate")}
                      </button>
                      <button
                        onClick={() => handleValidate(p.id, "reject")}
                        disabled={processingId === p.id}
                        className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        ✕ {t(lang, "admin.reject")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


