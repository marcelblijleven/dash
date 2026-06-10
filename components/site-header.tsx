import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

type NavLink = { href: string; label: string };

const links: NavLink[] = [{ href: "/containers", label: "Containers" }];

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
        </div>
        <div className="flex items-center gap-2 text-sm">
          <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            foo
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-2.5 py-1 transition-colors hover:bg-muted hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
