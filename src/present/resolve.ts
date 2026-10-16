import { ApiHelper } from "@churchapps/apphelper";
import { type PlaylistItem, type Playlist, type ScheduleEntry } from "../helpers";
import { getProviderPlaylist } from "../providers/useProviders";

const VIDEO_EXT = /\.(mp4|webm|mov|m4v|m3u8)(\?|#|$)/i;

export const guessMediaType = (url?: string): PlaylistItem["mediaType"] => (url && VIDEO_EXT.test(url) ? "video" : "image");

const fromFiles = (files: { id?: string; title?: string; name?: string; url?: string; mediaType?: PlaylistItem["mediaType"]; seconds?: number; loopVideo?: boolean; thumbnail?: string }[], providerId?: string, providerPath?: string): PlaylistItem[] => files
  .filter((f) => f.url)
  .map((f) => ({ id: f.id, title: f.title || f.name, url: f.url, mediaType: f.mediaType || guessMediaType(f.url), seconds: f.seconds, loopVideo: f.loopVideo, thumbnail: f.thumbnail, providerId, providerPath }));

export const resolveTarget = async (entry: ScheduleEntry, playlists: Playlist[]): Promise<{ name: string; items: PlaylistItem[] }> => {
  if (entry.targetType === "planType" && entry.targetId) {
    const feed = await ApiHelper.getAnonymous("/planFeed/signage/" + entry.targetId, "DoingApi");
    const items = (feed?.messages || []).flatMap((m: { name?: string; files?: { url: string; seconds?: number; loopVideo?: boolean; name?: string }[] }) => fromFiles((m.files || []).map((f) => ({ ...f, name: f.name || m.name }))));
    return { name: feed?.planName || feed?.lessonName || "Current plan", items };
  }
  if (entry.targetType === "providerFolder" && entry.providerId && entry.providerPath) {
    const files = await getProviderPlaylist(entry.providerId, entry.providerPath);
    return { name: decodeURIComponent(entry.providerPath.split("/").filter(Boolean).pop() || "Provider folder"), items: fromFiles(files, entry.providerId, entry.providerPath) };
  }
  const playlist = playlists.find((p) => p.id === entry.targetId);
  return { name: playlist?.name || "Playlist", items: playlist?.items || [] };
};

// Provider links can expire (Drive, OneDrive, Dropbox temp links); re-read the folder and match the file id.
export const refreshItemUrl = async (item: PlaylistItem): Promise<string | null> => {
  if (!item.providerId || !item.providerPath) return null;
  try {
    const files = await getProviderPlaylist(item.providerId, item.providerPath);
    const match = files.find((f) => f.id === item.id) || files.find((f) => f.title === item.title);
    return match?.url && match.url !== item.url ? match.url : null;
  } catch {
    return null;
  }
};
