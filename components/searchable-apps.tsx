"use client";

import { Search, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { DashEntry } from "@/lib/dash/entries";
import { cn } from "@/lib/utils";
import { StatusDot } from "./ui/status-dot";

function groupByCategory(entries: DashEntry[]): Array<[string, DashEntry[]]> {
  const map = new Map<string, DashEntry[]>();
  for (const entry of entries) {
    const list = map.get(entry.category) ?? [];
    list.push(entry);
    map.set(entry.category, list);
  }
  return [...map.entries()].sort(([a], [b]) => {
    if (a === "uncategorized") return 1;
    if (b === "uncategorized") return -1;
    return a.localeCompare(b);
  });
}

export function SearchableApps({ entries }: { entries: DashEntry[] }) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;

    return entries.filter((e) => {
      if (e.name.toLowerCase().includes(q)) return true;
      if (e.description?.toLowerCase().includes(q)) return true;
      if (e.category.toLowerCase().includes(q)) return true;
      if (e.shortcuts.some((s) => s.name.toLowerCase().includes(q)))
        return true;
      return false;
    });
  }, [entries, query]);

  const groups = useMemo(() => groupByCategory(filtered), [filtered]);

  const indexById = useMemo(() => {
    const map = new Map<string, number>();
    filtered.forEach((e, i) => {
      map.set(e.id, i);
    });
    return map;
  }, [filtered]);

  // Reset active item whenever the filter changes: keep it on the first hit
  // when a query is active, and unset when there's no query.
  useEffect(() => {
    setActiveIndex(query.trim() ? 0 : -1);
  }, [query]);

  // Global key handling. The input has focus during most navigation.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const inField =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      const onSearchInput = target === inputRef.current;

      // Focus the input on `/` or ⌘K / Ctrl+K from anywhere.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      if (e.key === "/" && !inField) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }

      // Navigation only when the search input is focused.
      if (!onSearchInput) return;

      if (e.key === "Escape") {
        if (query) {
          setQuery("");
        } else {
          inputRef.current?.blur();
        }
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) =>
          filtered.length === 0 ? -1 : Math.min(i + 1, filtered.length - 1),
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) =>
          filtered.length === 0 ? -1 : Math.max(i - 1, 0),
        );
        return;
      }

      if (
        e.key === "Enter" &&
        activeIndex >= 0 &&
        activeIndex < filtered.length
      ) {
        const entry = filtered[activeIndex];
        const url = entry.externalUrl;
        if (url) {
          e.preventDefault();
          window.open(url, "_blank", "noopener,noreferrer");
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, activeIndex, query]);

  // Scroll the active card into view as the user arrows through results.
  useEffect(() => {
    if (activeIndex < 0 || !containerRef.current) return;
    const node = containerRef.current.querySelector<HTMLElement>(
      `[data-active-index="${activeIndex}"]`,
    );
    node?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeIndex]);

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Apps</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length === entries.length
              ? `${entries.length} app${entries.length === 1 ? "" : "s"}`
              : `${filtered.length} of ${entries.length} match`}{" "}
            ·
          </p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            ref={inputRef}
            type="search"
            placeholder="Search apps…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-md border border-border bg-background pl-8 pr-9 text-sm placeholder:text-muted-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            aria-label="Filter apps"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
              /
            </kbd>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-5 text-sm text-muted-foreground">
            No apps match{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {query}
            </code>
            .
          </CardContent>
        </Card>
      ) : (
        groups.map(([category, items]) => (
          <section key={category} className="space-y-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((e) => {
                const idx = indexById.get(e.id) ?? -1;
                return (
                  <AppCard
                    key={e.id}
                    entry={e}
                    active={idx === activeIndex}
                    flatIndex={idx}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function AppCard({
  entry,
  active,
  flatIndex,
}: {
  entry: DashEntry;
  active: boolean;
  flatIndex: number;
}) {
  const variant = entry.running
    ? entry.healthy
      ? "success"
      : "warning"
    : "danger";

  return (
    <Card
      data-active-index={flatIndex}
      className={cn(
        "relative scroll-mt-20 overflow-hidden transition-colors hover:border-primary/40",
        active && "border-primary/60 ring-2 ring-primary/20",
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <AppIcon icon={entry.icon} name={entry.name} />
            <div className="min-w-0">
              {entry.externalUrl ? (
                <a
                  href={entry.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate font-medium tracking-tight hover:text-primary before:absolute before:inset-0"
                >
                  {entry.name}
                </a>
              ) : (
                <span className="block truncate font-medium tracking-tight">
                  {entry.name}
                </span>
              )}
              {entry.description && (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {entry.description}
                </p>
              )}
            </div>
          </div>
          <StatusDot variant={variant} />
        </div>

        {entry.shortcuts.length > 0 && entry.externalUrl && (
          <div className="relative z-10 mt-3 flex flex-wrap gap-1">
            {entry.shortcuts.map((s) => (
              <a
                key={s.name}
                href={`${entry.externalUrl}${s.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s.name}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AppIcon({ icon, name }: { icon?: string; name: string }) {
  if (icon?.startsWith("http")) {
    return (
      <Image
        src={icon}
        alt="App icon"
        className={cn("size-9 shrink-0 rounded-md")}
      />
    );
  }
  if (icon) {
    const src = `https://cdn.jsdelivr.net/gh/selfhst/icons/png/${icon}.png`;
    return (
      <Image
        src={src}
        alt="App icon"
        className={cn("size-9 shrink-0 rounded-md")}
      />
    );
  }
  return (
    <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted text-sm font-semibold text-muted-foreground">
      {name[0]?.toUpperCase()}
    </div>
  );
}
