"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { competitions } from "@/lib/competitions";
import { useLang } from "@/lib/lang";
import { t } from "@/app/i18n";
import { toast } from "sonner";
import CountryFlag from "@/app/components/country-flag";

const sports = [
  { value: "football", label: "Football ⚽" },
  { value: "handball", label: "Handball 🤾" },
  { value: "rugby", label: "Rugby 🏉" },
  { value: "basketball", label: "Basketball 🏀" },
];

type CompetitionOption = {
  code: string;
  name: string;
  country?: string | null;
  flag?: string | null;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type FormState = {
  sport: string;
  competition: string;
  match_name: string;
  odds: string;
  probable_score: string;
  prediction_text: string;
  details: string;
  date: string;
  time: string;
};

export default function NewPredictionPage() {
  const router = useRouter();
  const lang = useLang();
  const [form, setForm] = useState<FormState>({
    sport: "",
    competition: "",
    match_name: "",
    odds: "",
    probable_score: "",
    prediction_text: "",
    details: "",
    date: "",
    time: "",
  });
  const [loading, setLoading] = useState(false);
  const [availableCompetitions, setAvailableCompetitions] = useState<CompetitionOption[]>([]);
  const [competitionQuery, setCompetitionQuery] = useState("");
  const [showCompetitionList, setShowCompetitionList] = useState(false);

  const selectedCompetition = availableCompetitions.find((comp) => comp.code === form.competition) ?? null;

  useEffect(() => {
    if (form.sport) {
      const comps = (competitions as any)[form.sport] || [];
      setAvailableCompetitions(comps);
      if (comps.length === 0) {
        setShowCompetitionList(false);
        setForm((f) => (f.competition ? { ...f, competition: "" } : f));
        return;
      }
      const hasCurrent = comps.some((comp: CompetitionOption) => comp.code === form.competition);
      if (!hasCurrent) {
        const defaultCompetition = comps[0];
        setForm((f) => ({ ...f, competition: defaultCompetition.code }));
      }
    } else {
      setAvailableCompetitions([]);
      setCompetitionQuery("");
      setShowCompetitionList(false);
      setForm((f) => (f.competition ? { ...f, competition: "" } : f));
    }
  }, [form.sport]);

  useEffect(() => {
    if (!form.sport) return;
    const current = availableCompetitions.find((comp) => comp.code === form.competition);
    if (current) {
      setCompetitionQuery(current.name);
    }
  }, [form.competition, form.sport, availableCompetitions]);

  const disableCompetitionInput = !form.sport || availableCompetitions.length === 0;
  const normalizedQuery = normalizeText(competitionQuery.trim());
  const selectedNormalizedName = selectedCompetition ? normalizeText(selectedCompetition.name) : "";
  const shouldFilter =
    normalizedQuery.length > 0 &&
    (!selectedCompetition || normalizedQuery !== selectedNormalizedName);
  const filteredCompetitions = shouldFilter
    ? availableCompetitions.filter((comp) => {
        const nameMatch = normalizeText(comp.name).includes(normalizedQuery);
        const countryMatch = normalizeText(comp.country ?? "").includes(normalizedQuery);
        const codeMatch = normalizeText(comp.code).includes(normalizedQuery);
        return nameMatch || countryMatch || codeMatch;
      })
    : availableCompetitions;

  const handleCompetitionInput = (value: string) => {
    if (disableCompetitionInput) return;
    setCompetitionQuery(value);
    setShowCompetitionList(true);
    const normalizedValue = normalizeText(value.trim());
    const exactMatch =
      normalizedValue.length === 0
        ? null
        : availableCompetitions.find(
            (comp) =>
              normalizeText(comp.name) === normalizedValue || normalizeText(comp.code) === normalizedValue
          );

    setForm((f) => {
      if (exactMatch) {
        if (f.competition === exactMatch.code) return f;
        return { ...f, competition: exactMatch.code };
      }
      if (!f.competition) return f;
      return { ...f, competition: "" };
    });
  };

  const handleSelectCompetition = (competition: CompetitionOption) => {
    setForm((f) => (f.competition === competition.code ? f : { ...f, competition: competition.code }));
    setCompetitionQuery(competition.name);
    setShowCompetitionList(false);
  };

  const handleCompetitionKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (disableCompetitionInput) return;
    if (event.key === "Enter") {
      event.preventDefault();
      const target = selectedCompetition ?? filteredCompetitions[0];
      if (target) {
        handleSelectCompetition(target);
      }
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      setShowCompetitionList(true);
    } else if (event.key === "Escape") {
      setShowCompetitionList(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.competition) {
      toast.error(t(lang, "newPrediction.selectValidCompetition"));
      return;
    }
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not authenticated");

      const { error } = await supabase.from("tip-predictions").insert({
        user_id: userData.user.id,
        sport: form.sport,
        competition: form.competition,
        match_name: form.match_name.trim(),
        odds: parseFloat(form.odds),
        probable_score: form.probable_score.trim() || null,
        prediction_text: form.prediction_text.trim(),
        details: form.details.trim() || null,
        date: form.date,
        time: form.time,
        status: "pending_validation",
      });

      if (error) throw error;

      toast.success(t(lang, "newPrediction.predictionCreated"));
      router.push("/predictions");
    } catch (err: any) {
      toast.error(t(lang, "common.error"));
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 pb-20">
      <header className="flex items-center gap-3">
        <button onClick={() => router.push("/predictions")} className="falcon-pill-link px-3 py-2">
          ← {t(lang, "common.back")}
        </button>
        <div>
          <span className="falcon-muted">{t(lang, "newPrediction.creation")}</span>
          <h1 className="falcon-title">{t(lang, "newPrediction.newPrediction")}</h1>
        </div>
      </header>

      <div className="falcon-shell space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="falcon-subtitle">
            {t(lang, "newPrediction.subtitle")}
          </p>
          <span className="falcon-chip">
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 6v6h4.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.6"
              />
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.4" opacity="0.4" />
            </svg>
            {t(lang, "newPrediction.quickForm")}
          </span>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="falcon-form-label" htmlFor="sport">
                {t(lang, "newPrediction.sport")}
              </label>
              <select
                id="sport"
                value={form.sport}
                onChange={(e) => setForm((f) => ({ ...f, sport: e.target.value, competition: "" }))}
                className="falcon-form-control"
                required
              >
                <option value="">{t(lang, "newPrediction.selectSport")}</option>
                {sports.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="falcon-form-label" htmlFor="competition">
                {t(lang, "newPrediction.competition")}
              </label>
              <div className="relative">
                {selectedCompetition && (
                  <CountryFlag
                    flag={selectedCompetition.flag}
                    country={selectedCompetition.country}
                    size="xs"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                  />
                )}
                <input
                  id="competition"
                  type="text"
                  value={competitionQuery}
                  onChange={(e) => handleCompetitionInput(e.target.value)}
                  onFocus={() => {
                    if (!disableCompetitionInput) {
                      setShowCompetitionList(true);
                    }
                  }}
                  onBlur={() => setTimeout(() => setShowCompetitionList(false), 150)}
                  onKeyDown={handleCompetitionKeyDown}
                  className={`falcon-form-control ${selectedCompetition ? "pl-11" : ""}`}
                  placeholder={
                    disableCompetitionInput
                      ? t(lang, "newPrediction.selectSportFirst")
                      : t(lang, "newPrediction.typeToSearch")
                  }
                  autoComplete="off"
                  required
                  disabled={disableCompetitionInput}
                  aria-autocomplete="list"
                  aria-expanded={showCompetitionList}
                  aria-controls="competition-listbox"
                  spellCheck={false}
                />
                {showCompetitionList && !disableCompetitionInput && (
                  <div
                    id="competition-listbox"
                    role="listbox"
                    className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-xl border border-slate-200/80 bg-white shadow-lg dark:border-slate-700/60 dark:bg-slate-900"
                  >
                    {filteredCompetitions.length > 0 ? (
                      filteredCompetitions.map((c) => {
                        const isActive = form.competition === c.code;
                        return (
                          <button
                            type="button"
                            key={c.code}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectCompetition(c)}
                            className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                              isActive ? "bg-slate-100/60 dark:bg-slate-800/80" : ""
                            }`}
                            role="option"
                            aria-selected={isActive}
                          >
                            <CountryFlag flag={c.flag} country={c.country} size="xs" />
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700 dark:text-slate-100">{c.name}</span>
                              <span className="text-[10px] text-slate-500 dark:text-slate-400">{c.country}</span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-[11px] text-slate-500 dark:text-slate-400">
                        {t(lang, "newPrediction.noCompetitionsFound")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedCompetition && (
            <div className="flex items-center gap-3 rounded-[1.25rem] border border-slate-200/70 bg-white/80 px-3 py-2 text-[10px] text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-300">
              <CountryFlag flag={selectedCompetition.flag} country={selectedCompetition.country} size="sm" />
              <div className="flex flex-col">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  {selectedCompetition.name}
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400">{selectedCompetition.country}</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="falcon-form-label" htmlFor="match">
              {t(lang, "newPrediction.match")}
            </label>
            <input
              id="match"
              type="text"
              value={form.match_name}
              onChange={(e) => setForm((f) => ({ ...f, match_name: e.target.value }))}
              className="falcon-form-control"
              placeholder={t(lang, "newPrediction.matchExample")}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <label className="falcon-form-label" htmlFor="date">
                {t(lang, "newPrediction.date")}
              </label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                min={today}
                className="falcon-form-control"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="falcon-form-label" htmlFor="time">
                {t(lang, "newPrediction.time")}
              </label>
              <input
                id="time"
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="falcon-form-control"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="falcon-form-label" htmlFor="odds">
                {t(lang, "newPrediction.odds")}
              </label>
              <input
                id="odds"
                type="number"
                step="0.01"
                min="1.00"
                value={form.odds}
                onChange={(e) => setForm((f) => ({ ...f, odds: e.target.value }))}
                className="falcon-form-control"
                placeholder="1.85"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="falcon-form-label" htmlFor="mainPrediction">
              {t(lang, "newPrediction.mainPrediction")}
            </label>
            <input
              id="mainPrediction"
              type="text"
              value={form.prediction_text}
              onChange={(e) => setForm((f) => ({ ...f, prediction_text: e.target.value }))}
              className="falcon-form-control"
              placeholder={t(lang, "newPrediction.mainPredictionExample")}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="falcon-form-label" htmlFor="score">
                {t(lang, "newPrediction.probableScore")} ({t(lang, "newPrediction.optional")})
              </label>
              <input
                id="score"
                type="text"
                value={form.probable_score}
                onChange={(e) => setForm((f) => ({ ...f, probable_score: e.target.value }))}
                className="falcon-form-control"
                placeholder="2-1"
              />
            </div>
            <div className="space-y-2">
              <label className="falcon-form-label" htmlFor="details">
                {t(lang, "newPrediction.detailsRemarks")} ({t(lang, "newPrediction.optional")})
              </label>
              <textarea
                id="details"
                value={form.details}
                onChange={(e) => setForm((f) => ({ ...f, details: e.target.value }))}
                rows={3}
                className="falcon-form-control resize-none"
                placeholder={t(lang, "newPrediction.detailsExample")}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="falcon-btn-primary w-full disabled:opacity-60"
          >
            {loading ? t(lang, "newPrediction.creating") : t(lang, "newPrediction.createPrediction")}
          </button>
        </form>
      </div>
    </div>
  );
}

