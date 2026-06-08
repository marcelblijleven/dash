import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-nav";

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
        <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
