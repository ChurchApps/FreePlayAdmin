import React from "react";
import { TextField } from "@mui/material";
import { Sheet } from "../../components/ui";
import { invalidate, isScheduled, keys, type Screen, type ScreenGroup } from "../../helpers";
import { GroupField, ModeField } from "./ScreenFields";
import { ensureGroup, NEW_GROUP, saveScreen, type ScreenMode } from "./pairing";

interface Props {
  screen: Screen | null;
  groups: ScreenGroup[];
  onClose: () => void;
}

export const screenGroupId = (screen: Screen) => screen.screenGroupId || (isScheduled(screen) ? screen.contentId : "") || "";

export const ScreenEditSheet: React.FC<Props> = ({ screen, groups, onClose }) => {
  const [label, setLabel] = React.useState("");
  const [groupId, setGroupId] = React.useState("");
  const [newGroupName, setNewGroupName] = React.useState("");
  const [mode, setMode] = React.useState<ScreenMode>("scheduled");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!screen) return;
    setLabel(screen.label || "");
    setGroupId(screenGroupId(screen) || groups[0]?.id || NEW_GROUP);
    setNewGroupName("");
    setMode(isScheduled(screen) ? "scheduled" : "manual");
    setError("");
  }, [screen]);

  const handleSubmit = async () => {
    if (!screen?.id) return;
    if (mode === "scheduled" && groupId === NEW_GROUP && !newGroupName.trim()) {
      setError("Name the new group.");
      throw new Error("validation");
    }
    const gid = mode === "scheduled" ? await ensureGroup(groupId, newGroupName) : "";
    await saveScreen(screen.id, { label, mode, groupId: gid });
    await invalidate(keys.screens, keys.screenGroups);
    onClose();
  };

  const groupName = groupId === NEW_GROUP ? newGroupName : groups.find((g) => g.id === groupId)?.name;

  return (
    <Sheet open={!!screen} title="Edit screen" onClose={onClose} onSubmit={handleSubmit} error={error} maxWidth="sm" data-testid="screen-edit-sheet">
      <TextField fullWidth margin="none" label="Label" placeholder="Lobby left" value={label} onChange={(e) => setLabel(e.target.value)} />
      <GroupField groups={groups} value={groupId} onChange={setGroupId} newName={newGroupName} onNewNameChange={setNewGroupName} disabled={mode === "manual"} />
      <ModeField value={mode} onChange={setMode} groupName={groupName} />
    </Sheet>
  );
};
