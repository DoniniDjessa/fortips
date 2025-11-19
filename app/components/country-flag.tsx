type CountryFlagProps = {
  flag?: string | null;
  country?: string | null;
  size?: "xs" | "sm" | "md";
  className?: string;
};

const SIZE_MAP = {
  xs: { width: 18, height: 12 },
  sm: { width: 24, height: 16 },
  md: { width: 32, height: 24 },
};

const COUNTRY_CODE_MAP: Record<string, string | null> = {
  "france": "fr",
  "angleterre": "gb",
  "espagne": "es",
  "italie": "it",
  "allemagne": "de",
  "portugal": "pt",
  "pays-bas": "nl",
  "belgique": "be",
  "ecosse": "gb",
  "russie": "ru",
  "turquie": "tr",
  "grece": "gr",
  "ukraine": "ua",
  "tchequie": "cz",
  "autriche": "at",
  "danemark": "dk",
  "suisse": "ch",
  "suede": "se",
  "norvege": "no",
  "pologne": "pl",
  "roumanie": "ro",
  "hongrie": "hu",
  "croatie": "hr",
  "serbie": "rs",
  "slovenie": "si",
  "slovaquie": "sk",
  "bulgarie": "bg",
  "chypre": "cy",
  "israel": "il",
  "irlande": "ie",
  "pays de galles": "gb",
  "irlande du nord": "gb",
  "europe": "eu",
  "bresil": "br",
  "argentine": "ar",
  "chili": "cl",
  "colombie": "co",
  "equateur": "ec",
  "perou": "pe",
  "uruguay": "uy",
  "amerique du sud": null,
  "etats-unis/canada": "us",
  "etats-unis": "us",
  "usa/canada": "us",
  "mexique": "mx",
  "amerique du nord/centrale": null,
  "afrique": null,
  "egypte": "eg",
  "maroc": "ma",
  "algerie": "dz",
  "cote d'ivoire": "ci",
  "rd congo": "cd",
  "afrique du sud": "za",
  "senegal": "sn",
  "cameroun": "cm",
  "kenya": "ke",
  "ghana": "gh",
  "benin": "bj",
  "tunisie": "tn",
  "asie": null,
  "japon": "jp",
  "coree du sud": "kr",
  "arabie saoudite": "sa",
  "chine": "cn",
  "qatar": "qa",
  "emirats arabes unis": "ae",
  "inde": "in",
  "australie": "au",
  "oceanie": null,
  "monde": null,
  "international": null,
  "europe/afrique": null,
  "nz/australie": "nz",
  "balkans": null,
};

const FLAG_OVERRIDES: Record<string, string | null> = {
  "🇺🇸🇨🇦": "us",
  "🏴": "gb",
  "🏆": null,
  "🌍": null,
  "🌎": null,
  "🌏": null,
};

function normalizeCountry(country?: string | null) {
  if (!country) return "";
  return country
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function emojiToCountryCode(flag?: string | null) {
  if (!flag) return null;
  const override = FLAG_OVERRIDES[flag];
  if (override !== undefined) return override;

  const codePoints = Array.from(flag);
  if (codePoints.length !== 2) return null;

  const code = codePoints
    .map((char) => {
      const base = char.codePointAt(0);
      if (!base) return "";
      return String.fromCharCode(base - 127397 + 97);
    })
    .join("");

  return code.length === 2 ? code : null;
}

function resolveFlagSource(flag?: string | null, country?: string | null) {
  const normalized = normalizeCountry(country);
  const override = COUNTRY_CODE_MAP[normalized];

  if (override === null) {
    return { type: "local" as const, src: "/globe.svg", alt: country ?? "Global" };
  }
  if (override) {
    return {
      type: "remote" as const,
      src: `https://flagcdn.com/24x18/${override}.png`,
      alt: country ?? override.toUpperCase(),
    };
  }

  const code = emojiToCountryCode(flag);
  if (code) {
    return {
      type: "remote" as const,
      src: `https://flagcdn.com/24x18/${code}.png`,
      alt: country ?? code.toUpperCase(),
    };
  }

  return { type: "local" as const, src: "/globe.svg", alt: country ?? "Global" };
}

export default function CountryFlag({ flag, country, size = "sm", className }: CountryFlagProps) {
  const dimensions = SIZE_MAP[size] ?? SIZE_MAP.sm;
  const source = resolveFlagSource(flag, country);

  const wrapperClasses =
    "inline-flex items-center justify-center overflow-hidden rounded-[6px] border border-slate-200/70 bg-white dark:border-slate-700/60 dark:bg-slate-900/60";

  return (
    <span
      className={`${wrapperClasses} ${className ?? ""}`}
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <img
        src={source.src}
        alt={source.alt}
        width={dimensions.width}
        height={dimensions.height}
        loading="lazy"
        className="block h-full w-full object-cover"
      />
    </span>
  );
}

