import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  activeOccurrence, describeTarget, expandEntries, formatWallDay, formatWallTime, keys, nowWall, useChurchTimeZone, useGroupEntries, useMinistries, usePlanTypes, usePlaylists, useScreenGroups, useScreens,
  wallDateKey, type Playlist, type PlaylistItem
} from "../helpers";
import { useProviders } from "../providers/useProviders";
import { screenGroupId } from "../screens/components/ScreenEditSheet";
import { Player } from "./Player";
import { resolveTarget } from "./resolve";

const useExit = () => {
  const navigate = useNavigate();
  return React.useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    if (window.history.length > 1) navigate(-1);
    else navigate("/screens");
  }, [navigate]);
};

export const PresentPlaylistPage: React.FC = () => {
  const { id = "" } = useParams();
  const onExit = useExit();
  const playlist = useQuery<Playlist>({ queryKey: keys.playlist(id), enabled: !!id });
  return (
    <Player
      name={playlist.data?.name || "Playlist"}
      items={playlist.data?.items || []}
      segmentKey={id}
      message={playlist.isFetching ? "Loading…" : "This playlist is empty."}
      onExit={onExit}
    />
  );
};

const HOUR = 3600000;

export const PresentScreenPage: React.FC = () => {
  const { deviceId = "" } = useParams();
  const onExit = useExit();
  const tz = useChurchTimeZone();
  const screensQuery = useScreens();
  const screen = (screensQuery.data || []).find((s) => s.deviceId === deviceId);
  const groupId = screen ? screenGroupId(screen) : "";
  const group = (useScreenGroups().data || []).find((g) => g.id === groupId);
  const entries = useGroupEntries(groupId || undefined).data || [];
  const playlists = usePlaylists().data || [];
  const planTypes = usePlanTypes().data || [];
  const ministries = useMinistries().data || [];
  const { all: providers } = useProviders();

  const [now, setNow] = React.useState(() => nowWall(tz));
  const [resolved, setResolved] = React.useState<{ key: string; name: string; items: PlaylistItem[] } | null>(null);

  React.useEffect(() => {
    const t = setInterval(() => setNow(nowWall(tz)), 1000);
    return () => clearInterval(t);
  }, [tz]);

  const hourKey = wallDateKey(now) + now.getUTCHours();
  const occurrences = React.useMemo(() => expandEntries(entries, new Date(now.getTime() - 24 * HOUR), new Date(now.getTime() + 48 * HOUR)), [entries, hourKey]);
  const active = activeOccurrence(occurrences, now);
  const segmentKey = active ? (active.entry.id || "") + ":" + active.start.getTime() : "fallback";
  const next = occurrences.find((o) => o.start > now && o !== active);

  React.useEffect(() => {
    if (!active) return;
    let cancelled = false;
    resolveTarget(active.entry, playlists)
      .then((r) => { if (!cancelled) setResolved({ key: segmentKey, ...r }); })
      .catch(() => { if (!cancelled) setResolved({ key: segmentKey, name: "Unavailable", items: [] }); });
    return () => { cancelled = true; };
  }, [segmentKey, playlists]);

  const fallback = playlists.find((p) => p.id === group?.defaultPlaylistId);
  const ctx = { playlists, planTypes, ministries, providers };
  const label = screen?.label || "this screen";
  const subtitle = `Following ${label}'s calendar` + (next ? ` · next: ${describeTarget(next.entry, ctx)} at ${formatWallTime(next.start)} ${formatWallDay(next.start)}` : "");

  if (!screen) {
    return <Player name="FreePlay" items={[]} segmentKey="none" message={screensQuery.isFetching ? "Loading…" : "That screen isn't paired to this church."} onExit={onExit} />;
  }

  if (active) {
    const ready = resolved?.key === segmentKey;
    return (
      <Player
        name={ready ? resolved.name : describeTarget(active.entry, ctx)}
        items={ready ? resolved.items : []}
        endBehavior={active.entry.endBehavior}
        fallbackName={fallback?.name}
        fallbackItems={fallback?.items || []}
        segmentKey={segmentKey + (ready ? ":ready" : "")}
        subtitle={subtitle}
        message={ready ? "Nothing to play for this schedule." : "Loading…"}
        onExit={onExit}
      />
    );
  }

  return (
    <Player
      name={fallback?.name || group?.name || "FreePlay"}
      items={fallback?.items || []}
      segmentKey="fallback"
      subtitle={subtitle}
      message={group ? "Nothing scheduled and no default loop." : "This screen isn't in a group."}
      onExit={onExit}
    />
  );
};
