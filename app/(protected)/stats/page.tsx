"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import { toast } from "sonner";
import Loader from "@/app/components/loader";

type UserStats = {
  total_predictions: number;
  success_predictions: number;
  exact_score_predictions: number;
  success_rate: number;
  avg_odds: number;
};

type OddsRange = {
  range: string;
  count: number;
  success: number;
  rate: number;
};

export default function StatsPage() {
  const router = useRouter();
  const lang = useLang();
  const [stats, setStats] = useState<UserStats>({
    total_predictions: 0,
    success_predictions: 0,
    exact_score_predictions: 0,
    success_rate: 0,
    avg_odds: 0,
  });
  const [oddsRanges, setOddsRanges] = useState<OddsRange[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      // Get user stats from tip-users
      const { data: userRow } = await supabase
        .from("tip-users")
        .select("total_predictions, success_predictions, exact_score_predictions, success_rate, avg_odds")
        .eq("id", userData.user.id)
        .single();

      if (userRow) {
        setStats({
          total_predictions: userRow.total_predictions || 0,
          success_predictions: userRow.success_predictions || 0,
          exact_score_predictions: userRow.exact_score_predictions || 0,
          success_rate: userRow.success_rate || 0,
          avg_odds: userRow.avg_odds || 0,
        });
      }

      // Get predictions with results to calculate odds ranges
      const { data: predictions } = await supabase
        .from("tip-predictions")
        .select("odds, result")
        .eq("user_id", userData.user.id)
        .in("status", ["success", "failed", "exact_success"]);

      if (predictions) {
        const ranges = [
          { min: 1.0, max: 1.5, labelKey: "stats.verySafe" },
          { min: 1.51, max: 2.0, labelKey: "stats.moderatelySafe" },
          { min: 2.01, max: 5.0, labelKey: "stats.risky" },
          { min: 5.01, max: 999, labelKey: "stats.veryRisky" },
        ];

        const rangeStats = ranges.map((r) => {
          const inRange = predictions.filter((p) => p.odds >= r.min && p.odds <= r.max);
          const success = inRange.filter((p) => p.result === "success" || p.result === "exact_success").length;
          return {
            range: t(lang, r.labelKey),
            count: inRange.length,
            success,
            rate: inRange.length > 0 ? (success / inRange.length) * 100 : 0,
          };
        });

        setOddsRanges(rangeStats);
      }
    } catch (err: any) {
      toast.error(t(lang, "common.error"));
    } finally {
      setLoading(false);
    }
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
          <button onClick={() => router.push("/")} className="falcon-pill-link px-3 py-2">
            ← {t(lang, "common.back")}
          </button>
          <div>
            <span className="falcon-muted">{t(lang, "stats.analytics")}</span>
            <h1 className="falcon-title">{t(lang, "stats.statistics")}</h1>
          </div>
        </div>
        <div className="inline-flex items-center gap-2">
          <button onClick={loadStats} className="falcon-pill-link">
            {t(lang, "common.refresh")}
          </button>
        </div>
      </header>

      <section className="falcon-grid md:grid-cols-2 xl:grid-cols-4">
        <div className="falcon-mini-card">
          <span className="falcon-muted">{t(lang, "stats.totalPicks")}</span>
          <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-white">
            {stats.total_predictions}
          </p>
        </div>
        <div className="falcon-mini-card">
          <span className="falcon-muted">{t(lang, "stats.wins")}</span>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl font-semibold text-[#0f5132] dark:text-[#adf8d1]">
              {stats.success_predictions}
            </p>
            <span className="falcon-chip-success">
              {(stats.success_rate > 0 ? stats.success_rate.toFixed(1) : "0.0")}% {t(lang, "stats.rate")}
            </span>
          </div>
        </div>
        <div className="falcon-mini-card">
          <span className="falcon-muted">{t(lang, "stats.exactScores")}</span>
          <p className="mt-2 text-2xl font-semibold text-[var(--color-falcon-primary)]">
            {stats.exact_score_predictions}
          </p>
        </div>
        <div className="falcon-mini-card">
          <span className="falcon-muted">{t(lang, "stats.averageOdds")}</span>
          <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
            {stats.avg_odds > 0 ? stats.avg_odds.toFixed(2) : "0.00"}
          </p>
        </div>
      </section>

      <section className="falcon-shell space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="falcon-muted">{t(lang, "stats.distribution")}</span>
            <h2 className="falcon-title">{t(lang, "stats.byOddsRange")}</h2>
          </div>
          <span className="falcon-chip">
            {t(lang, "stats.historyAnalyzed")}
          </span>
        </div>

        <div className="space-y-3">
          {oddsRanges.map((r, idx) => (
            <div
              key={idx}
              className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.range}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {r.count} {t(lang, "stats.predictions")} • {r.success}{" "}
                    {t(lang, "stats.winsCount")}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700/60 dark:text-slate-200">
                  {r.rate > 0 ? r.rate.toFixed(1) : "0.0"}%
                  <span className="h-2 w-2 rounded-full bg-[var(--color-falcon-primary)]" />
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80">
                <div
                  className="h-full rounded-full bg-[var(--color-falcon-primary)] transition-all dark:bg-[rgba(44,123,229,0.75)]"
                  style={{ width: `${Math.min(r.rate, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

