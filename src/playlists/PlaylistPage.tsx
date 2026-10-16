import React from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { Add as AddIcon, Edit as EditIcon, PlayArrow as PlayIcon } from "@mui/icons-material";
import { ApiHelper } from "@churchapps/apphelper";
import { type ContentFile } from "@churchapps/content-providers";
import { ConfirmDialog, PageContainer, Pill, PillTabs, RecordHeading, RecordLayout, Sheet, TextAction, VerbRow } from "../components/ui";
import { usePageTitle } from "../components/PageTitle";
import { CountChip } from "../components/ui";
import { DEFAULT_IMAGE_SECONDS, formatDuration, formatLongDate, invalidate, keys, playlistSeconds, useScheduleEntries, useScreenGroups, type Playlist, type PlaylistItem } from "../helpers";
import { BrowseGrid } from "../providers/BrowseGrid";
import { BrowseCrumbs, ProviderLabel } from "../providers/ProviderBrowser";
import { useBrowser, useProviders } from "../providers/useProviders";
import { PlaylistItemRow } from "./PlaylistItemRow";
import { duplicatePlaylist, playlistUsage } from "./playlistUsage";

const CONNECT = "__connect";

const toItem = (file: ContentFile, providerId: string, providerPath: string): PlaylistItem => ({
  id: file.id,
  providerId,
  providerPath,
  title: file.title,
  mediaType: file.mediaType,
  thumbnail: file.thumbnail,
  url: file.url,
  seconds: file.mediaType === "image" ? file.seconds || DEFAULT_IMAGE_SECONDS : file.seconds,
  loopVideo: file.loopVideo
});

