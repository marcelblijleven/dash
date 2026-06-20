import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardValue } from "./ui/card";

export function StatCard({
  title,
  value,
  hint,
  headerHint,
  spark,
  className,
}: {
  title: string;
  value: ReactNode;
  hint?: ReactNode;
  headerHint?: ReactNode;
  spark?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle>{title}</CardTitle>
        {headerHint}
      </CardHeader>
      <CardContent>
        <CardValue>{value}</CardValue>
        {hint && (
          <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
        )}
        {spark && <div className="mt-3">{spark}</div>}
      </CardContent>
    </Card>
  );
}
