import React from "react";
import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { formWidthSx } from "../../components/ui";
import { invalidate, keys, type ScreenGroup } from "../../helpers";
import { GroupField, ModeField } from "./ScreenFields";
import { ensureGroup, NEW_GROUP, pairScreen, type ScreenMode } from "./pairing";

interface Props {
  groups: ScreenGroup[];
  initialCode?: string;
  onDone: () => void;
}

interface Values { code: string; label: string }

export const PairScreenForm: React.FC<Props> = ({ groups, initialCode, onDone }) => {
  const { register, handleSubmit, setError, setValue, formState: { errors, isSubmitting } } = useForm<Values>({ defaultValues: { code: (initialCode || "").toUpperCase().slice(0, 4), label: "" } });
  const [groupId, setGroupId] = React.useState(groups[0]?.id || NEW_GROUP);
  const [newGroupName, setNewGroupName] = React.useState("");
  const [mode, setMode] = React.useState<ScreenMode>("scheduled");
  const [formError, setFormError] = React.useState("");

  React.useEffect(() => {
    if (groupId === NEW_GROUP && groups.length && !newGroupName) setGroupId(groups[0].id || NEW_GROUP);
  }, [groups]);

  const onValid = async (values: Values) => {
    setFormError("");
    if (mode === "scheduled" && groupId === NEW_GROUP && !newGroupName.trim()) {
      setFormError("Name the new group.");
      return;
    }
    try {
      const gid = mode === "scheduled" ? await ensureGroup(groupId, newGroupName) : "";
      const ok = await pairScreen(values.code, mode, gid, values.label);
      if (!ok) {
        setError("code", { message: "That code didn't match a TV. Check the screen and try again." });
        return;
      }
      await invalidate(keys.screens, keys.screenGroups);
      onDone();
    } catch {
      setFormError("Couldn't pair that screen. Please try again.");
    }
  };

  const groupName = groupId === NEW_GROUP ? newGroupName : groups.find((g) => g.id === groupId)?.name;
  const codeField = register("code", {
    required: "Enter the code shown on the TV.",
    pattern: { value: /^[A-Z]{4}$/, message: "The code is four letters." }
  });

  return (
    <Box component="form" id="pairScreenForm" onSubmit={handleSubmit(onValid)} noValidate sx={formWidthSx} data-testid="pair-screen-form">
      <Typography variant="h2" sx={{ mb: 1 }}>Pair screen</Typography>
      {formError && <Alert severity="error" sx={{ mt: 1 }}>{formError}</Alert>}
      <TextField
        fullWidth
        autoFocus
        label="Pairing code"
        placeholder="XXXX"
        error={!!errors.code}
        helperText={errors.code?.message || "The four letters on the TV. Codes expire after 15 minutes."}
        {...codeField}
        onChange={(e) => {
          const v = e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
          setValue("code", v, { shouldValidate: !!errors.code });
        }}
        slotProps={{ htmlInput: { maxLength: 4, autoCapitalize: "characters", autoComplete: "off", style: { letterSpacing: "0.3em", fontWeight: 600 }, "data-testid": "pair-code" } }}
      />
      <TextField fullWidth label="Label" placeholder="Lobby left" {...register("label")} slotProps={{ htmlInput: { "data-testid": "pair-label" } }} />
      <GroupField groups={groups} value={groupId} onChange={setGroupId} newName={newGroupName} onNewNameChange={setNewGroupName} disabled={mode === "manual"} />
      <ModeField value={mode} onChange={setMode} groupName={groupName} />
      <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting} data-testid="pair-submit">{isSubmitting ? "Pairing…" : "Pair"}</Button>
        <Button variant="outlined" onClick={onDone} disabled={isSubmitting}>Cancel</Button>
      </Stack>
    </Box>
  );
};
