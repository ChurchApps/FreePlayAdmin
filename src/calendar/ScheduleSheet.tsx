import React from "react";
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormHelperText, FormLabel, InputLabel, ListSubheader, MenuItem, Radio, RadioGroup, Select, Stack, Switch, TextField,
  ToggleButton, ToggleButtonGroup, Typography
} from "@mui/material";
import { Warning as WarningIcon } from "@mui/icons-material";
import { ApiHelper } from "@churchapps/apphelper";
import { type GroupInterface } from "@churchapps/helpers";
import { type ProviderInfo } from "@churchapps/content-providers";
import { TextAction } from "../components/ui";
import {
  buildRule, folderLabel, formatWall, invalidateSchedule, parseRule, parseWall, planTypeLabel, wallDateKey, wallTimeKey,
  type EndBehavior, type PlanTypeInterface, type Playlist, type ScheduleEntry
} from "../helpers";
import { ProviderBrowseDialog } from "../providers/ProviderBrowser";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FOLDER = "providerFolder";

interface Props {
  open: boolean;
  entry: ScheduleEntry | null;
  initial?: { day: Date; minutes: number };
  screenGroupId: string;
  today: Date;
  playlists: Playlist[];
  planTypes: PlanTypeInterface[];
  ministries: GroupInterface[];
  providers: ProviderInfo[];
  browsable: ProviderInfo[];
  overlaps: boolean;
  onClose: () => void;
}

interface FormState {
  target: string;
  providerId: string;
  providerPath: string;
  days: number[];
  oneTime: boolean;
  date: string;
  startTime: string;
  endTime: string;
  endBehavior: EndBehavior;
  starts: string;
  endsOn: boolean;
  until: string;
}

const option = (title: string, detail?: string) => (
  <Box sx={{ py: 0.5 }}>
    <Typography sx={{ fontWeight: 600 }}>{title}</Typography>
    {detail && <Typography variant="body2" color="text.secondary">{detail}</Typography>}
  </Box>
);

const timeKey = (minutes: number) => {
  const m = ((minutes % 1440) + 1440) % 1440;
  return String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0");
};

const initialState = (entry: ScheduleEntry | null, today: Date, playlists: Playlist[], initial?: { day: Date; minutes: number }): FormState => {
  if (!entry?.id) {
    const day = initial?.day || today;
    const dayKey = wallDateKey(day);
    const startMinutes = initial ? initial.minutes : 9 * 60;
    return { target: playlists[0]?.id ? "playlist:" + playlists[0].id : "", providerId: "", providerPath: "", days: [day.getUTCDay()], oneTime: false, date: dayKey, startTime: timeKey(startMinutes), endTime: timeKey(startMinutes + 60), endBehavior: "loop", starts: dayKey, endsOn: false, until: "" };
  }
  const start = parseWall(entry.start) || today;
  const end = parseWall(entry.end) || start;
  const rule = parseRule(entry.recurrenceRule || undefined);
  const target = entry.targetType === FOLDER ? FOLDER : entry.targetType + ":" + (entry.targetId || "");
  return {
    target,
    providerId: entry.providerId || "",
    providerPath: entry.providerPath || "",
    days: rule?.days.length ? rule.days : [start.getUTCDay()],
    oneTime: !rule,
    date: wallDateKey(start),
    startTime: wallTimeKey(start),
    endTime: wallTimeKey(end),
    endBehavior: entry.endBehavior === "holdLast" ? "teacherPaced" : (entry.endBehavior || "loop"),
    starts: wallDateKey(start),
    endsOn: !!rule?.until,
    until: rule?.until || ""
  };
};

