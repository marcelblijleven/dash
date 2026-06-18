"use client";

import { Play, RotateCw, Square } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { restartContainer, startContainer, stopContainer } from "./actions";

type Action = "start" | "stop" | "restart";

const labels: Record<Action, string> = {
  start: "Start",
  stop: "Stop",
  restart: "Restart",
};

export function ContainerActions({
  id,
  running,
}: {
  id: string;
  running: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [active, setActive] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run(action: Action) {
    if (!confirm(`${labels[action]} this container?`)) return;
    setActive(action);
    setError(null);
    startTransition(async () => {
      try {
        if (action === "start") await startContainer(id);
        else if (action === "stop") await stopContainer(id);
        else await restartContainer(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : "action failed");
      } finally {
        setActive(null);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        {running ? (
          <>
            <Button
              size="sm"
              variant="default"
              disabled={isPending}
              onClick={() => run("restart")}
            >
              <RotateCw
                className={`size-3.5 ${active === "restart" ? "animate-spin" : ""}`}
              />
              Restart
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={isPending}
              onClick={() => run("stop")}
            >
              <Square className="size-3.5" />
              Stop
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="primary"
            disabled={isPending}
            onClick={() => run("start")}
          >
            <Play className="size-3.5" />
            Start
          </Button>
        )}
      </div>
      {error && (
        <span className="text-xs text-rose-600 dark:text-rose-400">
          {error}
        </span>
      )}
    </div>
  );
}
