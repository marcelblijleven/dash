"use client";

import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "dash-hide-sensitive";

function apply(hide: boolean) {
  if (typeof document === "undefined") return;
  if (hide) {
    document.documentElement.setAttribute("data-hide-sensitive", "true");
  } else {
    document.documentElement.removeAttribute("data-hide-sensitive");
  }
}

export function SensitiveToggle() {
  const [hide, setHide] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === "true";
    setHide(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (hide) localStorage.setItem(STORAGE_KEY, "true");
    else localStorage.removeItem(STORAGE_KEY);
    apply(hide);
  }, [hide, mounted]);

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== STORAGE_KEY && e.key !== null) return;
      setHide(e.newValue === "true");
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const label = hide ? "Show sensitive info" : "Hide sensitive info";

  return (
    <button
      type="button"
      onClick={() => setHide((h) => !h)}
      aria-label={label}
      aria-pressed={hide}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      {!mounted ? (
        <Eye className="size-4" aria-hidden />
      ) : hide ? (
        <EyeOff className="size-4" aria-hidden />
      ) : (
        <Eye className="size-4" aria-hidden />
      )}
    </button>
  );
}
