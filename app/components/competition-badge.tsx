import CountryFlag from "./country-flag";
import { competitionIndex } from "@/lib/competitions";

type CompetitionBadgeProps = {
  code?: string | null;
  className?: string;
  size?: "xs" | "sm";
};

export default function CompetitionBadge({ code, className, size = "sm" }: CompetitionBadgeProps) {
  if (!code) return null;

  const competition = competitionIndex[code];
  const label = competition?.name ?? code;
  const country = competition?.country ?? null;
  const flag = competition?.flag ?? null;

  const textClass = size === "xs" ? "text-[9px]" : "text-[10px]";
  const padding = size === "xs" ? "px-2 py-1" : "px-2.5 py-1.5";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 ${padding} ${textClass} font-medium text-slate-600 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200 ${
        className ?? ""
      }`}
    >
      <CountryFlag flag={flag} country={country} size={size === "xs" ? "xs" : "sm"} />
      <span className="max-w-[120px] truncate">{label}</span>
    </span>
  );
}

