export function formatMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleString(undefined, { month: "short", year: "2-digit" });
}
