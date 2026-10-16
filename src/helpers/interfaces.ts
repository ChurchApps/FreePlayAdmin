export type MediaType = "video" | "image" | "audio";

export interface PlaylistItem {
  id?: string;
  title?: string;
  mediaType?: MediaType;
  thumbnail?: string;
  url?: string;
  seconds?: number;
  loopVideo?: boolean;
  providerId?: string;
  providerPath?: string;
}

export interface Playlist {
  id?: string;
  churchId?: string;
  name?: string;
  items?: PlaylistItem[];
  updatedAt?: Date | string;
}

export interface ScreenGroup {
  id?: string;
  churchId?: string;
  name?: string;
  defaultPlaylistId?: string;
}

export type ScheduleTargetType = "playlist" | "planType" | "providerFolder";
export type EndBehavior = "loop" | "holdLast" | "fallback";

export interface ScheduleEntry {
  id?: string;
  churchId?: string;
  screenGroupId?: string;
  targetType?: ScheduleTargetType;
  targetId?: string | null;
  providerId?: string | null;
  providerPath?: string | null;
  start?: string;
  end?: string;
  recurrenceRule?: string | null;
  exceptionDates?: string[];
  endBehavior?: EndBehavior;
  enabled?: boolean;
}

export interface NowPlaying {
  occurrenceId?: string;
  cacheKey?: string;
  title?: string;
}

export interface ScreenStatus {
  manifestRev?: number;
  readyThrough?: Date | string;
  missing?: string[];
  freeBytes?: number;
  usedBytes?: number;
  nowPlaying?: NowPlaying | string;
  appVersion?: string;
  recent?: Array<string | { date?: Date | string; message?: string }>;
}

export interface Screen {
  id?: string;
  churchId?: string;
  deviceId?: string;
  appName?: string;
  label?: string;
  personId?: string;
  deviceInfo?: string;
  ipAddress?: string;
  contentType?: string;
  contentId?: string;
  registrationDate?: Date | string;
  lastActiveDate?: Date | string;
  status?: ScreenStatus;
  screenGroupId?: string;
  screenGroupName?: string;
}

export interface DeviceInterface {
  id?: string;
  churchId?: string;
  deviceId?: string;
  appName?: string;
  label?: string;
  personId?: string;
  deviceInfo?: string;
  contentType?: string;
  contentId?: string;
  registrationDate?: Date | string;
  lastActiveDate?: Date | string;
}

export interface PlanTypeInterface {
  id?: string;
  churchId?: string;
  ministryId?: string;
  name?: string;
}

export interface ContentProviderAuthInterface {
  id?: string;
  churchId?: string;
  ministryId?: string;
  providerId?: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresAt?: Date | string;
  scope?: string;
}

export const SCREEN_CONTENT_TYPE = "freeplayScreen";
export const MANUAL_CONTENT_TYPE = "b1church";
