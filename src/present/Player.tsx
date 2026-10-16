import React from "react";
import { Box, Typography } from "@mui/material";
import { DEFAULT_IMAGE_SECONDS, type EndBehavior, type PlaylistItem } from "../helpers";
import { refreshItemUrl } from "./resolve";

interface Props {
  name: string;
  items: PlaylistItem[];
  endBehavior?: EndBehavior;
  fallbackName?: string;
  fallbackItems?: PlaylistItem[];
  segmentKey: string;
  subtitle?: string;
  message?: string;
  onExit: () => void;
}

const TICK = 200;

const Kbd: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box component="kbd" sx={{ px: 0.75, py: 0.25, mx: 0.25, border: "1px solid rgba(255,255,255,.4)", borderRadius: "4px", fontFamily: "inherit", fontSize: 12 }}>{children}</Box>
);

export const Player: React.FC<Props> = ({ name, items, endBehavior = "loop", fallbackName, fallbackItems = [], segmentKey, subtitle, message, onExit }) => {
  const [index, setIndex] = React.useState(0);
  const [onFallback, setOnFallback] = React.useState(false);
  const [held, setHeld] = React.useState(false);
  const [paused, setPaused] = React.useState(false);
  const [elapsed, setElapsed] = React.useState(0);
  const [cycle, setCycle] = React.useState(0);
  const [videoDuration, setVideoDuration] = React.useState(0);
  const [hud, setHud] = React.useState(true);
  const [urls, setUrls] = React.useState<Record<string, string>>({});
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const hudTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const retried = React.useRef<Set<string>>(new Set());

  const list = onFallback ? fallbackItems : items;
  const listName = onFallback ? fallbackName || name : name;
  const item = list.length ? list[Math.min(index, list.length - 1)] : null;
  const isVideo = item?.mediaType === "video" || item?.mediaType === "audio";
  const imageMs = (item?.seconds || DEFAULT_IMAGE_SECONDS) * 1000;
  const timedVideo = isVideo && !!item?.loopVideo && !!item?.seconds;
  const durationMs = isVideo && !timedVideo ? videoDuration * 1000 : imageMs;
  const itemKey = item ? (item.providerId || "") + (item.id || "") + (item.url || "") : "";
  const src = item ? urls[itemKey] || item.url : "";

  React.useEffect(() => {
    setIndex(0);
    setOnFallback(false);
    setHeld(false);
    setElapsed(0);
  }, [segmentKey]);

  React.useEffect(() => {
    setElapsed(0);
    setVideoDuration(0);
  }, [index, onFallback, itemKey]);

  const advance = React.useCallback((manual = false) => {
    setHeld(false);
    setElapsed(0);
    if (index + 1 < list.length) { setIndex(index + 1); return; }
    if (manual || onFallback || endBehavior === "loop") {
      setIndex(0);
      setCycle((c) => c + 1);
      return;
    }
    if (endBehavior === "fallback" && fallbackItems.length) {
      setOnFallback(true);
      setIndex(0);
      return;
    }
    setHeld(true);
  }, [index, list.length, onFallback, endBehavior, fallbackItems.length]);

  const back = React.useCallback(() => {
    setHeld(false);
    setElapsed(0);
    setCycle((c) => c + 1);
    setIndex(index > 0 ? index - 1 : Math.max(list.length - 1, 0));
  }, [index, list.length]);

  React.useEffect(() => {
    if (!item || paused || held || (isVideo && !timedVideo)) return;
    const t = setInterval(() => setElapsed((e) => e + TICK), TICK);
    return () => clearInterval(t);
  }, [item, paused, held, isVideo, timedVideo]);

  React.useEffect(() => {
    if (!isVideo || timedVideo) {
      if (elapsed >= imageMs && !held) advance();
    }
  }, [elapsed]);

  React.useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (paused || held) v.pause();
    else v.play().catch(() => { v.muted = true; v.play().catch(() => {}); });
  }, [paused, held, src, cycle]);

  const showHud = React.useCallback(() => {
    setHud(true);
    if (hudTimer.current) clearTimeout(hudTimer.current);
    hudTimer.current = setTimeout(() => setHud(false), 3000);
  }, []);

  React.useEffect(() => {
    showHud();
    return () => { if (hudTimer.current) clearTimeout(hudTimer.current); };
  }, [showHud]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      showHud();
      if (e.key === "Escape") onExit();
      else if (e.key === " ") { e.preventDefault(); setPaused((p) => !p); } else if (e.key === "ArrowRight") advance(true);
      else if (e.key === "ArrowLeft") back();
      else if (e.key.toLowerCase() === "f") {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else document.documentElement.requestFullscreen().catch(() => {});
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back, onExit, showHud]);

  const handleMediaError = async () => {
    if (!item || retried.current.has(itemKey)) { advance(); return; }
    retried.current.add(itemKey);
    const fresh = await refreshItemUrl(item);
    if (fresh) setUrls((u) => ({ ...u, [itemKey]: fresh }));
    else advance();
  };

  const nextItem = list.length > 1 ? list[(index + 1) % list.length] : null;
  const progress = durationMs > 0 ? Math.min(100, (elapsed / durationMs) * 100) : 0;

  return (
    <Box onMouseMove={showHud} onClick={showHud} sx={{ position: "fixed", inset: 0, bgcolor: "common.black", color: "common.white", cursor: hud ? "default" : "none", overflow: "hidden" }} data-testid="presenter">
      {item && !isVideo && <Box component="img" key={src} src={src} alt="" onError={handleMediaError} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />}
      {item && isVideo && (
        <Box
          component="video"
          key={src + ":" + cycle}
          ref={videoRef}
          src={src}
          autoPlay
          playsInline
          loop={!!item.loopVideo}
          onEnded={() => { if (!item.loopVideo) advance(); }}
          onError={handleMediaError}
          onLoadedMetadata={(e: React.SyntheticEvent<HTMLVideoElement>) => setVideoDuration(e.currentTarget.duration || 0)}
          onTimeUpdate={(e: React.SyntheticEvent<HTMLVideoElement>) => { if (!timedVideo) setElapsed(e.currentTarget.currentTime * 1000); }}
          sx={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      )}
      {nextItem?.mediaType === "image" && nextItem.url && <Box component="img" src={nextItem.url} alt="" sx={{ display: "none" }} />}
      {!item && (
        <Box sx={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography sx={{ color: "rgba(255,255,255,.6)" }}>{message || "Nothing to play right now."}</Typography>
        </Box>
      )}
      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, px: 3, py: 2, display: "flex", alignItems: "center", gap: 2, background: "linear-gradient(transparent, rgba(0,0,0,.85))", opacity: hud ? 1 : 0, transition: "opacity 300ms", pointerEvents: hud ? "auto" : "none" }} data-testid="presenter-hud">
        <Box component="img" src="/images/logo-icon.png" alt="" sx={{ height: 28 }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600 }} noWrap>
            {item ? `${listName} · ${Math.min(index, list.length - 1) + 1} of ${list.length} — ${item.title || "Untitled"}` : listName}
            {paused && " · Paused"}
            {held && " · Holding last slide"}
          </Typography>
          {(subtitle || nextItem) && <Typography variant="body2" sx={{ color: "rgba(255,255,255,.7)" }} noWrap>{subtitle || "Next: " + (nextItem?.title || "")}</Typography>}
          <Box sx={{ mt: 1, height: 3, bgcolor: "rgba(255,255,255,.2)", borderRadius: 2, overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: progress + "%", bgcolor: "primary.main", transition: `width ${TICK}ms linear` }} />
          </Box>
        </Box>
        <Typography variant="body2" sx={{ color: "rgba(255,255,255,.75)", whiteSpace: "nowrap", display: { xs: "none", md: "block" } }}>
          <Kbd>Space</Kbd> pause &nbsp; <Kbd>←</Kbd><Kbd>→</Kbd> skip &nbsp; <Kbd>F</Kbd> fullscreen &nbsp; <Kbd>Esc</Kbd> exit
        </Typography>
      </Box>
    </Box>
  );
};
