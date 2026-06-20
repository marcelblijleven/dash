export const ARR_SERVICES = [
  "sonarr",
  "radarr",
  "lidarr",
  "readarr",
] as const;

export type ArrService = (typeof ARR_SERVICES)[number];

export type ArrQueueItem = {
  id: number;
  title: string;
  subtitle: string | null;
  progress: number;
  sizeBytes: number;
  status: string;
  etaSeconds: number | null;
};

export type ArrCalendarItem = {
  id: number;
  title: string;
  subtitle: string | null;
  airDate: string;
  monitored: boolean;
  hasFile: boolean;
};

export type ArrSnapshot = {
  service: ArrService;
  queue: ArrQueueItem[];
  calendar: ArrCalendarItem[];
};
