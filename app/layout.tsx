import type { Metadata } from "next";
import "./globals.css";
import { ConfigErrorBanner } from "@/components/config-error-banner";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "dash",
  description: "Homelab dashboard",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script src="/theme.js" />
      </head>

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
