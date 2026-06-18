import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/auth/current-user";
import { DesktopNav, MobileMenu } from "./site-nav";
import { ThemeToggle } from "./theme-toggle";
import { Badge } from "./ui/badge";

export async function SiteHeader() {
  const user = await getCurrentUser();

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
          {user && (
            <>
              {isAdmin(user) && (
                <Badge variant="success" className="hidden sm:inline-flex">
                  admin
                </Badge>
              )}
              <span className="hidden text-muted-foreground sm:inline-flex">
                {user.name}
              </span>
            </>
          )}
          <ThemeToggle />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
