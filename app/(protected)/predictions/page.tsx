"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import { toast } from "sonner";
import Loader from "@/app/components/loader";
import CompetitionBadge from "@/app/components/competition-badge";

type Prediction = {
  id: string;
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
  result: string | null;
  created_at: string;
};

const getStatusInfo = (status: string, lang: "fr" | "en"): { label: string; chip: string; tone: string } => {
  const statusMap: Record<string, { chip: string; tone: string; key: string }> = {
    pending_validation: {
      chip: "border-[rgba(246,195,67,0.35)] bg-[rgba(246,195,67,0.12)] text-[#9c6c12] dark:border-[rgba(246,195,67,0.45)] dark:bg-[rgba(246,195,67,0.2)] dark:text-[#f7d58b]",
      tone: "text-[#9c6c12] dark:text-[#f7d58b]",
      key: "status.pending",
    },
    active: {
      chip: "border-[rgba(44,123,229,0.3)] bg-[rgba(44,123,229,0.12)] text-[var(--color-falcon-primary)] dark:border-[rgba(44,123,229,0.45)] dark:bg-[rgba(44,123,229,0.22)]",
      tone: "text-[var(--color-falcon-primary)]",
      key: "status.active",
    },
    waiting_result: {
      chip: "border-[rgba(149,76,233,0.3)] bg-[rgba(149,76,233,0.12)] text-[#6f35c8] dark:border-[rgba(149,76,233,0.45)] dark:bg-[rgba(149,76,233,0.22)] dark:text-[#cfb4ff]",
      tone: "text-[#6f35c8] dark:text-[#cfb4ff]",
      key: "status.waitingResult",
    },
    success: {
      chip: "border-[rgba(0,210,122,0.35)] bg-[rgba(0,210,122,0.12)] text-[#0f5132] dark:border-[rgba(0,210,122,0.45)] dark:bg-[rgba(0,210,122,0.2)] dark:text-[#adf8d1]",
      tone: "text-[#0f5132] dark:text-[#adf8d1]",
      key: "status.success",
    },
    failed: {
      chip: "border-[rgba(230,55,87,0.35)] bg-[rgba(230,55,87,0.12)] text-[#c81f3f] dark:border-[rgba(230,55,87,0.45)] dark:bg-[rgba(230,55,87,0.2)] dark:text-[#f6a4b5]",
      tone: "text-[#c81f3f] dark:text-[#f6a4b5]",
      key: "status.failed",
    },
    exact_success: {
      chip: "border-[rgba(0,210,122,0.45)] bg-[rgba(0,210,122,0.16)] text-[#0f5132] dark:border-[rgba(0,210,122,0.55)] dark:bg-[rgba(0,210,122,0.26)] dark:text-[#adf8d1]",
      tone: "text-[#0f5132] dark:text-[#adf8d1]",
      key: "status.exactSuccess",
    },
  };
  const info = statusMap[status] || statusMap.active;
  return { label: t(lang, info.key), chip: info.chip, tone: info.tone };
};

export default function PredictionsPage() {
  const router = useRouter();
  const lang = useLang();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from("tip-predictions")
        .select("*")
        .eq("user_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPredictions(data || []);
    } catch (err: any) {
      toast.error(t(lang, "common.error"));
    } finally {
      setLoading(false);
    }
  };

  const canDelete = (prediction: Prediction): boolean => {
    const createdDate = new Date(prediction.created_at);
    const now = new Date();
    const daysDiff = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff > 2;
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t(lang, "predictions.confirmDelete"))) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error(t(lang, "common.error"));
        return;
      }

      const res = await fetch("/api/predictions/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prediction_id: id, user_id: userData.user.id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.error === "too_recent") {
          toast.error(t(lang, "predictions.tooRecent"));
        } else if (errorData.error === "cannot_delete_finalized") {
          toast.error(t(lang, "predictions.cannotDeleteFinalized"));
        } else {
          throw new Error(errorData.error || "Failed to delete");
        }
        return;
      }

      toast.success(t(lang, "predictions.deleted"));
      loadPredictions();
      
      // Trigger a refresh of the home feed if user is on home page
      // This will be handled by the home page's useEffect
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("predictionDeleted"));
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(t(lang, "common.error"));
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto flex items-center justify-center min-h-[200px]">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-20">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="falcon-pill-link px-3 py-2"
          >
            ← {t(lang, "common.home")}
          </button>
          <div>
            <span className="falcon-muted">{t(lang, "predictions.management")}</span>
            <h1 className="falcon-title">{t(lang, "predictions.myPredictions")}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadPredictions}
            className="falcon-pill-link"
          >
            {t(lang, "common.refresh")}
          </button>
          <Link href="/predictions/new" className="falcon-btn-primary">
            + {t(lang, "predictions.new")}
          </Link>
        </div>
      </header>

      {predictions.length === 0 ? (
        <section className="falcon-shell text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t(lang, "predictions.noPredictionsYet")}
          </p>
          <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
            {t(lang, "predictions.createFirstPrediction")}
          </p>
          <Link href="/predictions/new" className="falcon-btn-primary mt-4 inline-flex">
            {t(lang, "predictions.createMyFirst")}
          </Link>
        </section>
      ) : (
        <section className="falcon-grid">
          {predictions.map((p) => {
            const statusInfo = getStatusInfo(p.status, lang);
            const isDeletable = canDelete(p);
            return (
              <article
                key={p.id}
                className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(15,23,42,0.16)] dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-[0_22px_50px_rgba(15,23,42,0.6)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-[180px] space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.match_name}</span>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${statusInfo.chip}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{p.sport}</span>
                      <CompetitionBadge code={p.competition} size="xs" />
                    </div>
                    <p className="rounded-[1.25rem] border border-[rgba(44,123,229,0.18)] bg-[rgba(44,123,229,0.07)] px-3 py-2 text-[11px] font-medium text-[var(--color-falcon-primary)] dark:border-[rgba(44,123,229,0.35)] dark:bg-[rgba(44,123,229,0.16)]">
                      {p.prediction_text}
                    </p>
                    {p.probable_score && (
                      <p className={`text-[10px] font-medium ${statusInfo.tone}`}>
                        {t(lang, "home.probableScore")}: {p.probable_score}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center justify-center rounded-full border border-slate-200/70 px-3 py-1 text-[11px] font-semibold text-slate-800 dark:border-slate-700/60 dark:text-slate-100">
                      {p.odds.toFixed(2)}
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
                      {formatDate(p.date)} · {p.time}
                    </p>
                    {isDeletable && (
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="mt-2 inline-flex items-center justify-center rounded-lg bg-red-600 text-white px-2 py-1 text-[9px] font-semibold uppercase tracking-wide hover:opacity-90 transition"
                        title={t(lang, "predictions.delete")}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                {p.details && (
                  <div className="mt-3 rounded-[1.25rem] border border-dashed border-slate-200/70 bg-white/70 p-3 text-[10px] text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
                    {p.details}
                  </div>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

