import { loadConfig } from "@/lib/config/loader";

export async function ConfigErrorBanner() {
  const { error, source } = await loadConfig();

  if (!error) {
    return null;
  }

  return (
    <div className="mb-6 rounded-lg border border-rose-500/30 bg-rose-500/5 p-4 text-sm">
      <div className="font-medium text-rose-700 dark:text-rose-300">
        Config error
      </div>
      <div className="mt-1 break-all text-xs text-muted-foreground">
        <code className="font-mono">{source}</code>: {error}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">
        Edit the configuration on the host and Dash will pick up the change
        automatically.
      </div>
    </div>
  );
}
