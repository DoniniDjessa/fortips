"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { useLang } from "@/lib/lang";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Loader from "@/app/components/loader";
import CompetitionBadge from "@/app/components/competition-badge";

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

export default function TipLeadResultsPage() {
  const router = useRouter();
  const lang = useLang();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from("tip-predictions")
        .select(
          `*,
          tip-users:pseudo,email`
        )
        .eq("status", "waiting_result")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (error) throw error;

      const transformed = (data || []).map((p: any) => ({
        ...p,
        tip_users: p["tip-users"] || null,
      }));

      setPredictions(transformed);
    } catch (err: any) {
      toast.error(lang === "fr" ? "Erreur" : "Error");
    } finally {
      setLoading(false);
    }
  };

  const handleResult = async (id: string, result: "success" | "failed" | "exact_success") => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const res = await fetch("/api/admin/update-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prediction_id: id, result, user_id: userData.user.id }),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success(
        result === "success"
          ? lang === "fr"
            ? "Succès"
            : "Success"
          : result === "exact_success"
          ? lang === "fr"
            ? "Score exact"
            : "Exact score"
          : lang === "fr"
          ? "Échec"
          : "Failed"
      );

      loadPredictions();
    } catch (err) {
      toast.error(lang === "fr" ? "Erreur" : "Error");
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-6xl mx-auto flex items-center justify-center min-h-[200px]">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold font-[family-name:var(--font-fira-sans-condensed)] text-gray-900 dark:text-gray-100">
          {lang === "fr" ? "Résultats en attente" : "Waiting results"}
        </h1>
        <Link
          href="/tip-lead/pending"
          className="inline-flex items-center justify-center rounded-xl bg-gray-900 text-white dark:bg-slate-800 dark:text-gray-100 px-3 py-2 text-xs font-medium hover:opacity-90 transition"
        >
          {lang === "fr" ? "En attente" : "Pending"}
        </Link>
      </div>

      {predictions.length === 0 ? (
        <div className="bg-white dark:bg-slate-700 rounded-2xl shadow-sm p-6 text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {lang === "fr" ? "Aucun résultat en attente" : "No results waiting"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((p) => {
            const userName = p.tip_users?.pseudo || p.tip_users?.email || "Unknown";
            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-700 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-slate-600"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {lang === "fr" ? "Utilisateur:" : "User:"} <span className="font-medium">{userName}</span>
                    </div>
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">{p.match_name}</div>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 mb-1">
                      <span className="capitalize">{p.sport}</span>
                      <CompetitionBadge code={p.competition} size="xs" />
                    </div>
                    <div className="text-xs text-gray-700 dark:text-gray-300 font-medium mb-1">{p.prediction_text}</div>
                    {p.probable_score && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {lang === "fr" ? "Score probable:" : "Probable score:"} <span className="font-medium">{p.probable_score}</span>
                      </div>
                    )}
                    {p.details && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">{p.details}</div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">{p.odds.toFixed(2)}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      {new Date(p.date).toLocaleDateString()} {p.time}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleResult(p.id, "success")}
                        className="inline-flex items-center justify-center rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-medium hover:opacity-90 transition"
                      >
                        ✓ {lang === "fr" ? "Succès" : "Success"}
                      </button>
                      {p.probable_score && (
                        <button
                          onClick={() => handleResult(p.id, "exact_success")}
                          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-medium hover:opacity-90 transition"
                        >
                          🏁 {lang === "fr" ? "Score exact" : "Exact"}
                        </button>
                      )}
                      <button
                        onClick={() => handleResult(p.id, "failed")}
                        className="inline-flex items-center justify-center rounded-lg bg-red-600 text-white px-3 py-1.5 text-xs font-medium hover:opacity-90 transition"
                      >
                        ✕ {lang === "fr" ? "Échec" : "Failed"}
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

