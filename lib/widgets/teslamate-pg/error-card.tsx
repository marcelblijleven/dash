import { Card, CardContent } from "@/components/ui/card";

export function PgErrorCard({ error }: { error: string }) {
  return (
    <Card className="h-full border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 text-sm">
        <div className="font-medium text-amber-700 dark:text-amber-300">
          Teslamate Postgres widget unavailable
        </div>
        <div className="mt-1 font-mono text-xs text-muted-foreground">
          {error}
        </div>
      </CardContent>
    </Card>
  );
}
