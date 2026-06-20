import type {
  ArrCalendarItem,
  ArrQueueItem,
  ArrService,
  ArrSnapshot,
} from "./types";

const API_VERSION: Record<ArrService, string> = {
  sonarr: "v3",
  radarr: "v3",
  lidarr: "v1",
  readarr: "v1",
};

const FETCH_TIMEOUT_MS = 10_000;

export type ArrConnection = {
  service: ArrService;
  url: string;
  apiKey: string;
};

function trimTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

async function arrFetch<T>(
  conn: ArrConnection,
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const base = trimTrailingSlash(conn.url);
  const version = API_VERSION[conn.service];
  const url = `${base}/api/${version}${path}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const combinedSignal = signal
    ? AbortSignal.any([signal, controller.signal])
    : controller.signal;

  try {
    const res = await fetch(url, {
      headers: { "X-Api-Key": conn.apiKey, Accept: "application/json" },
      signal: combinedSignal,
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`${conn.service} ${path} → ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

// ---- queue normalisation ----

type SonarrSeries = { title?: string };
type SonarrEpisode = {
  seasonNumber?: number;
  episodeNumber?: number;
  title?: string;
};
type RadarrMovie = { title?: string; year?: number };
type LidarrArtist = { artistName?: string };
type LidarrAlbum = { title?: string };
type ReadarrAuthor = { authorName?: string };
type ReadarrBook = { title?: string };

type RawQueueRecord = {
  id: number;
  title?: string;
  size?: number;
  sizeleft?: number;
  status?: string;
  timeleft?: string;
  series?: SonarrSeries;
  episode?: SonarrEpisode;
  movie?: RadarrMovie;
  artist?: LidarrArtist;
  album?: LidarrAlbum;
  author?: ReadarrAuthor;
  book?: ReadarrBook;
};

type RawQueueResponse = { records?: RawQueueRecord[] };

function parseTimeleft(timeleft: string | undefined): number | null {
  if (!timeleft) return null;
  // Servarr timeleft format: "HH:MM:SS" or "D.HH:MM:SS"
  const m = timeleft.match(/^(?:(\d+)\.)?(\d{1,2}):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const days = m[1] ? Number(m[1]) : 0;
  const hours = Number(m[2]);
  const minutes = Number(m[3]);
  const seconds = Number(m[4]);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

function normalizeQueueItem(
  service: ArrService,
  raw: RawQueueRecord,
): ArrQueueItem {
  const size = raw.size ?? 0;
  const sizeleft = raw.sizeleft ?? 0;
  const progress = size > 0 ? Math.max(0, Math.min(1, 1 - sizeleft / size)) : 0;

  let title = raw.title ?? "Unknown";
  let subtitle: string | null = null;

  if (service === "sonarr") {
    const seriesTitle = raw.series?.title;
    const ep = raw.episode;
    if (seriesTitle) title = seriesTitle;
    if (ep) {
      const s = ep.seasonNumber?.toString().padStart(2, "0");
      const e = ep.episodeNumber?.toString().padStart(2, "0");
      const code = s && e ? `S${s}E${e}` : null;
      subtitle = [code, ep.title].filter(Boolean).join(" · ") || null;
    }
  } else if (service === "radarr") {
    const movie = raw.movie;
    if (movie?.title) title = movie.title;
    subtitle = movie?.year ? String(movie.year) : null;
  } else if (service === "lidarr") {
    const artist = raw.artist?.artistName;
    if (artist) title = artist;
    subtitle = raw.album?.title ?? null;
  } else if (service === "readarr") {
    const author = raw.author?.authorName;
    if (author) title = author;
    subtitle = raw.book?.title ?? null;
  }

  return {
    id: raw.id,
    title,
    subtitle,
    progress,
    sizeBytes: size,
    status: raw.status ?? "unknown",
    etaSeconds: parseTimeleft(raw.timeleft),
  };
}

// ---- calendar normalisation ----

type RawCalendarRecord = {
  id: number;
  title?: string;
  airDateUtc?: string;
  releaseDate?: string;
  digitalRelease?: string;
  inCinemas?: string;
  monitored?: boolean;
  hasFile?: boolean;
  seasonNumber?: number;
  episodeNumber?: number;
  series?: SonarrSeries;
  artist?: LidarrArtist;
  author?: ReadarrAuthor;
  year?: number;
};

function pickCalendarDate(service: ArrService, raw: RawCalendarRecord): string {
  if (service === "sonarr") return raw.airDateUtc ?? "";
  if (service === "radarr") {
    return raw.digitalRelease ?? raw.inCinemas ?? raw.releaseDate ?? "";
  }
  return raw.releaseDate ?? raw.airDateUtc ?? "";
}

function normalizeCalendarItem(
  service: ArrService,
  raw: RawCalendarRecord,
): ArrCalendarItem {
  let title = raw.title ?? "Unknown";
  let subtitle: string | null = null;

  if (service === "sonarr") {
    const seriesTitle = raw.series?.title;
    if (seriesTitle) title = seriesTitle;
    const s = raw.seasonNumber?.toString().padStart(2, "0");
    const e = raw.episodeNumber?.toString().padStart(2, "0");
    const code = s && e ? `S${s}E${e}` : null;
    subtitle = [code, raw.title].filter(Boolean).join(" · ") || null;
  } else if (service === "radarr") {
    subtitle = raw.year ? String(raw.year) : null;
  } else if (service === "lidarr") {
    const artist = raw.artist?.artistName;
    if (artist) {
      subtitle = title;
      title = artist;
    }
  } else if (service === "readarr") {
    const author = raw.author?.authorName;
    if (author) {
      subtitle = title;
      title = author;
    }
  }

  return {
    id: raw.id,
    title,
    subtitle,
    airDate: pickCalendarDate(service, raw),
    monitored: raw.monitored ?? true,
    hasFile: raw.hasFile ?? false,
  };
}

// ---- public API ----

const QUEUE_LIMIT = 10;
const CALENDAR_DAYS_AHEAD = 7;

export async function getArrSnapshot(
  conn: ArrConnection,
  signal?: AbortSignal,
): Promise<ArrSnapshot> {
  const now = new Date();
  const end = new Date(now.getTime() + CALENDAR_DAYS_AHEAD * 86400 * 1000);
  const calendarPath = `/calendar?start=${now.toISOString()}&end=${end.toISOString()}&unmonitored=false&includeSeries=true&includeArtist=true&includeAuthor=true`;
  const queuePath = `/queue?pageSize=${QUEUE_LIMIT}&includeSeries=true&includeEpisode=true&includeMovie=true&includeArtist=true&includeAlbum=true&includeAuthor=true&includeBook=true`;

  const [queue, calendar] = await Promise.all([
    arrFetch<RawQueueResponse>(conn, queuePath, signal),
    arrFetch<RawCalendarRecord[]>(conn, calendarPath, signal),
  ]);

  return {
    service: conn.service,
    queue: (queue.records ?? []).map((r) => normalizeQueueItem(conn.service, r)),
    calendar: calendar.map((r) => normalizeCalendarItem(conn.service, r)),
  };
}
