import type { Metadata } from "next";
import { Fira_Sans_Condensed, Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Toaster } from "sonner";
import { LangProvider } from "@/lib/lang-context";

const firaSansCondensed = Fira_Sans_Condensed({
  variable: "--font-fira-sans-condensed",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coupon fort",
  description: "Premium predictions dashboard",
  icons: {
    icon: "/cpficon.svg",
    apple: "/cpficon.svg",
    shortcut: "/cpficon.svg",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Coupon fort",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="min-h-svh text-[var(--color-text-primary-light)] dark:text-[var(--color-text-primary-dark)]" suppressHydrationWarning>
      <body
        className={`${firaSansCondensed.variable} ${poppins.variable} antialiased font-[family-name:var(--font-poppins)] bg-transparent`}
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const stored = localStorage.getItem('theme');
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const shouldDark = stored ? stored === 'dark' : prefersDark;
                  if (shouldDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <LangProvider>
          {children}
          <Toaster richColors position="top-center" />
        </LangProvider>
      </body>
    </html>
  );
}
