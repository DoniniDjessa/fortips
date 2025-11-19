import ThemeToggle from "./theme-toggle";
import LangToggle from "./lang-toggle";
import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-transparent">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-[-12rem] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(44,123,229,0.24),transparent_65%)] blur-3xl opacity-70 dark:opacity-50" />
        <div className="absolute -bottom-24 right-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(0,210,122,0.22),transparent_60%)] blur-[120px] opacity-70 dark:opacity-60" />
      </div>
      <header className="relative z-10 flex items-center justify-between px-6 py-6 sm:px-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:text-[var(--color-falcon-primary)] dark:text-slate-300"
        >
          <Image 
            src="/cpf.webp" 
            alt="Coupon fort" 
            width={100}
            height={32}
            className="h-8 w-auto"
            priority
          />
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LangToggle />
        </div>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">
          <div className="falcon-shell">{children}</div>
        </div>
      </main>
    </div>
  );
}


