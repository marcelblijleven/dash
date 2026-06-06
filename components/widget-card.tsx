import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WidgetCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-center justify-between gap-2 pb-2">
        <CardTitle>{title}</CardTitle>
        {hint}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
