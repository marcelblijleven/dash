import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";
import type { CSSProperties } from "react";
import { ConfigErrorBanner } from "@/components/config-error-banner";
import { SiteHeader } from "@/components/site-header";
import { loadConfig } from "@/lib/config/loader";

export const metadata: Metadata = {
  title: "dash",
  description: "Homelab dashboard",
  robots: { index: false, follow: false },
};

// Re-read the theme config on every request so edits to config.yml take
// effect on the next reload without restarting the server.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { config } = await loadConfig();
  const preset = config.theme.preset ?? "orange";
  const glass = config.theme.glass ?? "none";
  const primary = config.theme.primary;
  const htmlStyle = primary
    ? ({ "--primary": primary } as CSSProperties)
    : undefined;

  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-theme={preset}
      data-glass={glass}
      style={htmlStyle}
      suppressHydrationWarning
    >
      <Script src="/theme.js" />
      <Script src="/sensitive.js" />
      <body className="min-h-dvh">
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <ConfigErrorBanner />
          {children}
        </main>
      </body>
    </html>
  );
}
