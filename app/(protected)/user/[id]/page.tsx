"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import Loader from "@/app/components/loader";
import CompetitionBadge from "@/app/components/competition-badge";
import Link from "next/link";

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

type UserProfile = {
  id: string;
  pseudo: string | null;
  email: string | null;
  success_rate: number | null;
  total_predictions: number | null;
  success_predictions: number | null;
  exact_score_predictions: number | null;
  avg_odds: number | null;
};

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const lang = useLang();
  const userId = params.id as string;
  const [user, setUser] = useState<UserProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [totalExactScorePredictions, setTotalExactScorePredictions] = useState<number>(0);
  const [todayPredictions, setTodayPredictions] = useState<Prediction[]>([]);
  const [upcomingPredictions, setUpcomingPredictions] = useState<Prediction[]>([]);
  const [pastPredictions, setPastPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"today" | "upcoming" | "past">("today");

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];

      // Get current user ID
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setCurrentUserId(currentUser.id);
      }

      // Get user profile
      const { data: userData } = await supabase
        .from("tip-users")
        .select("id, pseudo, email, success_rate, total_predictions, success_predictions, exact_score_predictions, avg_odds")
        .eq("id", userId)
        .single();

      if (userData) {
        setUser(userData);
      }

      // Get total predictions with probable_score (for exact score rate calculation)
      const { count: exactScoreTotal } = await supabase
        .from("tip-predictions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .not("probable_score", "is", null)
        .in("status", ["success", "failed", "exact_success"]);

      if (exactScoreTotal !== null) {
        setTotalExactScorePredictions(exactScoreTotal);
      }

      // Get today's predictions
      const { data: todayPreds } = await supabase
        .from("tip-predictions")
        .select("*")
        .eq("user_id", userId)
        .eq("date", today)
        .in("status", ["active", "waiting_result", "success", "failed", "exact_success"])
        .order("time", { ascending: true });

      if (todayPreds) setTodayPredictions(todayPreds);

      // Get upcoming predictions
      const { data: upcomingPreds } = await supabase
        .from("tip-predictions")
        .select("*")
        .eq("user_id", userId)
        .gt("date", today)
        .in("status", ["active", "waiting_result"])
        .order("date", { ascending: true })
        .order("time", { ascending: true })
        .limit(20);

      if (upcomingPreds) setUpcomingPredictions(upcomingPreds);

      // Get past predictions
      const { data: pastPreds } = await supabase
        .from("tip-predictions")
        .select("*")
        .eq("user_id", userId)
        .lt("date", today)
        .in("status", ["success", "failed", "exact_success", "waiting_result"])
        .order("date", { ascending: false })
        .order("time", { ascending: false })
        .limit(20);

      if (pastPreds) setPastPredictions(pastPreds);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="p-4 max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <Loader size="md" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 pb-20">
        <div className="falcon-shell text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t(lang, "user.userNotFound")}
          </p>
          <button onClick={() => router.push("/")} className="falcon-btn-primary mt-4 inline-flex">
            {t(lang, "common.back")}
          </button>
        </div>
      </div>
    );
  }

  const displayName = user.pseudo || user.email || "User";
  const predictions = activeTab === "today" ? todayPredictions : activeTab === "upcoming" ? upcomingPredictions : pastPredictions;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 pb-20">
      <header className="falcon-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/")} className="falcon-pill-link px-3 py-2">
            ← {t(lang, "common.back")}
          </button>
          <div>
            <span className="falcon-muted">{t(lang, "user.tipster")}</span>
            <h1 className="falcon-title">@{displayName}</h1>
            {user.success_rate !== null && (
              <p className="falcon-subtitle">
                {t(lang, "user.successRate")} {user.success_rate.toFixed(1)}% •{" "}
                {user.total_predictions || 0} {t(lang, "user.predictions")}
              </p>
            )}
          </div>
        </div>
        {currentUserId === userId ? (
          <div className="flex items-center gap-2">
            <Link href="/predictions" className="falcon-pill-link">
              {t(lang, "user.myPicks")}
            </Link>
            <Link href="/stats" className="falcon-pill-link">
              {t(lang, "user.myStats")}
            </Link>
          </div>
        ) : (
          <div className="falcon-grid sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="falcon-mini-card">
              <span className="falcon-muted">{t(lang, "stats.totalPicks")}</span>
              <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-white">
                {user.total_predictions || 0}
              </p>
            </div>
            <div className="falcon-mini-card">
              <span className="falcon-muted">{t(lang, "stats.wins")}</span>
              <div className="mt-2 flex items-end justify-between">
                <p className="text-2xl font-semibold text-[#0f5132] dark:text-[#adf8d1]">
                  {user.success_predictions || 0}
                </p>
                {user.success_rate !== null && (
                  <span className="falcon-chip-success">
                    {user.success_rate.toFixed(1)}% {t(lang, "stats.rate")}
                  </span>
                )}
              </div>
            </div>
            {user.exact_score_predictions !== null && (
              <div className="falcon-mini-card">
                <span className="falcon-muted">{t(lang, "stats.exactScores")}</span>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-falcon-primary)]">
                  {user.exact_score_predictions || 0}/{totalExactScorePredictions || 0}
                </p>
              </div>
            )}
            {user.avg_odds !== null && user.avg_odds > 0 && (
              <div className="falcon-mini-card">
                <span className="falcon-muted">{t(lang, "stats.averageOdds")}</span>
                <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  {user.avg_odds.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        )}
      </header>

      <nav className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("today")}
          className={`falcon-pill-link px-4 py-2 ${
            activeTab === "today"
              ? "border-[var(--color-falcon-primary)] text-[var(--color-falcon-primary)] shadow-md"
              : ""
          }`}
        >
          {t(lang, "user.today")} ({todayPredictions.length})
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`falcon-pill-link px-4 py-2 ${
            activeTab === "upcoming"
              ? "border-[var(--color-falcon-primary)] text-[var(--color-falcon-primary)] shadow-md"
              : ""
          }`}
        >
          {t(lang, "user.upcoming")} ({upcomingPredictions.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`falcon-pill-link px-4 py-2 ${
            activeTab === "past"
              ? "border-[var(--color-falcon-primary)] text-[var(--color-falcon-primary)] shadow-md"
              : ""
          }`}
        >
          {t(lang, "user.past")} ({pastPredictions.length})
        </button>
      </nav>

      {predictions.length === 0 ? (
        <div className="falcon-shell text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {t(lang, "user.noPredictions")}
          </p>
        </div>
      ) : (
        <div className="falcon-grid sm:grid-cols-2">
          {predictions.map((p) => (
            <article
              key={p.id}
              className="rounded-[1.75rem] border border-slate-200/70 bg-white/80 p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(15,23,42,0.16)] dark:border-slate-700/60 dark:bg-slate-900/60 dark:shadow-[0_22px_50px_rgba(15,23,42,0.6)]"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{p.match_name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400">
                      <span className="capitalize">{p.sport}</span>
                      <CompetitionBadge code={p.competition} size="xs" />
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 px-3 py-1 text-[11px] font-semibold text-slate-700 dark:border-slate-700/60 dark:text-slate-200">
                    {p.odds.toFixed(2)}
                  </span>
                </div>
                <p className="rounded-[1.2rem] border border-[rgba(44,123,229,0.18)] bg-[rgba(44,123,229,0.07)] px-3 py-2 text-[11px] font-medium text-[var(--color-falcon-primary)] dark:border-[rgba(44,123,229,0.35)] dark:bg-[rgba(44,123,229,0.16)]">
                  {p.prediction_text}
                </p>
                {p.probable_score && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    {t(lang, "home.probableScore")}: {p.probable_score}
                  </p>
                )}
                {p.details && (
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{p.details}</p>
                )}
                <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                  <span>{formatDate(p.date)} · {p.time}</span>
                  {p.result && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${
                        p.result === "success" || p.result === "exact_success"
                          ? "border-[rgba(0,210,122,0.35)] bg-[rgba(0,210,122,0.12)] text-[#0f5132] dark:border-[rgba(0,210,122,0.45)] dark:bg-[rgba(0,210,122,0.2)] dark:text-[#adf8d1]"
                          : "border-[rgba(230,55,87,0.35)] bg-[rgba(230,55,87,0.12)] text-[#c81f3f] dark:border-[rgba(230,55,87,0.45)] dark:bg-[rgba(230,55,87,0.2)] dark:text-[#f6a4b5]"
                      }`}
                    >
                      {p.result === "success"
                        ? t(lang, "status.success")
                        : p.result === "exact_success"
                          ? t(lang, "status.exactSuccess")
                          : t(lang, "status.failed")}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