export const ScheduleSheet: React.FC<Props> = ({ open, entry, initial, screenGroupId, today, playlists, planTypes, ministries, providers, browsable, overlaps, onClose }) => {
  const [form, setForm] = React.useState<FormState>(() => initialState(entry, today, playlists, initial));
  const [browsing, setBrowsing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    setForm(initialState(entry, today, playlists, initial));
    setError("");
  }, [open, entry, initial]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const handleTarget = (value: string) => {
    if (value === FOLDER) {
      setBrowsing(true);
      return;
    }
    set("target", value);
  };

  const validate = () => {
    if (!form.target) return "Choose what to play.";
    if (form.target === FOLDER && !form.providerPath) return "Choose a provider folder.";
    if (!form.oneTime && form.days.length === 0) return "Pick at least one day, or switch to One time.";
    if (!form.startTime || !form.endTime) return "Enter a start and end time.";
    if (form.endTime === form.startTime) return "The end time must be after the start time.";
    if (!form.oneTime && form.endsOn && (!form.until || form.until < form.starts)) return "The end date must be after the start date.";
    return "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    const day = form.oneTime ? form.date : form.starts;
    const start = parseWall(`${day}T${form.startTime}:00`)!;
    const end = parseWall(`${day}T${form.endTime}:00`)!;
    if (end <= start) end.setUTCDate(end.getUTCDate() + 1);
    const [targetType, targetId] = form.target === FOLDER ? [FOLDER, null] : form.target.split(":");
    const record: ScheduleEntry = {
      ...(entry?.id ? entry : {}),
      screenGroupId,
      targetType: targetType as ScheduleEntry["targetType"],
      targetId: targetType === FOLDER ? null : targetId,
      providerId: targetType === FOLDER ? form.providerId : null,
      providerPath: targetType === FOLDER ? form.providerPath : null,
      start: formatWall(start),
      end: formatWall(end),
      recurrenceRule: form.oneTime ? null : buildRule(form.days, form.endsOn ? form.until : undefined),
      endBehavior: form.endBehavior,
      enabled: entry?.enabled ?? true
    };
    setSaving(true);
    setError("");
    try {
      await ApiHelper.post("/scheduleEntries", [record], "DoingApi");
      await invalidateSchedule();
      onClose();
    } catch {
      setError("Couldn't save this schedule. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry?.id) return;
    setSaving(true);
    try {
      await ApiHelper.delete("/scheduleEntries/" + entry.id, "DoingApi");
      await invalidateSchedule();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const folderChip = form.target === FOLDER && form.providerPath;

  return (
    <>
      <Dialog open={open} onClose={saving ? undefined : onClose} fullWidth maxWidth="sm" aria-labelledby="schedule-sheet-title">
        <form onSubmit={handleSave} noValidate data-testid="schedule-sheet">
          <DialogTitle id="schedule-sheet-title">{entry?.id ? "Edit schedule" : "Add schedule"}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}
              {overlaps && <Chip color="warning" variant="outlined" icon={<WarningIcon />} label="Overlaps another schedule. The one that starts later wins." sx={{ alignSelf: "flex-start" }} />}
              <FormControl fullWidth margin="none">
                <InputLabel id="schedule-play-label">Play</InputLabel>
                <Select labelId="schedule-play-label" label="Play" value={form.target} onChange={(e) => handleTarget(e.target.value)} data-testid="schedule-play" renderValue={(v) => (v === FOLDER ? folderLabel(providers, form.providerId, form.providerPath) : v.startsWith("planType:") ? planTypeLabel(planTypes.find((p) => "planType:" + p.id === v) || {}, ministries) + " (current plan)" : playlists.find((p) => "playlist:" + p.id === v)?.name || "")}>
                  <ListSubheader>Playlists</ListSubheader>
                  {playlists.length === 0 && <MenuItem disabled value="">No playlists yet</MenuItem>}
                  {playlists.map((p) => <MenuItem key={p.id} value={"playlist:" + p.id}>{p.name}</MenuItem>)}
                  {planTypes.length > 0 && <ListSubheader>Service plans</ListSubheader>}
                  {planTypes.map((pt) => <MenuItem key={pt.id} value={"planType:" + pt.id}>{planTypeLabel(pt, ministries) + " (current plan)"}</MenuItem>)}
                  <ListSubheader>Provider folder</ListSubheader>
                  <MenuItem value={FOLDER} onClick={() => { if (form.target === FOLDER) setBrowsing(true); }}>Provider folder…</MenuItem>
                </Select>
                <FormHelperText>Playlists · Service plans · Provider folder… A service plan pulls whatever is current in B1 Admin each week.</FormHelperText>
              </FormControl>
              {folderChip && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip label={folderLabel(providers, form.providerId, form.providerPath)} />
                  <TextAction small onClick={() => setBrowsing(true)}>Change</TextAction>
                </Stack>
              )}
              <Box>
                <FormLabel sx={{ display: "block", mb: 1, fontWeight: 500 }}>Repeats</FormLabel>
                <Stack direction="row" spacing={2} alignItems="center" useFlexGap flexWrap="wrap">
                  {!form.oneTime && (
                    <ToggleButtonGroup size="small" value={form.days} onChange={(_, v: number[]) => set("days", v)} aria-label="Days of the week" data-testid="schedule-days">
                      {DAY_LETTERS.map((l, i) => <ToggleButton key={i} value={i} aria-label={DAY_NAMES[i]} sx={{ width: 40 }} data-testid={"day-" + i}>{l}</ToggleButton>)}
                    </ToggleButtonGroup>
                  )}
                  <FormControlLabel control={<Switch checked={form.oneTime} onChange={(e) => set("oneTime", e.target.checked)} data-testid="schedule-one-time" />} label="One time" />
                </Stack>
              </Box>
              {form.oneTime && <TextField fullWidth margin="none" type="date" label="Date" value={form.date} onChange={(e) => set("date", e.target.value)} />}
              <Stack direction="row" spacing={2}>
                <TextField fullWidth margin="none" type="time" label="Start" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} slotProps={{ htmlInput: { step: 300, "data-testid": "schedule-start" } }} />
                <TextField fullWidth margin="none" type="time" label="End" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} slotProps={{ htmlInput: { step: 300, "data-testid": "schedule-end" } }} />
              </Stack>
              <FormControl margin="none">
                <FormLabel sx={{ fontWeight: 500 }}>If it finishes early</FormLabel>
                <RadioGroup value={form.endBehavior} onChange={(e) => set("endBehavior", e.target.value as EndBehavior)}>
                  <FormControlLabel value="loop" control={<Radio />} sx={{ alignItems: "flex-start", "& .MuiRadio-root": { pt: 1 } }} label={option("Loop until the end time", "Signage loops, announcements, countdowns")} />
                  <FormControlLabel value="teacherPaced" control={<Radio />} sx={{ alignItems: "flex-start", "& .MuiRadio-root": { pt: 1 } }} label={option("Teacher paced", "Slides wait for the teacher's remote. The lesson stays up past the end time until the last slide.")} />
                  <FormControlLabel value="fallback" control={<Radio />} sx={{ alignItems: "flex-start", "& .MuiRadio-root": { pt: 1 } }} label={option("Play once, then go back to the default loop")} />
                </RadioGroup>
              </FormControl>
              {!form.oneTime && (
                <Stack direction="row" spacing={2}>
                  <TextField fullWidth margin="none" type="date" label="Starts" value={form.starts} onChange={(e) => set("starts", e.target.value)} />
                  <FormControl fullWidth margin="none">
                    <InputLabel id="schedule-ends-label">Ends</InputLabel>
                    <Select labelId="schedule-ends-label" label="Ends" value={form.endsOn ? "on" : "never"} onChange={(e) => set("endsOn", e.target.value === "on")}>
                      <MenuItem value="never">Never</MenuItem>
                      <MenuItem value="on">On date</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              )}
              {!form.oneTime && form.endsOn && <TextField fullWidth margin="none" type="date" label="End date" value={form.until} onChange={(e) => set("until", e.target.value)} />}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            {entry?.id && <Box sx={{ mr: "auto" }}><TextAction onClick={handleDelete} disabled={saving} data-testid="schedule-delete">Delete</TextAction></Box>}
            <Button variant="outlined" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button variant="contained" type="submit" disabled={saving} data-testid="schedule-save">{saving ? "Saving…" : "Save"}</Button>
          </DialogActions>
        </form>
      </Dialog>
      <ProviderBrowseDialog
        open={browsing}
        providers={browsable}
        initialProviderId={form.providerId || undefined}
        title="Choose a provider folder"
        onClose={() => setBrowsing(false)}
        onSelectFolder={(providerId, path) => {
          setForm((f) => ({ ...f, target: FOLDER, providerId, providerPath: path }));
          setBrowsing(false);
        }}
      />
    </>
  );
};
