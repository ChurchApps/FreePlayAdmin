import { type PlaylistItem, type Screen } from "./interfaces";

export const DEFAULT_IMAGE_SECONDS = 10;

export const formatDuration = (totalSeconds: number) => {
  const s = Math.max(0, Math.round(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = (s % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

export const itemSeconds = (item: PlaylistItem) => (item.mediaType === "image" ? item.seconds || DEFAULT_IMAGE_SECONDS : item.seconds || 0);

export const playlistSeconds = (items?: PlaylistItem[]) => (items || []).reduce((sum, i) => sum + itemSeconds(i), 0);

export const relativeAgo = (value?: Date | string) => {
  if (!value) return "Never";
  const ms = Date.now() - new Date(value).getTime();
  if (isNaN(ms)) return "Never";
  const min = Math.round(ms / 60000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min} min ago`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};

export const formatShortDate = (value?: Date | string) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};

export const formatLongDate = (value?: Date | string) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export const formatBytes = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return "";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
};

const ONLINE_MS = 15 * 60 * 1000;

export const isOnline = (screen: Screen) => !!screen.lastActiveDate && Date.now() - new Date(screen.lastActiveDate).getTime() < ONLINE_MS;

export const missingCount = (screen: Screen) => {
  const m = screen.status?.missing as unknown;
  return Array.isArray(m) ? m.length : Number(m) || 0;
};

export const nowPlayingTitle = (screen: Screen) => {
  const n = screen.status?.nowPlaying;
  return typeof n === "string" ? n : n?.title || "";
};

export const isScheduled = (screen: Screen) => screen.contentType === "freeplayScreen";

export const needsAttention = (screen: Screen) => !isOnline(screen) || missingCount(screen) > 0;

export const nextSundayEnd = () => {
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  d.setHours(23, 59, 59, 0);
  return d;
};

export const isReadyForSunday = (screen: Screen) => {
  const r = screen.status?.readyThrough;
  return !!r && new Date(r).getTime() >= nextSundayEnd().getTime() && missingCount(screen) === 0;
};

export const parseDeviceInfo = (screen: Screen): { platform?: string; model?: string; os?: string } => {
  if (!screen.deviceInfo) return {};
  try {
    const info = JSON.parse(screen.deviceInfo);
    return { platform: info.platform || info.osName || info.os, model: info.model || info.modelName || info.deviceName || info.brand, os: info.osVersion || info.version };
  } catch {
    return { model: screen.deviceInfo };
  }
};

export const deviceCaption = (screen: Screen) => {
  const info = parseDeviceInfo(screen);
  return [info.model || info.platform, screen.status?.appVersion].filter(Boolean).join(" · ");
};
