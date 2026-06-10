import { cn } from "@/lib/utils";

export function StatusDot({
  variant = "success",
}: {
  variant?: "success" | "warning" | "danger" | "neutral";
}) {
  const color = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    neutral: "bg-muted-foreground",
  }[variant];
  return (
    <span
      className={cn("inline-block size-1.5 rounded-full", color)}
      aria-hidden
    />
  );
}
