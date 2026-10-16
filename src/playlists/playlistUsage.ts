import { ApiHelper } from "@churchapps/apphelper";
import { type Playlist, type ScheduleEntry, type ScreenGroup } from "../helpers";

export const playlistUsage = (playlist: Playlist, entries: ScheduleEntry[], groups: ScreenGroup[]) => {
  const schedules = entries.filter((e) => e.targetType === "playlist" && e.targetId === playlist.id).length;
  const loops = groups.filter((g) => g.defaultPlaylistId === playlist.id);
  return { schedules, loops };
};

export const usageLabel = (playlist: Playlist, entries: ScheduleEntry[], groups: ScreenGroup[]) => {
  const { schedules, loops } = playlistUsage(playlist, entries, groups);
  const parts: string[] = [];
  if (loops.length) parts.push("Default loop · " + loops.map((g) => g.name).join(", "));
  if (schedules) parts.push(`${schedules} schedule${schedules === 1 ? "" : "s"}`);
  return parts.join(" · ");
};

export const duplicatePlaylist = async (playlist: Playlist): Promise<Playlist | undefined> => {
  const saved: Playlist[] = await ApiHelper.post("/playlists", [{ name: (playlist.name || "Playlist") + " (copy)", items: playlist.items || [] }], "DoingApi");
  return saved?.[0];
};