export const PlaylistPage: React.FC = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const playlistQuery = useQuery<Playlist>({ queryKey: keys.playlist(id), enabled: !!id });
  const playlist = playlistQuery.data;
  const entries = useScheduleEntries().data || [];
  const groups = useScreenGroups().data || [];
  const { all: providers, browsable } = useProviders();
  const browser = useBrowser();
  const { selectProvider } = browser;

  const [name, setName] = React.useState("");
  const [items, setItems] = React.useState<PlaylistItem[]>([]);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [renaming, setRenaming] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  usePageTitle(name || playlist?.name || "Playlist");

  React.useEffect(() => {
    if (!playlist) return;
    setName(playlist.name || "");
    setItems(playlist.items || []);
    setDirty(false);
  }, [playlist]);

  React.useEffect(() => {
    if (!browser.providerId && browsable.length) selectProvider(browsable[0].id);
  }, [browsable]);

  const update = (next: PlaylistItem[]) => {
    setItems(next);
    setDirty(true);
  };

  const move = React.useCallback((from: number, to: number) => {
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDirty(true);
  }, []);

  const save = async (nextName = name) => {
    setSaving(true);
    setError("");
    try {
      await ApiHelper.post("/playlists", [{ ...playlist, id, name: nextName, items }], "DoingApi");
      setDirty(false);
      await invalidate(keys.playlist(id), keys.playlists);
    } catch {
      setError("Couldn't save the playlist. Please try again.");
      throw new Error("save");
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async () => {
    const next = renameValue.trim();
    if (!next) throw new Error("name");
    setName(next);
    await save(next);
    setRenaming(false);
  };

  const handleDelete = async () => {
    setConfirmDelete(false);
    await ApiHelper.delete("/playlists/" + id, "DoingApi");
    await invalidate(keys.playlists);
    navigate("/playlists");
  };

  const handleDuplicate = async () => {
    const copy = await duplicatePlaylist({ ...playlist, name, items });
    await invalidate(keys.playlists);
    if (copy?.id) navigate("/playlists/" + copy.id);
  };

  if (!playlist) {
    return (
      <PageContainer>
        {playlistQuery.isFetching ? <CircularProgress /> : <Typography color="text.secondary">That playlist doesn't exist.</Typography>}
      </PageContainer>
    );
  }

  const total = playlistSeconds(items);
  const usage = playlistUsage(playlist, entries, groups);
  const isAdded = (file: ContentFile) => items.some((i) => i.id === file.id && i.providerId === browser.providerId);
  const thumbs = items.filter((i) => i.thumbnail).slice(0, 3);
  const activeProvider = providers.find((p) => p.id === browser.providerId);

  const identity = (
    <Stack spacing={1.5}>
      <Box sx={{ position: "relative", width: 160, height: 90 + 12 }} aria-hidden>
        {[2, 1, 0].map((layer) => (
          <Box key={layer} sx={{ position: "absolute", left: layer * 8, top: (2 - layer) * 6, width: 144, height: 81, borderRadius: "6px", border: 1, borderColor: "divider", overflow: "hidden", bgcolor: layer === 0 ? "var(--b1-chip)" : "var(--b1-wash)" }}>
            {thumbs[layer] && <Box component="img" src={thumbs[layer].thumbnail} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </Box>
        ))}
      </Box>
      <Box>
        <Typography variant="h1" sx={{ overflowWrap: "anywhere" }} data-testid="playlist-name">{name || "Untitled"}</Typography>
        <Typography variant="body2" color="text.secondary">{`${items.length} item${items.length === 1 ? "" : "s"} · ${formatDuration(total)} · images ${DEFAULT_IMAGE_SECONDS} s default`}</Typography>
      </Box>
      {usage.loops.length > 0 && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {usage.loops.map((g) => <Pill key={g.id} tone="primary">{"Default loop · " + g.name}</Pill>)}
        </Stack>
      )}
      <Typography variant="body2" color="text.secondary">
        {[usage.schedules ? `Used by ${usage.schedules} schedule${usage.schedules === 1 ? "" : "s"}` : "Not on a schedule yet", playlist.updatedAt && "last saved " + formatLongDate(playlist.updatedAt)].filter(Boolean).join(" · ")}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 1 }}>
        <Button variant="contained" startIcon={<PlayIcon />} component={RouterLink} to={"/present/playlist/" + id} disabled={!items.length} data-testid="present-playlist">Present</Button>
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { setRenameValue(name); setRenaming(true); }} data-testid="rename-playlist">Rename</Button>
      </Stack>
      <VerbRow sx={{ pt: 1 }}>
        <TextAction small onClick={handleDuplicate}>Duplicate</TextAction>
        <TextAction small onClick={() => setConfirmDelete(true)} data-testid="delete-playlist">Delete</TextAction>
      </VerbRow>
    </Stack>
  );

  const providerOptions = [
    ...browsable.map((p) => ({ value: p.id, label: <ProviderLabel provider={p} />, "data-testid": "provider-tab-" + p.id })),
    { value: CONNECT, label: <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}><AddIcon sx={{ fontSize: 18 }} />Connect another</Box>, "data-testid": "connect-another" }
  ];

  return (
    <PageContainer>
      <Box sx={{ mb: 2, typography: "body2", color: "text.secondary" }}>
        <TextAction small component={RouterLink} to="/playlists">Playlists</TextAction> › {name || "Untitled"}
      </Box>
      <RecordLayout identity={identity}>
        <Box component="section">
          <RecordHeading label="Items">
            <CountChip count={items.length} />
            <Typography variant="body2" color="text.secondary" sx={{ ml: "auto !important" }}>{formatDuration(total)} total</Typography>
          </RecordHeading>
          {items.length === 0
            ? <Typography color="text.secondary">No items yet. Pick files from a provider below.</Typography>
            : (
              <Box data-testid="playlist-items">
                {items.map((item, i) => (
                  <PlaylistItemRow
                    key={(item.providerId || "") + (item.id || "") + i}
                    item={item}
                    index={i}
                    provider={providers.find((p) => p.id === item.providerId)}
                    onMove={move}
                    onChange={(changed) => update(items.map((x, j) => (j === i ? changed : x)))}
                    onRemove={() => update(items.filter((_, j) => j !== i))}
                  />
                ))}
              </Box>
            )}
        </Box>
        <Box component="section">
          <RecordHeading label="Add from provider" />
          <Stack spacing={2}>
            <PillTabs value={browser.providerId} onChange={(v) => (v === CONNECT ? navigate("/providers") : selectProvider(v))} options={providerOptions} data-testid="provider-tabs" />
            {activeProvider && <BrowseCrumbs providerName={activeProvider.name} crumbs={browser.crumbs} onGo={browser.goTo} />}
            {browser.loading
              ? <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
              : activeProvider && (browser.folders.length + browser.files.length === 0
                ? <Typography color="text.secondary">Nothing in this folder.</Typography>
                : (
                  <BrowseGrid
                    folders={browser.folders}
                    files={browser.files}
                    selectedProviderId={browser.providerId}
                    isLeafFolder={(f) => !!f.isLeaf}
                    onFolderClick={browser.openFolder}
                    onFileClick={(file) => update([...items, toItem(file, browser.providerId, browser.currentPath)])}
                    isFileSelected={isAdded}
                  />
                ))}
            <Typography variant="body2" color="text.secondary">Click a file to add it. Images default to {DEFAULT_IMAGE_SECONDS} seconds; videos play to the end.</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
              <Button variant="contained" disabled={saving || !dirty} onClick={() => save().catch(() => {})} data-testid="save-playlist">{saving ? "Saving…" : "Save"}</Button>
              <Button variant="outlined" disabled={saving} onClick={() => navigate("/playlists")}>Cancel</Button>
            </Stack>
          </Stack>
        </Box>
      </RecordLayout>
      <Sheet open={renaming} title="Rename playlist" onClose={() => setRenaming(false)} onSubmit={handleRename} saveTestId="rename-save">
        <TextField fullWidth autoFocus margin="none" label="Name" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} slotProps={{ htmlInput: { "data-testid": "rename-input" } }} />
      </Sheet>
      <ConfirmDialog open={confirmDelete} destructive title={`Delete ${name || "this playlist"}?`} message="Schedules that play it will fall back to the default loop." confirmLabel="Delete" onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
    </PageContainer>
  );
};
