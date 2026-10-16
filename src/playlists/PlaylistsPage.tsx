import React from "react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router-dom";
import { Box, Button, Stack, Table, TableBody, TableCell, TableRow, TextField, Typography } from "@mui/material";
import { Add as AddIcon } from "@mui/icons-material";
import { ApiHelper } from "@churchapps/apphelper";
import { AddBar, EmptyState, HeaderPrimaryButton, PageContainer, PageHeader, SearchField, SortableTableHead, Surface, TextAction, VerbRow, formWidthSx, numericCellSx, tableScrollSx } from "../components/ui";
import { formatDuration, formatLongDate, invalidate, keys, playlistSeconds, usePlaylists, useScheduleEntries, useScreenGroups, type Playlist } from "../helpers";
import { duplicatePlaylist, usageLabel } from "./playlistUsage";

export const PlaylistsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const playlistsQuery = usePlaylists();
  const playlists = playlistsQuery.data || [];
  const entries = useScheduleEntries().data || [];
  const groups = useScreenGroups().data || [];
  const [search, setSearch] = React.useState("");
  const [adding, setAdding] = React.useState(false);
  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const openAdd = React.useCallback(() => {
    setAdding(true);
    setTimeout(() => document.getElementById("addPlaylistForm")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }, []);

  React.useEffect(() => {
    if (searchParams.get("add") === "1") {
      openAdd();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  const filtered = playlists.filter((p) => (p.name || "").toLowerCase().includes(search.trim().toLowerCase()));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const saved: Playlist[] = await ApiHelper.post("/playlists", [{ name: name.trim(), items: [] }], "DoingApi");
      await invalidate(keys.playlists);
      if (saved?.[0]?.id) navigate("/playlists/" + saved[0].id);
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async (p: Playlist) => {
    const copy = await duplicatePlaylist(p);
    await invalidate(keys.playlists);
    if (copy?.id) navigate("/playlists/" + copy.id);
  };

  return (
    <>
      <PageHeader title="Playlists" subtitle="Loops of images and videos from your providers">
        <HeaderPrimaryButton startIcon={<AddIcon />} onClick={openAdd} data-testid="add-playlist-button">Add playlist</HeaderPrimaryButton>
      </PageHeader>
      <PageContainer>
        <Surface>
          <Stack spacing={3}>
            <SearchField value={search} onChange={setSearch} placeholder="Search playlists" data-testid="playlists-search" />
            <Box role="region" aria-label="Playlists" tabIndex={0} sx={tableScrollSx}>
              <Table>
                <SortableTableHead columns={[{ key: "name", label: "Name" }, { key: "items", label: "Items", align: "right" }, { key: "duration", label: "Duration", align: "right" }, { key: "usedBy", label: "Used by" }, { key: "updated", label: "Updated" }, { key: "verbs", label: "" }]} />
                <TableBody>
                  {filtered.length === 0 && (
                    <TableRow>
                      <EmptyState variant="table" colSpan={6} title={playlists.length ? "No playlists match." : playlistsQuery.isFetching ? "Loading…" : "No playlists yet."} description={playlists.length ? undefined : "A playlist is a loop of images and videos. Add one, then pick files from a provider."} />
                    </TableRow>
                  )}
                  {filtered.map((p) => (
                    <TableRow key={p.id} data-testid="playlist-row">
                      <TableCell><TextAction small component={RouterLink} to={"/playlists/" + p.id}>{p.name || "Untitled"}</TextAction></TableCell>
                      <TableCell sx={numericCellSx}>{p.items?.length || 0}</TableCell>
                      <TableCell sx={numericCellSx}>{formatDuration(playlistSeconds(p.items))}</TableCell>
                      <TableCell>{usageLabel(p, entries, groups) || <Typography component="span" variant="body2" color="text.secondary">Not scheduled</Typography>}</TableCell>
                      <TableCell>{formatLongDate(p.updatedAt)}</TableCell>
                      <TableCell align="right">
                        <VerbRow sx={{ justifyContent: "flex-end" }}>
                          {(p.items?.length || 0) > 0 && <TextAction small component={RouterLink} to={"/present/playlist/" + p.id}>Present</TextAction>}
                          <TextAction small component={RouterLink} to={"/playlists/" + p.id}>Edit</TextAction>
                          <TextAction small onClick={() => handleDuplicate(p)}>Duplicate</TextAction>
                        </VerbRow>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
            {adding && (
              <AddBar title="Add playlist" sx={{ mt: 0 }}>
                <Box component="form" id="addPlaylistForm" onSubmit={handleCreate} noValidate sx={formWidthSx}>
                  <TextField fullWidth autoFocus margin="none" label="Name" placeholder="Welcome loop" value={name} onChange={(e) => setName(e.target.value)} slotProps={{ htmlInput: { "data-testid": "new-playlist-name" } }} />
                  <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                    <Button type="submit" variant="contained" disabled={saving || !name.trim()} data-testid="create-playlist">Add playlist</Button>
                    <Button variant="outlined" onClick={() => { setAdding(false); setName(""); }}>Cancel</Button>
                  </Stack>
                </Box>
              </AddBar>
            )}
          </Stack>
        </Surface>
      </PageContainer>
    </>
  );
};
