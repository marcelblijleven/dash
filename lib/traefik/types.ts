export type RouterStatus = "enabled" | "disabled" | "warning";

export type Router = {
  name: string;
  rule: string;
  service: string;
  status: RouterStatus;
  using: string[];
  tls?: object;
  entryPoints?: string[];
  provider?: string;
};

export type Service = {
  name: string;
  status: RouterStatus;
  provider?: string;
  serverStatus?: Record<string, "UP" | "DOWN">;
  loadBalancer?: { servers?: { url: string }[] };
};
