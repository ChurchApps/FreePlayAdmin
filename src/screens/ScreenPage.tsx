import React from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { Alert, Box, Button, Menu, MenuItem, Snackbar, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import { Edit as EditIcon, ExpandMore as ExpandIcon, PlayArrow as PlayIcon, Tv as TvIcon } from "@mui/icons-material";
import { ConfirmDialog, PageContainer, Pill, RecordHeading, RecordLayout, StatusBadge, TextAction, tableScrollSx } from "../components/ui";
import { usePageTitle } from "../components/PageTitle";
import {
  activeOccurrence, churchTimeZone, describeTarget, expandEntries, formatBytes, formatLongDate, formatWallDay, formatWallTime, invalidate, isOnline, isScheduled, keys, missingCount, nowPlayingTitle, nowWall,
  parseDeviceInfo, relativeAgo, TARGET_KINDS, useGroupEntries, useMinistries, usePlanTypes, usePlaylists, useScreenGroups, useScreens, type Screen
} from "../helpers";
import { useProviders } from "../providers/useProviders";
import { ModeBadge } from "./components/ScreenTable";
import { ScreenEditSheet, screenGroupId } from "./components/ScreenEditSheet";
import { unpairScreen } from "./components/pairing";

const KeyValue: React.FC<{ k: string; children: React.ReactNode }> = ({ k, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary">{k}</Typography>
    <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{children}</Typography>
  </Box>
);

const statusLine = (screen: Screen) => {
  const missing = missingCount(screen);
  const seen = "last seen " + relativeAgo(screen.lastActiveDate).toLowerCase();
  if (!isOnline(screen)) return <StatusBadge tone="danger" variant="dot">{"Offline · " + seen}</StatusBadge>;
  if (missing > 0) return <StatusBadge tone="warning" variant="dot">{`${missing} file${missing === 1 ? "" : "s"} missing · ${seen}`}</StatusBadge>;
  return <StatusBadge tone="success" variant="dot">{"Online · " + seen}</StatusBadge>;
};

export const ScreenPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const screensQuery = useScreens();
  const screen = (screensQuery.data || []).find((s) => s.id === id);
  usePageTitle(screen?.label || "Screen");

  const groups = useScreenGroups().data || [];
  const playlists = usePlaylists().data || [];
  const planTypes = usePlanTypes().data || [];
  const ministries = useMinistries().data || [];
  const { all: providers } = useProviders();
  const groupId = screen ? screenGroupId(screen) : "";
  const group = groups.find((g) => g.id === groupId);
  const entries = useGroupEntries(isScheduled(screen || {}) ? groupId : undefined).data || [];

  const [editing, setEditing] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState<HTMLElement | null>(null);
  const [confirmUnpair, setConfirmUnpair] = React.useState(false);
  const [toast, setToast] = React.useState("");

  const tz = churchTimeZone();
  const ctx = { playlists, planTypes, ministries, providers };

  const timeline = React.useMemo(() => {
    const now = nowWall(tz);
    const occurrences = expandEntries(entries, now, new Date(now.getTime() + 7 * 86400000));
    return { now, active: activeOccurrence(occurrences, now), upcoming: occurrences.filter((o) => o.start > now).slice(0, 6) };
  }, [entries, tz]);

  if (!screen) {
    return (
      <PageContainer>
        <Typography color="text.secondary">{screensQuery.isFetching ? "Loading…" : "That screen isn't paired to this church."}</Typography>
        <TextAction component={RouterLink} to="/screens">← Back to Screens</TextAction>
      </PageContainer>
    );
  }

  const info = parseDeviceInfo(screen);
  const defaultLoop = playlists.find((p) => p.id === group?.defaultPlaylistId);
  const missingList = Array.isArray(screen.status?.missing) ? screen.status.missing : [];
  const recent = screen.status?.recent || [];
  const nowPlaying = screen.status?.nowPlaying;
  const nowThumb = typeof nowPlaying === "object" ? nowPlaying?.thumbnail : undefined;
  const status = screen.status;

  const handleUnpair = async () => {
    setConfirmUnpair(false);
    if (!screen.id) return;
    await unpairScreen(screen.id);
    await invalidate(keys.screens);
    navigate("/screens");
  };


  const nowLabel = timeline.active ? describeTarget(timeline.active.entry, ctx) : defaultLoop?.name || "Nothing (screen is dark)";
  const nowDetail = timeline.active
    ? `${TARGET_KINDS[timeline.active.entry.targetType || "playlist"]} · until ${formatWallTime(timeline.active.end)} ${formatWallDay(timeline.active.end)}`
    : defaultLoop ? "Default loop" + (timeline.upcoming[0] ? ` · looping until ${formatWallTime(timeline.upcoming[0].start)} ${formatWallDay(timeline.upcoming[0].start)}` : "") : "No default loop for this group";

  const identity = (
    <Stack spacing={1.5}>
      <Box sx={{ width: 88, height: 88, borderRadius: "var(--b1-radius-avatar)", bgcolor: "var(--b1-chip)", color: "var(--b1-on-chip)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <TvIcon sx={{ fontSize: 44 }} />
      </Box>
      <Box>
        <Typography variant="h1" sx={{ overflowWrap: "anywhere" }}>{screen.label || "Unnamed screen"}</Typography>
        <Typography variant="body2" color="text.secondary">{[info.model || info.platform, screen.status?.appVersion && "FreePlay " + screen.status.appVersion].filter(Boolean).join(" · ")}</Typography>
      </Box>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {group && <Pill tone="primary">{group.name}</Pill>}
        <Pill>{isScheduled(screen) ? "Scheduled" : "Manual"}</Pill>
      </Stack>
      <Box>{statusLine(screen)}</Box>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ pt: 1 }}>
        {isScheduled(screen) && <Button variant="contained" startIcon={<PlayIcon />} component={RouterLink} to={"/present/screen/" + screen.deviceId} data-testid="present-screen">Present in browser</Button>}
        <Button variant="outlined" startIcon={<EditIcon />} onClick={() => setEditing(true)} data-testid="edit-screen">Edit</Button>
        <Button variant="outlined" endIcon={<ExpandIcon />} onClick={(e) => setMenuAnchor(e.currentTarget)} data-testid="screen-more">More</Button>
      </Stack>
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { setMenuAnchor(null); setConfirmUnpair(true); }}>Unpair</MenuItem>
      </Menu>
      <Box sx={{ pt: 2, mt: 1, borderTop: 1, borderColor: "divider" }}>
        <KeyValue k="Paired">{formatLongDate(screen.registrationDate) || "—"}</KeyValue>
      </Box>
    </Stack>
  );

  return (
    <PageContainer>
      <Box sx={{ mb: 2, typography: "body2", color: "text.secondary" }}>
        <TextAction small component={RouterLink} to="/screens">Screens</TextAction> › {screen.label || "Unnamed screen"}
      </Box>
      <RecordLayout identity={identity}>
        {isScheduled(screen) ? (
          <Box component="section">
            <RecordHeading label="Now and next"><TextAction small component={RouterLink} to={"/calendar?group=" + groupId}>Open calendar</TextAction></RecordHeading>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <Box sx={{ width: 160, height: 90, borderRadius: "var(--b1-radius-control)", bgcolor: "var(--b1-wash)", flexShrink: 0, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }} data-testid="now-playing-thumb">
                {nowThumb ? <Box component="img" src={nowThumb} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <TvIcon sx={{ fontSize: 40, color: "text.secondary" }} />}
              </Box>
              <Box>
                <Typography sx={{ fontWeight: 600 }}>{nowPlayingTitle(screen) || nowLabel}</Typography>
                <Typography variant="body2" color="text.secondary">{nowDetail}</Typography>
              </Box>
            </Stack>
            {timeline.upcoming.length === 0
              ? <Typography variant="body2" color="text.secondary">Nothing else scheduled in the next 7 days.</Typography>
              : (
                <Stack spacing={1}>
                  {timeline.upcoming.map((o) => (
                    <Stack key={(o.entry.id || "") + o.start.getTime()} direction="row" spacing={2} alignItems="center">
                      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 110 }}>{formatWallDay(o.start)} {formatWallTime(o.start)}</Typography>
                      <Typography variant="body2" sx={{ flex: 1 }}>{describeTarget(o.entry, ctx)}</Typography>
                      <StatusBadge>{TARGET_KINDS[o.entry.targetType || "playlist"]}</StatusBadge>
                    </Stack>
                  ))}
                </Stack>
              )}
          </Box>
        ) : (
          <Box component="section">
            <RecordHeading label="Manual mode" />
            <Typography color="text.secondary">Someone picks content with the remote (classroom mode or Today's Plan). Switch to Scheduled under Edit to put this screen on a calendar.</Typography>
          </Box>
        )}
        {isScheduled(screen) && (
          <Box component="section">
            <RecordHeading label="Downloads">
              {missingCount(screen) > 0
                ? <StatusBadge tone="warning" variant="dot">{missingCount(screen)} file{missingCount(screen) === 1 ? "" : "s"} missing</StatusBadge>
                : screen.status?.readyThrough && <StatusBadge tone="success" variant="dot">{"Ready through " + formatLongDate(screen.status.readyThrough)}</StatusBadge>}
            </RecordHeading>
            {missingList.length > 0 ? (
              <Box sx={tableScrollSx}>
                <Table size="small">
                  <TableHead><TableRow><TableCell>File</TableCell><TableCell>Status</TableCell></TableRow></TableHead>
                  <TableBody>
                    {missingList.map((m, i) => (
                      <TableRow key={i}>
                        <TableCell>{m}</TableCell>
                        <TableCell><StatusBadge tone="danger">Missing</StatusBadge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                {screen.status ? (missingCount(screen) > 0 ? "The screen hasn't listed which files failed." : "Everything scheduled for the next week is downloaded.") : "This screen hasn't reported its downloads yet."}
              </Typography>
            )}
          </Box>
        )}
        <Box component="section">
          <RecordHeading label="Device" />
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <KeyValue k="Device ID"><code>{screen.deviceId}</code></KeyValue>
            <KeyValue k="Platform">{[info.platform, info.os].filter(Boolean).join(" ") || "—"}</KeyValue>
            <KeyValue k="Model">{info.model || "—"}</KeyValue>
            <KeyValue k="App version">{screen.status?.appVersion || "—"}</KeyValue>
            <KeyValue k="IP address">{screen.ipAddress || "—"}</KeyValue>
            <KeyValue k="Polls">{isScheduled(screen) ? "Every 5 min" + (screen.status?.manifestRev ? ` · manifest #${screen.status.manifestRev}` : "") : "Pairing check only"}</KeyValue>
            <KeyValue k="Storage">{status?.freeBytes === undefined ? "—" : [status.usedBytes !== undefined && formatBytes(status.usedBytes) + " used", formatBytes(status.freeBytes) + " free"].filter(Boolean).join(" · ")}</KeyValue>
            <KeyValue k="Last seen">{relativeAgo(screen.lastActiveDate)}</KeyValue>
            <KeyValue k="Mode"><ModeBadge screen={screen} /></KeyValue>
          </Box>
        </Box>
        {recent.length > 0 && (
          <Box component="section">
            <RecordHeading label="Recent" />
            <Stack spacing={0.5}>
              {recent.slice(0, 10).map((r, i) => (
                <Typography key={i} variant="body2" color="text.secondary">
                  {typeof r === "string" ? r : [r.date && new Date(r.date).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }), r.message].filter(Boolean).join(" — ")}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </RecordLayout>
      <ScreenEditSheet screen={editing ? screen : null} groups={groups} onClose={() => setEditing(false)} />
      <ConfirmDialog open={confirmUnpair} destructive title={`Unpair ${screen.label || "this screen"}?`} message="The TV goes back to its pairing code. Pair it again to bring it back." confirmLabel="Unpair" onConfirm={handleUnpair} onCancel={() => setConfirmUnpair(false)} />
      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast("")}>
        <Alert severity="info" onClose={() => setToast("")}>{toast}</Alert>
      </Snackbar>
    </PageContainer>
  );
};
