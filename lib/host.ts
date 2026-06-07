import { readFile } from "node:fs/promises";

export type HostStats = {
  uptime: number;
  loadAvg: [number, number, number];
  memTotal: number;
  memAvailable: number;
};

type ProcName = "uptime" | "loadavg" | "meminfo";

function procRoot() {
  return (
    process.env.DASH_PROC_ROOT ??
    (process.env.NODE_ENV === "development" ? ".dev/proc" : "/host/proc")
  );
}

async function readProc(name: ProcName): Promise<string> {
  const root = procRoot();
  console.log(root);
  try {
    return await readFile(`${root}/${name}`, "utf8");
  } catch {
    return readFile(`/proc/${name}`, "utf8");
  }
}

export async function getHostStats(): Promise<HostStats | null> {
  try {
    const [uptimeRaw, loadRaw, meminfoRaw] = await Promise.all([
      readProc("uptime"),
      readProc("loadavg"),
      readProc("meminfo"),
    ]);
    const [first] = uptimeRaw.split(" ");
    const uptime = parseFloat(first ?? "0");
    const [l1, l5, l15] = loadRaw.split(" ").slice(0, 3).map(Number) as [
      number,
      number,
      number,
    ];
    const memTotal =
      parseInt(meminfoRaw.match(/MemTotal:\s+(\d+)/)?.[1] ?? "0", 10) * 1024;
    const memAvailable =
      parseInt(meminfoRaw.match(/MemAvailable:\s+(\d+)/)?.[1] ?? "0", 10) *
      1024;
    return { uptime, loadAvg: [l1, l5, l15], memTotal, memAvailable };
  } catch {
    return null;
  }
}
