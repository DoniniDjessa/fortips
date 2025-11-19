"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import Link from "next/link";
import Loader from "@/app/components/loader";
import CompetitionBadge from "@/app/components/competition-badge";

type TipUserInfo = {
  id: string;
  pseudo: string | null;
  email: string | null;
  role?: string | null;
  success_rate: number | null;
  total_predictions: number | null;
  avg_odds: number | null;
  exact_score_predictions: number | null;
};

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
  tip_users: TipUserInfo | null;
};

type Coupon = {
  predictions: Prediction[];
  totalOdds: number;
};

type DayKey = "yesterday" | "today" | "tomorrow";

const getStatusLabel = (status: string, lang: "fr" | "en"): { label: string; chip: string } => {
  const statusMap: Record<string, { chip: string; key: string }> = {
    pending_validation: {
      chip: "border-[rgba(246,195,67,0.35)] bg-[rgba(246,195,67,0.12)] text-[#9c6c12] dark:border-[rgba(246,195,67,0.45)] dark:bg-[rgba(246,195,67,0.2)] dark:text-[#f7d58b]",
      key: "status.pending",
    },
    active: {
      chip: "border-[rgba(44,123,229,0.3)] bg-[rgba(44,123,229,0.12)] text-[var(--color-falcon-primary)] dark:border-[rgba(44,123,229,0.45)] dark:bg-[rgba(44,123,229,0.22)] dark:text-[var(--color-falcon-primary)]",
      key: "status.active",
    },
    waiting_result: {
      chip: "border-[rgba(149,76,233,0.3)] bg-[rgba(149,76,233,0.12)] text-[#6f35c8] dark:border-[rgba(149,76,233,0.45)] dark:bg-[rgba(149,76,233,0.22)] dark:text-[#cfb4ff]",
      key: "status.waitingResult",
    },
    success: {
      chip: "border-[rgba(0,210,122,0.35)] bg-[rgba(0,210,122,0.12)] text-[#0f5132] dark:border-[rgba(0,210,122,0.45)] dark:bg-[rgba(0,210,122,0.2)] dark:text-[#adf8d1]",
      key: "status.success",
    },
    failed: {
      chip: "border-[rgba(230,55,87,0.35)] bg-[rgba(230,55,87,0.12)] text-[#c81f3f] dark:border-[rgba(230,55,87,0.45)] dark:bg-[rgba(230,55,87,0.2)] dark:text-[#f6a4b5]",
      key: "status.failed",
    },
    exact_success: {
      chip: "border-[rgba(0,210,122,0.45)] bg-[rgba(0,210,122,0.16)] text-[#0f5132] dark:border-[rgba(0,210,122,0.55)] dark:bg-[rgba(0,210,122,0.26)] dark:text-[#adf8d1]",
      key: "status.exactSuccess",
    },
  };
  const statusInfo = statusMap[status] || statusMap.active;
  return { label: t(lang, statusInfo.key), chip: statusInfo.chip };
};

