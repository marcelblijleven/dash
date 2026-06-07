import { cn } from "@/lib/utils";

export function Sparkline({
  data,
  height = 32,
  className,
  fill = true,
}: {
  data: number[];
  height?: number;
  className?: string;
  fill?: boolean;
}) {
  if (data.length < 2) {
    return <div style={{ height }} className={cn(className)} aria-hidden />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 100;
  const h = height;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 2) - 1; // 1px top+bottom padding
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const fillPath = fill ? `${linePath} L${w} ${h} L0 ${h} Z` : null;

  return (
    <svg
      className={cn("block h-8 w-full", className)}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <title>Sparkline</title>
      {fillPath && <path d={fillPath} className="fill-primary/15" />}
      <path
        d={linePath}
        className="stroke-primary fill-none"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
