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
};

export default function AdminResultsPage() {
  const lang = useLang();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from("tip-predictions")
        .select(
          `*,
          tip_users:"tip-users"(pseudo,email)`
        )
        .in("status", ["waiting_result", "active"])
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) throw error;

      const now = Date.now();
      const filtered = (data || []).filter((prediction: any) => {
        if (prediction.status === "waiting_result") return true;
        if (prediction.status !== "active") return false;

        const matchDate = getMatchDate(prediction.date, prediction.time);
        if (!matchDate) return false;

        return matchDate.getTime() <= now;
      });

      setPredictions(filtered as Prediction[]);
    } catch (err: any) {
      toast.error(t(lang, "common.error"));
    } finally {
      setLoading(false);
    }
  };

  const handleResult = async (id: string, result: "success" | "failed" | "exact_success") => {
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
        result,
        access_code: accessCode,
      };
      if (userData.user) {
        payload.user_id = userData.user.id;
      }

      const res = await fetch("/api/admin/update-result", {
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
        result === "success"
          ? t(lang, "status.success")
          : result === "exact_success"
          ? t(lang, "status.exactSuccess")
          : t(lang, "status.failed")
      );

      loadPredictions();
    } catch (err) {
      toast.error(t(lang, "common.error"));
    } finally {
      setProcessingId(null);
    }
  };

  const handleExactScore = (id: string, isSuccess: boolean) => {
    handleResult(id, isSuccess ? "exact_success" : "success");
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
        {t(lang, "admin.waitingResults")}
      </h1>

      {predictions.length === 0 ? (
        <div className="bg-white dark:bg-slate-700 rounded-2xl shadow-sm p-6 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t(lang, "admin.noResultsWaiting")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((p) => {
            const userName = p.tip_users?.pseudo || p.tip_users?.email || "Unknown";
            const matchDate = getMatchDate(p.date, p.time);
            const overdueLabel =
              p.status === "active" && matchDate ? formatRelative(matchDate, lang) : null;
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-700 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-slate-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      {t(lang, "user.userLabel")} <span className="font-medium">{userName}</span>
                    </div>
                    <div className="text-[11px] font-semibold text-gray-900 dark:text-gray-100 mb-1">{p.match_name}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="capitalize">{p.sport}</span>
                      <CompetitionBadge code={p.competition} size="xs" />
                    </div>
                    <div className="text-[11px] text-gray-700 dark:text-gray-300 font-medium mb-1">{p.prediction_text}</div>
                    {p.probable_score && (
                      <div className="text-[10px] text-gray-600 dark:text-gray-400 mb-1">
                        {t(lang, "home.probableScore")}: <span className="font-medium">{p.probable_score}</span>
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
                      {p.status === "active" && (
                        <span className="ml-1 font-semibold text-amber-600 dark:text-amber-400">
                          {t(lang, "admin.matchPassed")}
                          {overdueLabel ? ` · ${overdueLabel}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResult(p.id, "success")}
                          disabled={processingId === p.id}
                          className="inline-flex flex-1 items-center justify-center rounded-lg bg-green-600 text-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          ✓ {t(lang, "status.success")}
                        </button>
                        <button
                          onClick={() => handleResult(p.id, "failed")}
                          disabled={processingId === p.id}
                          className="inline-flex flex-1 items-center justify-center rounded-lg bg-red-600 text-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          ✕ {t(lang, "status.failed")}
                        </button>
                      </div>
                      {p.probable_score && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleExactScore(p.id, true)}
                            disabled={processingId === p.id}
                            className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            🏁 {t(lang, "admin.exactScoreYes")}
                          </button>
                          <button
                            onClick={() => handleExactScore(p.id, false)}
                            disabled={processingId === p.id}
                            className="inline-flex flex-1 items-center justify-center rounded-lg bg-amber-600 text-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide hover:opacity-90 transition disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            ✕ {t(lang, "admin.exactScoreNo")}
                          </button>
                        </div>
                      )}
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

function getMatchDate(date: string | null, time: string | null) {
  if (!date) return null;

  const isoCandidate = `${date}T${time ?? "00:00"}`;
  const parsed = new Date(isoCandidate);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date(`${date} ${time ?? ""}`.trim());
  if (!Number.isNaN(fallback.getTime())) {
    return fallback;
  }

  return null;
}

function formatRelative(matchDate: Date, lang: "fr" | "en") {
  const diff = Date.now() - matchDate.getTime();
  if (diff <= 0) {
    return t(lang, "admin.inProgress");
  }

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) {
    return lang === "fr" ? `il y a ${minutes} min` : `${minutes} min ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return lang === "fr" ? `il y a ${hours} h` : `${hours} h ago`;
  }

  const days = Math.floor(hours / 24);
  return lang === "fr" ? `il y a ${days} j` : `${days} d ago`;
}
