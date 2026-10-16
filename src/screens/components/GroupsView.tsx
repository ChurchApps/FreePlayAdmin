import React from "react";
import { Box, Button, FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableRow, TextField, Typography } from "@mui/material";
import { ApiHelper } from "@churchapps/apphelper";
import { AddBar, ConfirmDialog, EmptyState, SortableTableHead, TextAction, formWidthSx, tableScrollSx } from "../../components/ui";
import { invalidate, keys, type Playlist, type Screen, type ScreenGroup } from "../../helpers";
import { screenGroupId } from "./ScreenEditSheet";

interface Props {
  groups: ScreenGroup[];
  screens: Screen[];
  playlists: Playlist[];
  editing: ScreenGroup | null;
  onEdit: (group: ScreenGroup) => void;
  onDone: () => void;
}

const GroupForm: React.FC<{ group: ScreenGroup; playlists: Playlist[]; onDone: () => void }> = ({ group, playlists, onDone }) => {
  const [name, setName] = React.useState(group.name || "");
  const [defaultPlaylistId, setDefaultPlaylistId] = React.useState(group.defaultPlaylistId || "");
  const [saving, setSaving] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await ApiHelper.post("/screenGroups", [{ ...group, name: name.trim(), defaultPlaylistId }], "DoingApi");
      await invalidate(keys.screenGroups);
      onDone();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setConfirming(false);
    if (!group.id) return;
    await ApiHelper.delete("/screenGroups/" + group.id, "DoingApi");
    await invalidate(keys.screenGroups, keys.screens);
    onDone();
  };

  return (
    <Box component="form" onSubmit={save} noValidate sx={formWidthSx} data-testid="group-form">
      <TextField fullWidth autoFocus label="Name" placeholder="Lobby" value={name} onChange={(e) => setName(e.target.value)} data-testid="group-name" />
      <FormControl fullWidth>
        <InputLabel id="default-loop-label">Default loop</InputLabel>
        <Select labelId="default-loop-label" label="Default loop" value={defaultPlaylistId} onChange={(e) => setDefaultPlaylistId(e.target.value)} displayEmpty>
          <MenuItem value="">None — screen goes dark</MenuItem>
          {playlists.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </Select>
        <FormHelperText>Plays whenever nothing is scheduled.</FormHelperText>
      </FormControl>
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
        {group.id && <TextAction onClick={() => setConfirming(true)}>Delete</TextAction>}
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" onClick={onDone} disabled={saving}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving || !name.trim()}>Save</Button>
      </Stack>
      <ConfirmDialog open={confirming} destructive title={`Delete ${group.name}?`} message="Its schedule is deleted too. Screens in this group go dark until you move them to another group." confirmLabel="Delete" onConfirm={remove} onCancel={() => setConfirming(false)} />
    </Box>
  );
};

export const GroupsView: React.FC<Props> = ({ groups, screens, playlists, editing, onEdit, onDone }) => (
  <>
    <Box role="region" aria-label="Screen groups" tabIndex={0} sx={tableScrollSx}>
      <Table>
        <SortableTableHead columns={[{ key: "name", label: "Name" }, { key: "screens", label: "Screens" }, { key: "loop", label: "Default loop" }, { key: "verbs", label: "" }]} />
        <TableBody>
          {groups.length === 0 && <TableRow><EmptyState variant="table" colSpan={4} title="No groups yet." description="Groups share one calendar. Add one here or while pairing a screen." /></TableRow>}
          {groups.map((g) => (
            <TableRow key={g.id} data-testid="group-row">
              <TableCell sx={{ fontWeight: 600 }}>{g.name}</TableCell>
              <TableCell>{screens.filter((s) => screenGroupId(s) === g.id).length}</TableCell>
              <TableCell>{playlists.find((p) => p.id === g.defaultPlaylistId)?.name || <Typography component="span" variant="body2" color="text.secondary">None — screen goes dark</Typography>}</TableCell>
              <TableCell align="right"><TextAction small onClick={() => onEdit(g)} data-testid={"edit-group-" + g.id}>Edit</TextAction></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
    {editing && (
      <Box id="groupForm">
        <AddBar title={editing.id ? "Edit group" : "Add group"}>
          <GroupForm key={editing.id || "new"} group={editing} playlists={playlists} onDone={onDone} />
        </AddBar>
      </Box>
    )}
  </>
);
