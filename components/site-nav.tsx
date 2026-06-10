"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type NavLink = { href: string; label: string };

const links: NavLink[] = [{ href: "/containers", label: "Containers" }];

export function DesktopNav() {
  return (
    <nav className="hidden items-center gap-1 text-sm text-muted-foreground md:flex">
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
  );
}

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
      >
        {open ? (
          <X className="size-4" aria-hidden />
        ) : (
          <Menu className="size-4" aria-hidden />
        )}
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 top-14 bottom-0 z-10 cursor-default bg-background/40 backdrop-blur-sm md:hidden"
          />
          <div className="absolute inset-x-0 top-14 z-20 border-b border-border bg-background md:hidden">
            <nav className="mx-auto flex max-w-7xl flex-col px-6 py-2 text-sm">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2.5 py-2.5 text-foreground hover:bg-muted"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </>
      )}
    </>
  );
}
