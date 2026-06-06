import { WidgetGrid } from "@/components/widget-grid";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <div className="space-y-8">
      <WidgetGrid />
    </div>
  );
}
