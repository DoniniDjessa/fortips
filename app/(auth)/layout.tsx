import ThemeToggle from "./theme-toggle";
import LangToggle from "./lang-toggle";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-svh flex flex-col items-stretch">
      <header className="flex items-center justify-between p-4 sm:p-6">
        <Link href="/" className="text-base font-semibold font-[family-name:var(--font-fira-sans-condensed)]">
          Fortips
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LangToggle />
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {children}
        </div>
      </main>
    </div>
  );
}


