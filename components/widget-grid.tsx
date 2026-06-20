import { Card, CardContent } from "@/components/ui/card";
import { loadConfig } from "@/lib/config/loader";
import type { WidgetSize } from "@/lib/config/schema";
import { widgetRegistry } from "@/lib/widgets/registry";
import type { WidgetType } from "@/lib/widgets/types";

const sizeClasses: Record<WidgetSize, string> = {
  small: "lg:col-span-1",
  medium: "lg:col-span-2",
  large: "lg:col-span-3",
};

export async function WidgetGrid() {
  const { config } = await loadConfig();
  if (config.widgets.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {config.widgets.map((widget) => {
        const Component = widgetRegistry[widget.type as WidgetType];
        const cls = sizeClasses[widget.size];
        if (!Component) {
          return (
            <div key={widget.id} className={cls}>
              <Card className="h-full border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-4 text-sm">
                  <div className="font-medium text-amber-700 dark:text-amber-300">
                    Unknown widget
                  </div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">
                    type: {widget.type}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        }
        return (
          <div key={widget.id} className={cls}>
            <Component config={widget} />
          </div>
        );
      })}
    </div>
  );
}
