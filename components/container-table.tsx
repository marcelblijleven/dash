import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StatusDot } from "@/components/ui/status-dot";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { containerName, isHealthy } from "@/lib/docker";
import type { Container } from "@/lib/docker/docker";

function statusVariant(container: Container) {
  if (container.State === "running") {
    return isHealthy(container) ? "success" : "warning";
  }
  if (container.State === "restarting" || container.State === "paused")
    return "warning";
  return "danger";
}

export function ContainerTable({ containers }: { containers: Container[] }) {
  const sorted = [...containers].sort((a, b) =>
    containerName(a).localeCompare(containerName(b)),
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[28%]">Name</TableHead>
          <TableHead className="hidden sm:table-cell">Image</TableHead>
          <TableHead className="w-30">State</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((container) => {
          const variant = statusVariant(container);

          return (
            <TableRow key={container.Id}>
              <TableCell className="font-medium">
                <Link
                  href={`/containers/${container.Id}`}
                  className="-mx-2 inline-flex items-center gap-2 rounded px-2 py-0.5 hover:bg-muted hover:text-foreground"
                >
                  <StatusDot variant={variant} />
                  {containerName(container)}
                </Link>
              </TableCell>
              <TableCell className="hidden font-mono text-xs text-muted-foreground sm:table-cell">
                {container.Image}
              </TableCell>
              <TableCell>
                <Badge variant={variant}>{container.State}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
