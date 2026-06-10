import Link from "next/link";
import { DesktopNav, MobileMenu } from "./site-nav";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight"
          >
            <span className="size-2 rounded-sm bg-primary" aria-hidden />
            dash
          </Link>
          <DesktopNav />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
