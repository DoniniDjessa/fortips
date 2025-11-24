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
  const [historyPredictions, setHistoryPredictions] = useState<Prediction[]>([]);
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

      // Fetch ALL predictions for this user via API route (bypasses RLS)
      const res = await fetch(`/api/user/predictions?user_id=${userId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch user predictions");
      }
      const { data: allPredictions } = await res.json();

      if (!allPredictions || allPredictions.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate total predictions with probable_score (all statuses, not just completed)
      const totalWithProbableScore = allPredictions.filter(
        (p: Prediction) => p.probable_score !== null && p.probable_score !== undefined
      ).length;
      setTotalExactScorePredictions(totalWithProbableScore);

      // Filter predictions by date and status
      const todayPreds = allPredictions.filter(
        (p: Prediction) => p.date === today && ["active", "waiting_result", "success", "failed", "exact_success"].includes(p.status)
      ).sort((a: Prediction, b: Prediction) => a.time.localeCompare(b.time));
      setTodayPredictions(todayPreds);

      const upcomingPreds = allPredictions.filter(
        (p: Prediction) => p.date > today && ["active", "waiting_result"].includes(p.status)
      ).sort((a: Prediction, b: Prediction) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      }).slice(0, 20);
      setUpcomingPredictions(upcomingPreds);

      const pastPreds = allPredictions.filter(
        (p: Prediction) => p.date < today && ["success", "failed", "exact_success", "waiting_result"].includes(p.status)
      ).sort((a: Prediction, b: Prediction) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return b.time.localeCompare(a.time);
      }).slice(0, 20);
      setPastPredictions(pastPreds);

      // Get history (last 10 predictions regardless of date, ordered by created_at)
      const historyPreds = allPredictions
        .filter((p: Prediction) => ["success", "failed", "exact_success", "active", "waiting_result"].includes(p.status))
        .sort((a: Prediction, b: Prediction) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        .slice(0, 10);
      setHistoryPredictions(historyPreds);
    } catch (err) {
      console.error("Error loading user profile:", err);
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
            {user.avg_odds !== null && user.avg_odds > 0 && (
              <div className="falcon-mini-card">
                <span className="falcon-muted">{t(lang, "stats.averageOdds")}</span>
                <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">
                  {user.avg_odds.toFixed(2)}
                </p>
              </div>
            )}
            {user.exact_score_predictions !== null && (
              <div className="falcon-mini-card">
                <span className="falcon-muted">{t(lang, "stats.exactScores")}</span>
                <p className="mt-2 text-2xl font-semibold text-[var(--color-falcon-primary)]">
                  {user.exact_score_predictions || 0}/{totalExactScorePredictions || 0}
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
          <>
            <div className="falcon-grid sm:grid-cols-2">
              {predictions.map((p) => {
                const isSuccess = p.result === "success" || p.result === "exact_success";
                const isFailed = p.result === "failed";
                const borderColor = isSuccess
                  ? "border-green-300 dark:border-green-600"
                  : isFailed
                  ? "border-red-300 dark:border-red-600"
                  : "border-slate-200/70 dark:border-slate-700/60";
                return (
                <article
                  key={p.id}
                  className={`rounded-[1.75rem] border ${borderColor} bg-white/80 p-4 shadow-[0_18px_38px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_24px_52px_rgba(15,23,42,0.16)] dark:bg-slate-900/60 dark:shadow-[0_22px_50px_rgba(15,23,42,0.6)]`}
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
                      <p className={`text-[10px] ${
                        p.result === "exact_success"
                          ? "text-green-600 dark:text-green-400 font-semibold"
                          : p.result === "failed" && p.status === "failed"
                          ? "text-red-600 dark:text-red-400 font-semibold"
                          : "text-slate-500 dark:text-slate-400"
                      }`}>
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
                            ? `🏆 ${t(lang, "status.success")}`
                            : p.result === "exact_success"
                              ? `🏆🏆 ${t(lang, "status.exactSuccess")}`
                              : t(lang, "status.failed")}
                        </span>
                      )}
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
          </>
        )}

      {/* History Section - Always visible, independent of tabs (like "mes pronostics" page) */}
      {historyPredictions.length > 0 && (
        <section className="falcon-shell space-y-4 mt-8">
          <div>
            <span className="falcon-muted">{t(lang, "user.history")}</span>
            <h2 className="falcon-title">{t(lang, "user.lastPredictions")}</h2>
          </div>
          <div className="space-y-2">
            {historyPredictions.map((p) => {
              const isSuccess = p.result === "success" || p.result === "exact_success";
              const isFailed = p.result === "failed";
              const borderColor = isSuccess
                ? "border-green-300 dark:border-green-600"
                : isFailed
                ? "border-red-300 dark:border-red-600"
                : "border-slate-200/70 dark:border-slate-700/60";
              return (
                <article
                  key={p.id}
                  className={`rounded-xl border ${borderColor} bg-white/80 p-3 shadow-sm dark:bg-slate-900/60`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">{p.match_name}</p>
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 px-2 py-0.5 text-[9px] font-semibold text-slate-600 dark:border-slate-700/60 dark:text-slate-300">
                          {p.odds.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400 mb-1">
                        <span className="capitalize">{p.sport}</span>
                        <CompetitionBadge code={p.competition} size="xs" />
                        <span>{formatDate(p.date)} · {p.time}</span>
                      </div>
                      <p className="text-[10px] font-medium text-slate-700 dark:text-slate-200 mb-1">{p.prediction_text}</p>
                      {p.probable_score && (
                        <p className={`text-[9px] mb-1 ${
                          p.result === "exact_success"
                            ? "text-green-600 dark:text-green-400 font-semibold"
                            : p.result === "failed" && p.status === "failed"
                            ? "text-red-600 dark:text-red-400 font-semibold"
                            : "text-slate-500 dark:text-slate-400"
                        }`}>
                          {t(lang, "home.probableScore")}: {p.probable_score}
                        </p>
                      )}
                    </div>
                    {p.result && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${
                          p.result === "success" || p.result === "exact_success"
                            ? "border-[rgba(0,210,122,0.35)] bg-[rgba(0,210,122,0.12)] text-[#0f5132] dark:border-[rgba(0,210,122,0.45)] dark:bg-[rgba(0,210,122,0.2)] dark:text-[#adf8d1]"
                            : "border-[rgba(230,55,87,0.35)] bg-[rgba(230,55,87,0.12)] text-[#c81f3f] dark:border-[rgba(230,55,87,0.45)] dark:bg-[rgba(230,55,87,0.2)] dark:text-[#f6a4b5]"
                        }`}
                      >
                        {p.result === "success"
                          ? `🏆 ${t(lang, "status.success")}`
                          : p.result === "exact_success"
                            ? `🏆🏆 ${t(lang, "status.exactSuccess")}`
                            : t(lang, "status.failed")}
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

    </div>
  );
}

