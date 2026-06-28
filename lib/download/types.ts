export const DOWNLOAD_CLIENTS = ["qbittorrent", "sabnzbd", "nzbget"] as const;

export type DownloadClientKind = (typeof DOWNLOAD_CLIENTS)[number];

export type DownloadItem = {
  id: string;
  name: string;
  progress: number;
  sizeBytes: number;
  etaSeconds: number | null;
  state: string;
};

export type DownloadSnapshot = {
  client: DownloadClientKind;
  // bytes/s
  downloadSpeed: number;
  // bytes/s, torrent clients only (null for usenet)
  uploadSpeed: number | null;
  activeCount: number;
  items: DownloadItem[];
};
