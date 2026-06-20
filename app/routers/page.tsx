import { unauthorized } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDot } from "@/components/ui/status-dot";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth/current-user";
import {
  buildServiceMap,
  extractHosts,
  listRouters,
  listServices,
  serviceHealthy,
} from "@/lib/traefik";

export const dynamic = "force-dynamic";

type Variant = "success" | "warning" | "danger" | "neutral";

export default async function RoutersPage() {
  const user = await requireUser();
  if (!user) {
    unauthorized();
  }
  const [routersR, servicesR] = await Promise.allSettled([
    listRouters(),
    listServices(),
  ]);
  const routers = routersR.status === "fulfilled" ? routersR.value : [];
  const services = servicesR.status === "fulfilled" ? servicesR.value : [];
  const serviceMap = buildServiceMap(services);

  const sorted = [...routers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Routers</h1>
        <p className="text-sm text-muted-foreground">
          Traefik HTTP routers and the services they expose.
        </p>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>HTTP Routers</CardTitle>
          <span className="text-xs text-muted-foreground tabular-nums">
            {sorted.length} total
          </span>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {sorted.length === 0 ? (
            <div className="px-5 pb-5 text-sm text-muted-foreground">
              No routers found, or the Traefik API is unreachable. Check{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                config.traefik.api_url
              </code>
              .
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[24%]">Name</TableHead>
                  <TableHead>Hosts</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="w-35">Entry points</TableHead>
                  <TableHead className="w-20">TLS</TableHead>
                  <TableHead className="w-30">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => {
                  const svc = serviceMap.get(r.service);
                  const healthy = svc ? serviceHealthy(svc) : null;
                  const variant: Variant =
                    r.status !== "enabled"
                      ? "warning"
                      : healthy === false
                        ? "danger"
                        : healthy === true
                          ? "success"
                          : "neutral";
                  const hosts = extractHosts(r.rule);
                  return (
                    <TableRow key={r.name}>
                      <TableCell className="font-mono text-xs font-medium">
                        {r.name}
                      </TableCell>
                      <TableCell className="text-xs">
                        {hosts.length === 0 ? (
                          <span className="text-muted-foreground">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1 font-mono">
                            {hosts.map((h) => (
                              <span key={h} data-sensitive="">
                                {h}
                              </span>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {r.service}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {(r.entryPoints ?? []).join(", ") || "-"}
                      </TableCell>
                      <TableCell>
                        {r.tls ? <Badge variant="neutral">TLS</Badge> : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant={variant}>
                          <StatusDot variant={variant} />
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
