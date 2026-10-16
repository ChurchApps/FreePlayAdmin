import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Stack, Table, TableBody, TableCell, TableRow, Typography } from "@mui/material";
import { Tv as TvIcon } from "@mui/icons-material";
import { SortableTableHead, StatusBadge, TextAction, VerbRow, tableScrollSx } from "../../components/ui";
import { deviceCaption, formatShortDate, isOnline, isScheduled, missingCount, nowPlayingTitle, relativeAgo, type Screen } from "../../helpers";

interface Props {
  screens: Screen[];
  groupName: (screen: Screen) => string;
  onEdit: (screen: Screen) => void;
  view: "table" | "grid";
}

const ScreenLabel: React.FC<{ screen: Screen }> = ({ screen }) => (screen.label ? <>{screen.label}</> : <Box component="span" sx={{ fontStyle: "italic", color: "text.secondary" }}>Unnamed screen</Box>);

export const ModeBadge: React.FC<{ screen: Screen }> = ({ screen }) => (isScheduled(screen) ? <StatusBadge tone="info">Scheduled</StatusBadge> : <StatusBadge>Manual</StatusBadge>);

export const ReadyBadge: React.FC<{ screen: Screen }> = ({ screen }) => {
  if (!isScheduled(screen)) return <Typography component="span" variant="body2" color="text.secondary">n/a</Typography>;
  const missing = missingCount(screen);
  if (missing > 0) return <StatusBadge tone="warning" variant="dot">{missing} file{missing === 1 ? "" : "s"} missing</StatusBadge>;
  if (screen.status?.readyThrough) return <StatusBadge tone="success" variant="dot">{formatShortDate(screen.status.readyThrough)}</StatusBadge>;
  return <Typography component="span" variant="body2" color="text.secondary">Waiting for first sync</Typography>;
};

export const LastSeen: React.FC<{ screen: Screen }> = ({ screen }) => {
  if (!screen.lastActiveDate) return <StatusBadge tone="danger" variant="dot">Never seen</StatusBadge>;
  if (!isOnline(screen)) return <StatusBadge tone="danger" variant="dot">{"Offline " + relativeAgo(screen.lastActiveDate).replace(" ago", "")}</StatusBadge>;
  return <>{relativeAgo(screen.lastActiveDate)}</>;
};

const NowPlaying: React.FC<{ screen: Screen }> = ({ screen }) => {
  if (!isScheduled(screen)) return <Typography component="span" variant="body2" color="text.secondary">Classroom · teacher presses Start</Typography>;
  return <>{nowPlayingTitle(screen) || "—"}</>;
};

const Verbs: React.FC<{ screen: Screen; onEdit: () => void }> = ({ screen, onEdit }) => (
  <VerbRow sx={{ justifyContent: "flex-end" }}>
    {isScheduled(screen) && screen.deviceId && <TextAction small component={RouterLink} to={"/present/screen/" + screen.deviceId}>Present</TextAction>}
    <TextAction small onClick={onEdit}>Edit</TextAction>
  </VerbRow>
);

export const ScreenTable: React.FC<Props> = ({ screens, groupName, onEdit, view }) => {
  if (view === "grid") {
    return (
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 2 }}>
        {screens.map((s) => (
          <Stack key={s.id} spacing={1} sx={{ p: 2, border: 1, borderColor: "divider", borderRadius: "var(--b1-radius-panel)" }} data-testid="screen-card">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 40, height: 40, borderRadius: "var(--b1-radius-avatar)", bgcolor: "var(--b1-chip)", color: "var(--b1-on-chip)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><TvIcon /></Box>
              <Box sx={{ minWidth: 0 }}>
                <TextAction component={RouterLink} to={"/screens/" + s.id}><ScreenLabel screen={s} /></TextAction>
                <Typography variant="body2" color="text.secondary" noWrap>{groupName(s)}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap"><ModeBadge screen={s} /><ReadyBadge screen={s} /></Stack>
            <Typography variant="body2"><NowPlaying screen={s} /></Typography>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box sx={{ typography: "body2", color: "text.secondary" }}><LastSeen screen={s} /></Box>
              <Verbs screen={s} onEdit={() => onEdit(s)} />
            </Stack>
          </Stack>
        ))}
      </Box>
    );
  }

  return (
    <Box role="region" aria-label="Screens" tabIndex={0} sx={tableScrollSx}>
      <Table>
        <SortableTableHead columns={[{ key: "label", label: "Label" }, { key: "group", label: "Group" }, { key: "mode", label: "Mode" }, { key: "now", label: "Now playing" }, { key: "ready", label: "Ready through" }, { key: "seen", label: "Last seen" }, { key: "verbs", label: "" }]} />
        <TableBody>
          {screens.map((s) => (
            <TableRow key={s.id} data-testid="screen-row">
              <TableCell>
                <TextAction small component={RouterLink} to={"/screens/" + s.id}><ScreenLabel screen={s} /></TextAction>
                {deviceCaption(s) && <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{deviceCaption(s)}</Typography>}
              </TableCell>
              <TableCell>{groupName(s)}</TableCell>
              <TableCell><ModeBadge screen={s} /></TableCell>
              <TableCell><NowPlaying screen={s} /></TableCell>
              <TableCell><ReadyBadge screen={s} /></TableCell>
              <TableCell sx={{ whiteSpace: "nowrap" }}><LastSeen screen={s} /></TableCell>
              <TableCell align="right"><Verbs screen={s} onEdit={() => onEdit(s)} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};
