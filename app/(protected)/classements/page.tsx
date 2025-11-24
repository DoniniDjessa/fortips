"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import { toast } from "sonner";
import Loader from "@/app/components/loader";
import Link from "next/link";

type UserRanking = {
  id: string;
  pseudo: string | null;
  email: string | null;
  success_rate: number;
  total_predictions: number;
  success_predictions: number;
  exact_score_predictions: number;
  avg_odds: number;
};

type RankingType = "global" | "odds_range" | "sport" | "total" | "avg_odds" | "exact_scores";
type OddsRangeType = "very_safe" | "moderately_safe" | "risky" | "very_risky";

export default function RankingsPage() {
  const router = useRouter();
  const lang = useLang();
  const [loading, setLoading] = useState(true);
  const [rankingType, setRankingType] = useState<RankingType>("global");
  const [oddsRange, setOddsRange] = useState<OddsRangeType>("very_safe");
  const [sport, setSport] = useState<string>("");
  const [rankings, setRankings] = useState<UserRanking[]>([]);
  const [sports, setSports] = useState<string[]>([]);

  useEffect(() => {
    loadSports();
    loadRankings();
  }, [rankingType, oddsRange, sport]);

  const loadSports = async () => {
    try {
      const { data } = await supabase
        .from("tip-predictions")
        .select("sport")
        .not("sport", "is", null);
      
      if (data) {
        const uniqueSports = Array.from(new Set(data.map((p) => p.sport))).sort();
        setSports(uniqueSports);
      }
    } catch (err) {
      console.error("Error loading sports:", err);
    }
  };

  const loadRankings = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("tip-users")
        .select("id, pseudo, email, success_rate, total_predictions, success_predictions, exact_score_predictions, avg_odds")
        .not("total_predictions", "is", null)
        .gt("total_predictions", 0);

      const { data: users, error } = await query;

      if (error) throw error;

      if (!users || users.length === 0) {
        setRankings([]);
        setLoading(false);
        return;
      }

      let filteredUsers = users as UserRanking[];

      // Filter by odds range if selected
      if (rankingType === "odds_range") {
        const { data: predictions } = await supabase
          .from("tip-predictions")
          .select("user_id, odds, result")
          .in("status", ["success", "failed", "exact_success"]);

        if (predictions) {
          const rangeMap: Record<OddsRangeType, { min: number; max: number }> = {
            very_safe: { min: 1.0, max: 1.5 },
            moderately_safe: { min: 1.51, max: 2.0 },
            risky: { min: 2.01, max: 5.0 },
            very_risky: { min: 5.01, max: 999 },
          };

          const range = rangeMap[oddsRange];
          const userStats = new Map<string, { total: number; success: number }>();

          predictions.forEach((p) => {
            if (p.odds >= range.min && p.odds <= range.max) {
              const stats = userStats.get(p.user_id) || { total: 0, success: 0 };
              stats.total++;
              if (p.result === "success" || p.result === "exact_success") {
                stats.success++;
              }
              userStats.set(p.user_id, stats);
            }
          });

          filteredUsers = filteredUsers
            .map((u) => {
              const stats = userStats.get(u.id) || { total: 0, success: 0 };
              return {
                ...u,
                success_rate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
                total_predictions: stats.total,
                success_predictions: stats.success,
              };
            })
            .filter((u) => u.total_predictions > 0);
        }
      }

      // Filter by sport if selected
      if (rankingType === "sport" && sport) {
        const { data: predictions } = await supabase
          .from("tip-predictions")
          .select("user_id, result")
          .eq("sport", sport)
          .in("status", ["success", "failed", "exact_success"]);

        if (predictions) {
          const userStats = new Map<string, { total: number; success: number }>();

          predictions.forEach((p) => {
            const stats = userStats.get(p.user_id) || { total: 0, success: 0 };
            stats.total++;
            if (p.result === "success" || p.result === "exact_success") {
              stats.success++;
            }
            userStats.set(p.user_id, stats);
          });

          filteredUsers = filteredUsers
            .map((u) => {
              const stats = userStats.get(u.id) || { total: 0, success: 0 };
              return {
                ...u,
                success_rate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
                total_predictions: stats.total,
                success_predictions: stats.success,
              };
            })
            .filter((u) => u.total_predictions > 0);
        }
      }

      // Calculate exact score rate if ranking by exact scores
      if (rankingType === "exact_scores") {
        const { data: predictions } = await supabase
          .from("tip-predictions")
          .select("user_id, probable_score, result")
          .not("probable_score", "is", null)
          .in("status", ["success", "failed", "exact_success"]);

        if (predictions) {
          const userStats = new Map<string, { total: number; exactSuccess: number }>();

          predictions.forEach((p) => {
            if (p.probable_score) {
              const stats = userStats.get(p.user_id) || { total: 0, exactSuccess: 0 };
              stats.total++;
              if (p.result === "exact_success") {
                stats.exactSuccess++;
              }
              userStats.set(p.user_id, stats);
            }
          });

          filteredUsers = filteredUsers
            .map((u) => {
              const stats = userStats.get(u.id) || { total: 0, exactSuccess: 0 };
              return {
                ...u,
                success_rate: stats.total > 0 ? (stats.exactSuccess / stats.total) * 100 : 0,
                total_predictions: stats.total,
                success_predictions: stats.exactSuccess,
              };
            })
            .filter((u) => u.total_predictions > 0);
        }
      }

      // Sort based on ranking type
      // For all ranking types, sort by percentage first, then by the target metric
      let sorted: UserRanking[] = [];
      switch (rankingType) {
        case "global":
        case "odds_range":
        case "sport":
          sorted = filteredUsers.sort((a, b) => {
            if (b.success_rate !== a.success_rate) {
              return b.success_rate - a.success_rate;
            }
            return b.total_predictions - a.total_predictions;
          });
          break;
        case "total":
          sorted = filteredUsers.sort((a, b) => {
            // Sort by percentage first, then by total predictions
            if (b.success_rate !== a.success_rate) {
              return b.success_rate - a.success_rate;
            }
            return b.total_predictions - a.total_predictions;
          });
          break;
        case "avg_odds":
          sorted = filteredUsers
            .filter((u) => u.avg_odds > 0)
            .sort((a, b) => {
              // Sort by percentage first, then by average odds
              if (b.success_rate !== a.success_rate) {
                return b.success_rate - a.success_rate;
              }
              return b.avg_odds - a.avg_odds;
            });
          break;
        case "exact_scores":
          sorted = filteredUsers.sort((a, b) => {
            // Sort by percentage first, then by exact scores
            if (b.success_rate !== a.success_rate) {
              return b.success_rate - a.success_rate;
            }
            return b.exact_score_predictions - a.exact_score_predictions;
          });
          break;
      }

      // Limit to top 20 entries regardless of filter
      setRankings(sorted.slice(0, 20));
    } catch (err: any) {
      toast.error(t(lang, "common.error"));
      console.error("Error loading rankings:", err);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (user: UserRanking) => {
    return user.pseudo || user.email || "Unknown";
  };

  const getRankingTitle = () => {
    switch (rankingType) {
      case "global":
        return t(lang, "rankings.globalPercentage");
      case "odds_range":
        return `${t(lang, "rankings.byOddsRange")} - ${t(lang, `rankings.${oddsRange}`)}`;
      case "sport":
        return `${t(lang, "rankings.bySport")} - ${sport || t(lang, "rankings.allSports")}`;
      case "total":
        return t(lang, "rankings.byTotalPredictions");
      case "avg_odds":
        return t(lang, "rankings.byAvgOdds");
      case "exact_scores":
        return t(lang, "rankings.byExactScores");
      default:
        return t(lang, "rankings.title");
    }
  };

  if (loading && rankings.length === 0) {
    return (
      <div className="p-4 max-w-6xl mx-auto flex items-center justify-center min-h-[200px]">
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
            <span className="falcon-muted">{t(lang, "rankings.subtitle")}</span>
            <h1 className="falcon-title">{t(lang, "rankings.title")}</h1>
          </div>
        </div>
        <div className="inline-flex items-center gap-2">
          <button onClick={loadRankings} className="falcon-pill-link">
            {t(lang, "rankings.refresh")}
          </button>
        </div>
      </header>

      {/* Ranking Type Selector */}
      <section className="falcon-shell">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {t(lang, "rankings.title")}:
          </span>
          <select
            value={rankingType}
            onChange={(e) => setRankingType(e.target.value as RankingType)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
          >
            <option value="global">{t(lang, "rankings.globalPercentage")}</option>
            <option value="odds_range">{t(lang, "rankings.byOddsRange")}</option>
            <option value="sport">{t(lang, "rankings.bySport")}</option>
            <option value="total">{t(lang, "rankings.byTotalPredictions")}</option>
            <option value="avg_odds">{t(lang, "rankings.byAvgOdds")}</option>
            <option value="exact_scores">{t(lang, "rankings.byExactScores")}</option>
          </select>
        </div>

        {/* Odds Range Selector */}
        {rankingType === "odds_range" && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t(lang, "rankings.byOddsRange")}:
            </span>
            {(["very_safe", "moderately_safe", "risky", "very_risky"] as OddsRangeType[]).map((range) => (
              <button
                key={range}
                onClick={() => setOddsRange(range)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                  oddsRange === range
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {t(lang, `rankings.${range}`)}
              </button>
            ))}
          </div>
        )}

        {/* Sport Selector */}
        {rankingType === "sport" && (
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              {t(lang, "rankings.bySport")}:
            </span>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              <option value="">{t(lang, "rankings.allSports")}</option>
              {sports.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* Rankings Table */}
      <section className="falcon-shell">
        <div className="mb-4">
          <h2 className="falcon-title text-lg">{getRankingTitle()}</h2>
        </div>

        {rankings.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            {t(lang, "rankings.noData")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t(lang, "rankings.rank")}
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t(lang, "rankings.user")}
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {t(lang, "rankings.percentage")}
                  </th>
                  {(rankingType === "global" || rankingType === "odds_range" || rankingType === "sport") && (
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t(lang, "rankings.total")}
                    </th>
                  )}
                  {rankingType === "avg_odds" && (
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t(lang, "rankings.avgOdds")}
                    </th>
                  )}
                  {rankingType === "exact_scores" && (
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t(lang, "rankings.exactScores")}
                    </th>
                  )}
                  {rankingType === "total" && (
                    <th className="text-right py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {t(lang, "rankings.total")} {t(lang, "rankings.predictions")}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rankings.map((user, index) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        #{index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        href={`/user/${user.id}`}
                        className="text-sm font-semibold text-[var(--color-falcon-primary)] hover:underline"
                      >
                        @{getUserName(user)}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-sm font-semibold ${
                          user.success_rate >= 80
                            ? "text-green-600 dark:text-green-400"
                            : user.success_rate <= 20 && user.total_predictions > 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-slate-700 dark:text-slate-200"
                        }`}
                      >
                        {user.success_rate.toFixed(1)}%
                      </span>
                    </td>
                    {(rankingType === "global" || rankingType === "odds_range" || rankingType === "sport") && (
                      <td className="py-3 px-4 text-right text-sm text-slate-600 dark:text-slate-400">
                        {user.success_predictions}/{user.total_predictions}
                      </td>
                    )}
                    {rankingType === "avg_odds" && (
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {user.avg_odds.toFixed(2)}
                      </td>
                    )}
                    {rankingType === "exact_scores" && (
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {user.success_predictions || 0}/{user.total_predictions || 0}
                      </td>
                    )}
                    {rankingType === "total" && (
                      <td className="py-3 px-4 text-right text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {user.total_predictions}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

