import { getStatusSnapshot } from "@/lib/status";
import { StatusGrid } from "./status-grid";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Status · dash",
};

export default async function StatusPage() {
  const initial = await getStatusSnapshot();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Status</h1>
        <p className="text-sm text-muted-foreground">
          Live container and app status. Public.
        </p>
      </div>
      <StatusGrid initial={initial} />
    </div>
  );
}
