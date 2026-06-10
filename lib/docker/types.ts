export type Port = {
  IP: string;
  PrivatePort: number;
  PublicPort: number;
  Type: string;
};

export type Container = {
  Id: string;
  Names: string[];
  Image: string;
  ImageID: string;
  Created: number;
  State: string;
  Status: string;
  Labels: Record<string, string>;
  Ports?: Port[];
};

export type ContainerInspect = {
  Id: string;
  Created: string;
  Path: string;
  Args: string[];
  Image: string;
  Name: string;
  RestartCount: number;
  State: {
    Status: string;
    Running: boolean;
    Paused: boolean;
    Restarting: boolean;
    StartedAt: string;
    FinishedAt: string;
    ExitCode: number;
    Health?: { Status: string; FailingStreak: number };
  };
  Config: {
    Image: string;
    Cmd?: string[] | null;
    Labels: Record<string, string>;
    WorkingDir: string;
    User: string;
  };
  HostConfig: {
    NetworkMode: string;
    RestartPolicy: { Name: string; MaximumRetryCount: number };
  };
  Mounts: Array<{
    Type: string;
    Source: string;
    Destination: string;
    Mode: string;
    RW: boolean;
    Name?: string;
  }>;
  NetworkSettings: {
    Networks: Record<
      string,
      { IPAddress: string; Gatetway: string; MacAddress: string }
    >;
  };
};

export type ContainerStats = {
  cpu_stats?: {
    cpu_usage?: { total_usage?: number; percpu_usage?: number[] };
    system_cpu_usage?: number;
    online_cpus?: number;
  };
  precpu_stats?: {
    cpu_usage?: { total_usage?: number };
    system_cpu_usage?: number;
  };
  memory_stats?: { usage?: number; limit?: number };
  networks?: Record<string, { rx_bytes: number; tx_bytes: number }>;
};

export type LiveStatsData = {
  cpu: number;
  memUsed: number;
  memLimit: number;
  cores: number;
  netRx: number;
  netTx: number;
};

export type LiveStatsListener = (stats: LiveStatsData) => void;
