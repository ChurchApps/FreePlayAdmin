import React from "react";
import { useDrag, useDrop } from "react-dnd";
import { Box, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { DragIndicator as DragIcon, Movie as VideoIcon } from "@mui/icons-material";
import { type ProviderInfo } from "@churchapps/content-providers";
import { TextAction } from "../components/ui";
import { DEFAULT_IMAGE_SECONDS, formatDuration, type PlaylistItem } from "../helpers";

const DND_TYPE = "playlistItem";

interface Props {
  item: PlaylistItem;
  index: number;
  provider?: ProviderInfo;
  onMove: (from: number, to: number) => void;
  onChange: (item: PlaylistItem) => void;
  onRemove: () => void;
}

const pathCaption = (item: PlaylistItem) => {
  const segments = (item.providerPath || "").split("/").filter(Boolean).map((s) => decodeURIComponent(s)).filter((s) => s.length > 2 && s !== item.id);
  return [...segments, item.title].filter(Boolean).join(" / ");
};

export const PlaylistItemRow: React.FC<Props> = ({ item, index, provider, onMove, onChange, onRemove }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const handleRef = React.useRef<HTMLSpanElement>(null);

  const [, drop] = useDrop<{ index: number }>({
    accept: DND_TYPE,
    hover: (dragged, monitor) => {
      if (!ref.current || dragged.index === index) return;
      const rect = ref.current.getBoundingClientRect();
      const middle = (rect.bottom - rect.top) / 2;
      const offset = (monitor.getClientOffset()?.y || 0) - rect.top;
      if (dragged.index < index && offset < middle) return;
      if (dragged.index > index && offset > middle) return;
      onMove(dragged.index, index);
      dragged.index = index;
    }
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: DND_TYPE,
    item: () => ({ index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() })
  });

  React.useEffect(() => {
    drag(handleRef.current);
    preview(drop(ref.current));
  });

  const isImage = item.mediaType === "image";

  return (
    <Stack ref={ref} direction="row" spacing={1.5} alignItems="center" sx={{ py: 1, opacity: isDragging ? 0.4 : 1, "& + &": { borderTop: 1, borderColor: "divider" } }} data-testid="playlist-item">
      <Box component="span" ref={handleRef} sx={{ cursor: "grab", color: "text.secondary", display: "flex" }} aria-label="Drag to reorder"><DragIcon /></Box>
      <Box sx={{ width: 80, height: 45, flexShrink: 0, borderRadius: "4px", overflow: "hidden", bgcolor: "var(--b1-wash)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {item.thumbnail ? <Box component="img" src={item.thumbnail} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : !isImage && <VideoIcon sx={{ color: "text.secondary" }} />}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }} noWrap>{item.title || "Untitled"}</Typography>
        <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
          {provider?.logos?.light && <Box component="img" src={provider.logos.light} alt="" sx={{ height: 14, maxWidth: 28, objectFit: "contain" }} />}
          <Typography variant="body2" color="text.secondary" noWrap>{[provider?.name || item.providerId, pathCaption(item)].filter(Boolean).join(" · ")}</Typography>
        </Stack>
      </Box>
      {isImage ? (
        <TextField
          size="small"
          margin="none"
          type="number"
          value={item.seconds ?? DEFAULT_IMAGE_SECONDS}
          onChange={(e) => onChange({ ...item, seconds: Math.max(1, Number(e.target.value) || 1) })}
          sx={{ width: 96, flexShrink: 0 }}
          slotProps={{ htmlInput: { min: 1, "aria-label": "Seconds", "data-testid": "item-seconds" }, input: { endAdornment: <InputAdornment position="end">s</InputAdornment> } }}
        />
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, whiteSpace: "nowrap" }}>{"Plays to end" + (item.seconds ? " · " + formatDuration(item.seconds) : "")}</Typography>
      )}
      <TextAction small onClick={onRemove}>Remove</TextAction>
    </Stack>
  );
};