export default function ProtectedHome() {
  const router = useRouter();
  const lang = useLang();
  const [dailyPredictions, setDailyPredictions] = useState<Record<DayKey, Prediction[]>>({
    yesterday: [],
    today: [],
    tomorrow: [],
  });
  const [activeDayTab, setActiveDayTab] = useState<DayKey>("today");
  const [adminCoupon, setAdminCoupon] = useState<Prediction[]>([]);
  const [bestUsersCoupon, setBestUsersCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/predictions/check-status", { method: "POST" }).catch(() => {});
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      const now = new Date();
      const today = formatISODate(now);
      const yesterday = formatISODate(addDays(now, -1));
      const tomorrow = formatISODate(addDays(now, 1));

      const { data: windowPreds, error: windowError } = await supabase
        .from("tip-predictions")
        .select(
          `*,
          tip_users:"tip-users"(id,pseudo,email,role,success_rate,total_predictions,avg_odds,exact_score_predictions)`
        )
        .gte("date", yesterday)
        .lte("date", tomorrow)
        .in("status", ["active", "waiting_result", "success", "failed", "exact_success"])
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (windowError) throw windowError;

      const grouped: Record<DayKey, Prediction[]> = {
        yesterday: [],
        today: [],
        tomorrow: [],
      };

      const mappedPredictions = (windowPreds as Prediction[] | null) ?? [];

      mappedPredictions.forEach((prediction) => {
        const key = getDayKey(prediction.date, { yesterday, today, tomorrow });
        if (key) {
          grouped[key].push(prediction);
        }
      });

      setDailyPredictions(grouped);

      // Get admin combined predictions (active predictions from admins)
      const { data: adminPreds } = await supabase
        .from("tip-predictions")
        .select(
          `*,
          tip_users:"tip-users"(id,pseudo,email,role,success_rate,total_predictions,avg_odds,exact_score_predictions)`
        )
        .eq("status", "active")
        .gte("date", today)
        .order("date", { ascending: true })
        .limit(20);

      if (adminPreds) {
        const adminOnly = adminPreds.filter((p) => p.tip_users?.role === "admin");
        setAdminCoupon(adminOnly as Prediction[]);
      }

      // Get random best users' predictions (coupon of 5 predictions from 5 random best users)
      const { data: bestUsers } = await supabase
        .from("tip-users")
        .select("id, pseudo, email, success_rate, total_predictions, avg_odds, exact_score_predictions")
        .not("success_rate", "is", null)
        .gt("success_rate", 60)
        .order("success_rate", { ascending: false })
        .limit(20);

      if (bestUsers && bestUsers.length > 0) {
        // Pick 5 random users
        const shuffled = [...bestUsers].sort(() => 0.5 - Math.random());
        const selectedUsers = shuffled.slice(0, 5);

        // Get one active prediction from each selected user
        const userPredictions = await Promise.all(
          selectedUsers.map(async (user) => {
            const { data } = await supabase
              .from("tip-predictions")
              .select("*")
              .eq("user_id", user.id)
              .eq("status", "active")
              .gte("date", today)
              .limit(1)
              .maybeSingle();

            if (data) {
              return {
                ...data,
                tip_users: {
                  id: user.id,
                  pseudo: user.pseudo,
                  email: user.email,
                  success_rate: user.success_rate,
                  total_predictions: user.total_predictions,
                  avg_odds: user.avg_odds,
                  exact_score_predictions: user.exact_score_predictions,
                },
              };
            }
            return null;
          })
        );

        const validPreds = userPredictions.filter((p): p is Prediction => p !== null);
        if (validPreds.length > 0) {
          const totalOdds = validPreds.reduce((acc, p) => acc * p.odds, 1);
          setBestUsersCoupon({ predictions: validPreds, totalOdds });
        }
      }
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

  const todayActivePredictions = dailyPredictions.today.filter((prediction) => prediction.status === "active");
  const totalToday = todayActivePredictions.length;
  const averageOdds = totalToday
    ? todayActivePredictions.reduce((acc, prediction) => acc + (prediction.odds || 0), 0) / totalToday
    : 0;
  const adminTotalOdds = adminCoupon.length
    ? adminCoupon.reduce((acc, prediction) => acc * (prediction.odds || 1), 1)
    : 0;
  const bestPlayersAverageSuccess =
    bestUsersCoupon && bestUsersCoupon.predictions.length
      ? bestUsersCoupon.predictions.reduce((acc, prediction) => acc + (prediction.tip_users?.success_rate || 0), 0) /
        bestUsersCoupon.predictions.length
      : 0;

  const dayTabs: { key: DayKey; labelKey: string }[] = [
    { key: "yesterday", labelKey: "home.yesterday" },
    { key: "today", labelKey: "home.today" },
    { key: "tomorrow", labelKey: "home.tomorrow" },
  ];
  const selectedDayPredictions = dailyPredictions[activeDayTab];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <span className="falcon-muted">{t(lang, "home.overview")}</span>
          <h1 className="falcon-title">
            {t(lang, "home.liveFeed")}
          </h1>
        </div>
        <Link href="/predictions/new" className="falcon-btn-primary hidden sm:inline-flex">
          {t(lang, "home.createPick")}
        </Link>
      </div>

      <section className="falcon-grid md:grid-cols-2 xl:grid-cols-4">
        <div className="falcon-mini-card">
          <span className="falcon-muted">{t(lang, "home.todaysPicks")}</span>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl font-semibold text-slate-800 dark:text-white">{totalToday}</p>
            <span className="falcon-chip">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
                <path d="M6 12h12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
                <path d="M12 6v12" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
              </svg>
              {t(lang, "home.live")}
            </span>
          </div>
        </div>
        <div className="falcon-mini-card">
          <span className="falcon-muted">{t(lang, "home.averageOdds")}</span>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl font-semibold text-slate-800 dark:text-white">
              {averageOdds.toFixed(2)}
            </p>
            <span className="falcon-chip">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 12.75 10.5 17.25 18 6.75"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                />
              </svg>
              {t(lang, "home.quality")}
            </span>
          </div>
        </div>
        <div className="falcon-mini-card">
          <span className="falcon-muted">{t(lang, "home.adminCombo")}</span>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl font-semibold text-slate-800 dark:text-white">
              {adminCoupon.length ? adminTotalOdds.toFixed(2) : "—"}
            </p>
            <span className="falcon-chip">
              <svg className="h-3.5 w-3.5 text-[var(--color-falcon-primary)]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2 3 8l9 6 9-6-9-6Zm0 9.743L5.18 7.14l-2.18 1.455L12 13.97l8.998-5.376L18.82 7.14 12 11.743Z" />
              </svg>
              {t(lang, "home.premium")}
            </span>
          </div>
        </div>
        <div className="falcon-mini-card">
          <span className="falcon-muted">{t(lang, "home.avgSuccess")}</span>
          <div className="mt-2 flex items-end justify-between">
            <p className="text-2xl font-semibold text-slate-800 dark:text-white">
              {bestUsersCoupon && bestUsersCoupon.predictions.length
                ? `${bestPlayersAverageSuccess.toFixed(1)}%`
                : "—"}
            </p>
            <span className="falcon-chip-success">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.75a9.75 9.75 0 1 0 0-19.5 9.75 9.75 0 0 0 0 19.5Zm4.53-11.47-5.025 5.025a.75.75 0 0 1-1.06 0L7.47 12.33a.75.75 0 1 1 1.06-1.06l2.145 2.145 4.495-4.495a.75.75 0 1 1 1.06 1.06Z" />
              </svg>
              {t(lang, "home.experts")}
            </span>
          </div>
        </div>
      </section>

      <section className="falcon-grid lg:grid-cols-2">
        {adminCoupon.length > 0 && (
          <div className="falcon-shell space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="falcon-muted">{t(lang, "home.editorialPick")}</span>
                <h2 className="falcon-title">{t(lang, "home.adminCoupon")}</h2>
              </div>
              <span className="falcon-chip">
                {t(lang, "home.totalOdds")} {adminTotalOdds.toFixed(2)}
              </span>
            </div>
            <div className="space-y-3">
              {adminCoupon.map((p) => {
                const userName = p.tip_users?.pseudo || p.tip_users?.email || "Admin";
                return (
                  <article key={p.id} className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link
                          href={`/user/${p.user_id}`}
                          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-falcon-primary)]"
                        >
                          @{userName}
                        </Link>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{p.match_name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400">
                          <span className="capitalize">{p.sport}</span>
                          <CompetitionBadge code={p.competition} size="xs" />
                        </div>
                        <p className="text-[11px] font-medium text-slate-700 dark:text-white">{p.prediction_text}</p>
                        {p.probable_score && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {t(lang, "home.projectedScore")}: {p.probable_score}
                          </p>
                        )}
                      </div>
                      <div className="min-w-[80px] text-right">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.odds.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {formatDate(p.date)} · {p.time}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {bestUsersCoupon && bestUsersCoupon.predictions.length > 0 && (
          <div className="falcon-shell space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="falcon-muted">{t(lang, "home.communityHighlight")}</span>
                <h2 className="falcon-title">{t(lang, "home.topPerformers")}</h2>
              </div>
              <span className="falcon-chip">
                {t(lang, "home.totalOdds")} {bestUsersCoupon.totalOdds.toFixed(2)}
              </span>
            </div>
            <div className="space-y-3">
              {bestUsersCoupon.predictions.map((p) => {
                const userName = p.tip_users?.pseudo || p.tip_users?.email || "User";
                const successRate = p.tip_users?.success_rate?.toFixed(1) || "0.0";
                return (
                  <article key={p.id} className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-3 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0 space-y-1">
                        <Link
                          href={`/user/${p.user_id}`}
                          className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-falcon-primary)]"
                        >
                          @{userName}
                        </Link>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {t(lang, "home.successRate")} {successRate}%
                        </p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{p.match_name}</p>
                        <div className="flex flex-wrap items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400">
                          <span className="capitalize">{p.sport}</span>
                          <CompetitionBadge code={p.competition} size="xs" />
                        </div>
                        <p className="text-[11px] font-medium text-slate-700 dark:text-white">{p.prediction_text}</p>
                        {p.probable_score && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            {t(lang, "home.projectedScore")}: {p.probable_score}
                          </p>
                        )}
                      </div>
                      <div className="min-w-[80px] text-right">
                        <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.odds.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {formatDate(p.date)} · {p.time}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="falcon-shell space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="falcon-muted">{t(lang, "home.liveStream")}</span>
            <h2 className="falcon-title">{t(lang, "home.predictions")}</h2>
          </div>
          <div className="inline-flex gap-2">
            <Link href="/predictions" className="falcon-pill-link">
              {t(lang, "home.viewAll")}
            </Link>
            <Link href="/stats" className="falcon-pill-link">
              {t(lang, "home.stats")}
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {dayTabs.map((tab) => {
            const isActive = activeDayTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveDayTab(tab.key)}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                  isActive
                    ? "border-[var(--color-falcon-primary)] bg-[rgba(44,123,229,0.1)] text-[var(--color-falcon-primary)] shadow-sm"
                    : "border-slate-200 text-slate-500 hover:border-[var(--color-falcon-primary)] hover:text-[var(--color-falcon-primary)] dark:border-slate-700 dark:text-slate-400"
                }`}
              >
                {t(lang, tab.labelKey)}
              </button>
            );
          })}
        </div>

        {selectedDayPredictions.length === 0 ? (
          <div className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-6 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {getEmptyStateCopy(activeDayTab, lang)}
            </p>
          </div>
        ) : (
          <div className="falcon-grid sm:grid-cols-2">
            {selectedDayPredictions.map((p) => {
              const userName = p.tip_users?.pseudo || p.tip_users?.email || "User";
              const statusInfo = getStatusLabel(p.status, lang);
              const performanceBadges = buildPerformanceBadges(p.tip_users, lang);
              return (
                <article key={p.id} className="rounded-[1.5rem] border border-slate-200/70 bg-white/80 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-700/60 dark:bg-slate-900/60">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <Link
                        href={`/user/${p.user_id}`}
                        className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--color-falcon-primary)]"
                      >
                        @{userName}
                      </Link>
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] ${statusInfo.chip}`}
                      >
                        {statusInfo.label}
                      </span>
                    </div>
                    {performanceBadges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {performanceBadges.map((badge) => (
                          <span
                            key={badge}
                            className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-white"
                          >
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">{p.match_name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[9px] text-slate-500 dark:text-slate-400">
                        <span className="capitalize">{p.sport}</span>
                        <CompetitionBadge code={p.competition} size="xs" />
                      </div>
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-700 dark:text-white">
                        {t(lang, "home.odds")}
                      </span>
                      <span className="inline-flex items-center justify-center rounded-full border border-slate-200/70 px-3 py-1 text-[11px] font-semibold text-slate-800 dark:border-slate-700/60 dark:text-white">
                        {p.odds.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function getDayKey(date: string, refs: { yesterday: string; today: string; tomorrow: string }): DayKey | null {
  if (date === refs.today) return "today";
  if (date === refs.yesterday) return "yesterday";
  if (date === refs.tomorrow) return "tomorrow";
  return null;
}

function addDays(base: Date, amount: number) {
  const copy = new Date(base);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function formatISODate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getEmptyStateCopy(tab: DayKey, lang: "fr" | "en") {
  const keyMap: Record<DayKey, string> = {
    yesterday: "home.noPredictionsYesterday",
    today: "home.noPredictionsToday",
    tomorrow: "home.noPredictionsTomorrow",
  };
  return t(lang, keyMap[tab]);
}

function buildPerformanceBadges(user: TipUserInfo | null, lang: "fr" | "en") {
  if (!user) return [];

  const badges: string[] = [];
  const total = user.total_predictions ?? 0;
  const successRate = user.success_rate ?? 0;
  const avgOdds = user.avg_odds ?? 0;
  const exact = user.exact_score_predictions ?? 0;

  if (successRate && total >= 5) {
    badges.push(`${t(lang, "home.winRate")} ${successRate.toFixed(0)}%`);
  }
  if (total) {
    badges.push(`${total} ${t(lang, "home.picks")}`);
  }
  if (avgOdds) {
    badges.push(`${t(lang, "home.avgOdds")} ${avgOdds.toFixed(2)}`);
  }
  if (exact) {
    badges.push(`${exact} ${t(lang, "home.exactScores")}`);
  }

  if (successRate === 100 && total >= 5) {
    badges.unshift(t(lang, "home.perfectStreak"));
  } else if (successRate >= 80 && total >= 25) {
    badges.unshift(t(lang, "home.topPick"));
  }

  return Array.from(new Set(badges));
}
