import React from "react";
import { Link as RouterLink, useSearchParams } from "react-router-dom";
import { Box, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { Add as AddIcon, ChevronLeft as PrevIcon, ChevronRight as NextIcon, Loop as LoopIcon } from "@mui/icons-material";
import { ApiHelper } from "@churchapps/apphelper";
import { CountChip, EmptyState, HeaderPrimaryButton, HeaderTextButton, PageContainer, PageHeader, PillTabs, Sheet, Surface, TextAction } from "../components/ui";
import { usePageTitle } from "../components/PageTitle";
import {
  TARGET_COLORS, describeTarget, expandEntries, formatWallDate, invalidate, keys, nowWall, useChurchTimeZone, useGroupEntries, useMinistries, usePlanTypes, usePlaylists, useScheduleEntries, useScreenGroups,
  type ScheduleEntry
} from "../helpers";
import { useProviders } from "../providers/useProviders";
import { ScheduleSheet } from "./ScheduleSheet";
import { WeekGrid, hatchSx } from "./WeekGrid";

const DAY_MS = 86400000;

const mondayOf = (d: Date) => {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  return start;
};

const Legend: React.FC<{ color?: string; hatch?: boolean; label: string }> = ({ color, hatch, label }) => (
  <Stack direction="row" spacing={0.75} alignItems="center">
    <Box sx={{ width: 14, height: 14, borderRadius: "3px", bgcolor: color, border: hatch ? 1 : 0, borderColor: "divider", ...(hatch ? hatchSx : {}) }} />
    <Typography variant="body2" color="text.secondary">{label}</Typography>
  </Stack>
);

export const CalendarPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tz = useChurchTimeZone();
  const groups = useScreenGroups().data || [];
  const allEntries = useScheduleEntries().data || [];
  const playlists = usePlaylists().data || [];
  const planTypes = usePlanTypes().data || [];
  const ministries = useMinistries().data || [];
  const { all: providers, browsable } = useProviders();

  const [groupId, setGroupId] = React.useState(searchParams.get("group") || "");
  const today = React.useMemo(() => nowWall(tz), [tz]);
  const [weekStart, setWeekStart] = React.useState(() => mondayOf(nowWall(tz)));
  const [sheetEntry, setSheetEntry] = React.useState<ScheduleEntry | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [sheetInitial, setSheetInitial] = React.useState<{ day: Date; minutes: number } | undefined>();
  const [loopOpen, setLoopOpen] = React.useState(false);
  const [loopValue, setLoopValue] = React.useState("");

  React.useEffect(() => { setWeekStart(mondayOf(nowWall(tz))); }, [tz]);

  React.useEffect(() => {
    if (!groups.length) return;
    if (!groupId || !groups.some((g) => g.id === groupId)) setGroupId(groups[0].id || "");
  }, [groups]);

  const group = groups.find((g) => g.id === groupId);
  usePageTitle(group?.name);
  const entries = useGroupEntries(groupId || undefined).data || [];
  const defaultLoop = playlists.find((p) => p.id === group?.defaultPlaylistId);
  const ctx = { playlists, planTypes, ministries, providers };

  const occurrences = React.useMemo(() => expandEntries(entries, weekStart, new Date(weekStart.getTime() + 7 * DAY_MS)), [entries, weekStart]);

  const openAdd = React.useCallback((initial?: { day: Date; minutes: number }) => {
    setSheetInitial(initial);
    setSheetEntry(null);
    setSheetOpen(true);
  }, []);

  React.useEffect(() => {
    if (searchParams.get("add") === "1") {
      openAdd();
      const next = new URLSearchParams(searchParams);
      next.delete("add");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams]);

  const overlaps = React.useMemo(() => {
    if (!sheetEntry?.id) return false;
    const mine = occurrences.filter((o) => o.entry.id === sheetEntry.id);
    return occurrences.some((o) => o.entry.id !== sheetEntry.id && mine.some((m) => m.start < o.end && o.start < m.end));
  }, [sheetEntry, occurrences]);

  const saveDefaultLoop = async () => {
    if (!group) return;
    await ApiHelper.post("/screenGroups", [{ ...group, defaultPlaylistId: loopValue }], "DoingApi");
    await invalidate(keys.screenGroups);
    setLoopOpen(false);
  };

  const weekEnd = new Date(weekStart.getTime() + 6 * DAY_MS);
  const counts = (id?: string) => allEntries.filter((e) => e.screenGroupId === id).length;

  return (
    <>
      <PageHeader title="Calendar" subtitle={"What plays when, per screen group · " + tz}>
        {group && (
          <HeaderTextButton startIcon={<LoopIcon />} onClick={() => { setLoopValue(group.defaultPlaylistId || ""); setLoopOpen(true); }} data-testid="default-loop-button">
            {defaultLoop ? "Default loop: " + defaultLoop.name : "Default loop…"}
          </HeaderTextButton>
        )}
        <HeaderPrimaryButton startIcon={<AddIcon />} onClick={() => openAdd()} disabled={!group} data-testid="add-schedule-button">Add schedule</HeaderPrimaryButton>
      </PageHeader>
      <PageContainer>
        {groups.length === 0 ? (
          <EmptyState title="No screen groups yet" description="Screens in a group share one calendar. Add a group, then schedule what it plays." action={<TextAction component={RouterLink} to="/screens?view=groups">Add a group</TextAction>} />
        ) : (
          <Stack spacing={3}>
            <PillTabs
              tabs
              value={groupId}
              onChange={setGroupId}
              aria-label="Screen groups"
              options={groups.map((g) => ({ value: g.id || "", label: <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>{g.name}<CountChip count={counts(g.id)} /></Box>, "data-testid": "group-tab-" + g.id }))}
            />
            <Surface disablePadding>
              <Stack direction="row" spacing={2} alignItems="center" useFlexGap flexWrap="wrap" sx={{ px: 3, py: 2, borderBottom: 1, borderColor: "divider" }}>
                <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
                  <Legend hatch label="Default loop" />
                  <Legend color={TARGET_COLORS.playlist} label="Playlist" />
                  <Legend color={TARGET_COLORS.planType} label="Service plan" />
                  <Legend color={TARGET_COLORS.providerFolder} label="Provider folder" />
                </Stack>
                <Box sx={{ flex: 1 }} />
                <IconButton size="small" aria-label="Previous week" onClick={() => setWeekStart(new Date(weekStart.getTime() - 7 * DAY_MS))}><PrevIcon /></IconButton>
                <Typography variant="body2" sx={{ fontWeight: 700 }} data-testid="week-label">
                  {weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })} – {formatWallDate(weekEnd)}
                </Typography>
                <IconButton size="small" aria-label="Next week" onClick={() => setWeekStart(new Date(weekStart.getTime() + 7 * DAY_MS))}><NextIcon /></IconButton>
                <TextAction small onClick={() => setWeekStart(mondayOf(nowWall(tz)))}>Today</TextAction>
              </Stack>
              <Box sx={{ p: { xs: 1, md: 2 } }}>
                <WeekGrid
                  weekStart={weekStart}
                  today={today}
                  occurrences={occurrences}
                  hasDefaultLoop={!!defaultLoop}
                  describe={(e) => describeTarget(e, ctx)}
                  onSelect={(e) => { setSheetEntry(e); setSheetOpen(true); }}
                  onEmptyClick={(day, minutes) => openAdd({ day, minutes })}
                />
              </Box>
            </Surface>
          </Stack>
        )}
      </PageContainer>
      {group && (
        <ScheduleSheet
          open={sheetOpen}
          entry={sheetEntry}
          initial={sheetInitial}
          screenGroupId={group.id || ""}
          today={today}
          playlists={playlists}
          planTypes={planTypes}
          ministries={ministries}
          providers={providers}
          browsable={browsable}
          overlaps={overlaps}
          onClose={() => setSheetOpen(false)}
        />
      )}
      <Sheet open={loopOpen} title={"Default loop · " + (group?.name || "")} onClose={() => setLoopOpen(false)} onSubmit={saveDefaultLoop} saveTestId="default-loop-save">
        <Typography variant="body2" color="text.secondary">Plays on this group's screens whenever nothing is scheduled.</Typography>
        <FormControl fullWidth margin="none">
          <InputLabel id="default-loop-select-label">Playlist</InputLabel>
          <Select labelId="default-loop-select-label" label="Playlist" value={loopValue} onChange={(e) => setLoopValue(e.target.value)} displayEmpty data-testid="default-loop-select">
            <MenuItem value="">None — screen goes dark</MenuItem>
            {playlists.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </Select>
        </FormControl>
      </Sheet>
    </>
  );
};
