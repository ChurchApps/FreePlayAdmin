import { useQuery } from "@tanstack/react-query";
import { type GroupInterface } from "@churchapps/helpers";
import { queryClient } from "../queryClient";
import { type PlanTypeInterface, type Playlist, type ScheduleEntry, type Screen, type ScreenGroup } from "./interfaces";

export const keys = {
  screens: ["/screens", "DoingApi"],
  playlists: ["/playlists", "DoingApi"],
  screenGroups: ["/screenGroups", "DoingApi"],
  scheduleEntries: ["/scheduleEntries", "DoingApi"],
  groupEntries: (groupId: string) => ["/scheduleEntries/group/" + groupId, "DoingApi"],
  playlist: (id: string) => ["/playlists/" + id, "DoingApi"],
  planTypes: ["/planTypes", "DoingApi"],
  ministries: ["/groups/tag/ministry", "MembershipApi"]
};

export const useScreens = () => useQuery<Screen[]>({ queryKey: keys.screens, placeholderData: [] });
export const usePlaylists = () => useQuery<Playlist[]>({ queryKey: keys.playlists, placeholderData: [] });
export const useScreenGroups = () => useQuery<ScreenGroup[]>({ queryKey: keys.screenGroups, placeholderData: [] });
export const useScheduleEntries = () => useQuery<ScheduleEntry[]>({ queryKey: keys.scheduleEntries, placeholderData: [] });
export const useGroupEntries = (groupId?: string) => useQuery<ScheduleEntry[]>({ queryKey: keys.groupEntries(groupId || ""), enabled: !!groupId, placeholderData: [] });
export const usePlanTypes = () => useQuery<PlanTypeInterface[]>({ queryKey: keys.planTypes, placeholderData: [] });
export const useMinistries = () => useQuery<GroupInterface[]>({ queryKey: keys.ministries, placeholderData: [] });

export const invalidate = (...queryKeys: string[][]) => Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));

export const invalidateSchedule = () => queryClient.invalidateQueries({ predicate: (q) => String(q.queryKey[0]).startsWith("/scheduleEntries") });

export const planTypeLabel = (pt: PlanTypeInterface, ministries: GroupInterface[]) => {
  const ministry = ministries.find((m) => m.id === pt.ministryId);
  return ministry ? `${ministry.name} — ${pt.name}` : pt.name || "";
};
