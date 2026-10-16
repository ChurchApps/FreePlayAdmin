import React from "react";
import { Box, FormControl, FormControlLabel, FormHelperText, FormLabel, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField, Typography } from "@mui/material";
import { type ScreenGroup } from "../../helpers";
import { NEW_GROUP, type ScreenMode } from "./pairing";

interface GroupProps {
  groups: ScreenGroup[];
  value: string;
  onChange: (value: string) => void;
  newName: string;
  onNewNameChange: (value: string) => void;
  disabled?: boolean;
}

export const GroupField: React.FC<GroupProps> = ({ groups, value, onChange, newName, onNewNameChange, disabled }) => (
  <>
    <FormControl fullWidth disabled={disabled}>
      <InputLabel id="screen-group-label">Group</InputLabel>
      <Select labelId="screen-group-label" label="Group" value={value} onChange={(e) => onChange(e.target.value)} data-testid="screen-group-select">
        {groups.map((g) => <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>)}
        <MenuItem value={NEW_GROUP}>＋ New group…</MenuItem>
      </Select>
      <FormHelperText>Screens in a group share one calendar. Choose "New group…" to add one.</FormHelperText>
    </FormControl>
    {value === NEW_GROUP && !disabled && (
      <TextField fullWidth autoFocus label="New group name" placeholder="Lobby" value={newName} onChange={(e) => onNewNameChange(e.target.value)} data-testid="new-group-name" />
    )}
  </>
);

interface ModeProps {
  value: ScreenMode;
  onChange: (value: ScreenMode) => void;
  groupName?: string;
}

const option = (title: string, detail: string) => (
  <Box sx={{ py: 0.5 }}>
    <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
    <Typography variant="body2" color="text.secondary">{detail}</Typography>
  </Box>
);

export const ModeField: React.FC<ModeProps> = ({ value, onChange, groupName }) => (
  <FormControl fullWidth>
    <FormLabel sx={{ mb: 0.5, fontWeight: 500 }}>Mode</FormLabel>
    <RadioGroup value={value} onChange={(e) => onChange(e.target.value as ScreenMode)}>
      <FormControlLabel value="scheduled" control={<Radio />} sx={{ alignItems: "flex-start", "& .MuiRadio-root": { pt: 1 } }} label={option("Scheduled", `Plays by the ${groupName || "group"} calendar on its own. Nobody has to press Start.`)} />
      <FormControlLabel value="manual" control={<Radio />} sx={{ alignItems: "flex-start", "& .MuiRadio-root": { pt: 1 } }} label={option("Manual", "Someone picks content with the remote (classroom mode or Today's Plan).")} />
    </RadioGroup>
  </FormControl>
);
