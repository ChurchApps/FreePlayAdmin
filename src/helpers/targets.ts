import { type GroupInterface } from "@churchapps/helpers";
import { type ProviderInfo } from "@churchapps/content-providers";
import { type PlanTypeInterface, type Playlist, type ScheduleEntry } from "./interfaces";

export interface TargetContext {
  playlists: Playlist[];
  planTypes: PlanTypeInterface[];
  ministries: GroupInterface[];
  providers: ProviderInfo[];
}

export const TARGET_COLORS: Record<string, string> = { playlist: "var(--b1-primary)", planType: "#6A1B9A", providerFolder: "#00695C" };

export const TARGET_KINDS: Record<string, string> = { playlist: "playlist", planType: "service plan", providerFolder: "provider folder" };

export const folderLabel = (providers: ProviderInfo[], providerId?: string | null, providerPath?: string | null) => {
  const name = providers.find((p) => p.id === providerId)?.name || providerId || "";
  const last = (providerPath || "").split("/").filter(Boolean).pop();
  return last ? `${name} › ${decodeURIComponent(last)}` : name;
};

export const describeTarget = (entry: ScheduleEntry, ctx: TargetContext) => {
  if (entry.targetType === "planType") {
    const pt = ctx.planTypes.find((p) => p.id === entry.targetId);
    return `${pt?.name || "Service plan"} — current plan`;
  }
  if (entry.targetType === "providerFolder") return folderLabel(ctx.providers, entry.providerId, entry.providerPath);
  return ctx.playlists.find((p) => p.id === entry.targetId)?.name || "Playlist";
};

export const END_BEHAVIOR_SHORT: Record<string, string> = { loop: "loop", holdLast: "teacher paced", fallback: "play once, then default", teacherPaced: "teacher paced" };
