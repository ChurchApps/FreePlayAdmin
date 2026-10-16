import React from "react";
import { useSearchParams } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Add as AddIcon, GridView as GridIcon, TableRowsOutlined as TableIcon } from "@mui/icons-material";
import { UserHelper } from "@churchapps/apphelper";
import { AddBar, CountChip, EmptyState, FilterChip, HeaderPrimaryButton, HeaderTextButton, PageContainer, PageHeader, ResultsBar, SearchField, Surface, ViewToggle } from "../components/ui";
import { usePageTitle } from "../components/PageTitle";
import { isOnline, isReadyForSunday, isScheduled, needsAttention, nowPlayingTitle, usePlaylists, useScheduleEntries, useScreenGroups, useScreens, type Screen } from "../helpers";
import { useProviders } from "../providers/useProviders";
import { GetStarted, type GetStartedStep } from "./components/GetStarted";
import { GroupsView } from "./components/GroupsView";
import { PairScreenForm } from "./components/PairScreenForm";
import { ScreenEditSheet, screenGroupId } from "./components/ScreenEditSheet";
import { ScreenTable } from "./components/ScreenTable";

type Filter = "all" | "scheduled" | "manual" | "attention" | string;

const VIEW_KEY = "freeplay.screens.view";

export const ScreensPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const groupsView = searchParams.get("view") === "groups";
  usePageTitle(groupsView ? "Groups" : "");

  const screens = useScreens().data || [];
  const groups = useScreenGroups().data || [];
  const playlists = usePlaylists().data || [];
  const entries = useScheduleEntries().data || [];
  const { linked, all: allProviders } = useProviders();

  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [pairing, setPairing] = React.useState(searchParams.get("pair") === "1");
  const [editing, setEditing] = React.useState<Screen | null>(null);
  const [view, setView] = React.useState<"table" | "grid">(() => {
    try { return localStorage.getItem(VIEW_KEY) === "grid" ? "grid" : "table"; } catch { return "table"; }
  });

  const openPair = React.useCallback(() => {
    setPairing(true);
    setTimeout(() => document.getElementById("pairScreenForm")?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }, []);

  React.useEffect(() => {
    if (searchParams.get("pair") === "1") {
      openPair();
      const next = new URLSearchParams(searchParams);
      next.delete("pair");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams]);

  const changeView = (next: "table" | "grid") => {
    setView(next);
    try { localStorage.setItem(VIEW_KEY, next); } catch { /* storage unavailable */ }
  };

  const groupName = React.useCallback((s: Screen) => s.screenGroupName || groups.find((g) => g.id === screenGroupId(s))?.name || "—", [groups]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return screens.filter((s) => {
      if (q && !((s.label || "") + " " + groupName(s) + " " + nowPlayingTitle(s)).toLowerCase().includes(q)) return false;
      if (filter === "scheduled") return isScheduled(s);
      if (filter === "manual") return !isScheduled(s);
      if (filter === "attention") return needsAttention(s);
      if (filter !== "all") return screenGroupId(s) === filter;
      return true;
    });
  }, [screens, search, filter, groupName]);

  const scheduled = screens.filter(isScheduled);
  const churchName = UserHelper.currentUserChurch?.church?.name;
  const groupCount = groups.length;
  const subtitle = [`${screens.length} screen${screens.length === 1 ? "" : "s"} in ${groupCount} group${groupCount === 1 ? "" : "s"}`, churchName].filter(Boolean).join(" · ");

  const linkedNames = linked.map((l) => allProviders.find((p) => p.id === l.providerId)?.name || l.providerId).filter(Boolean);
  const groupWithoutLoop = groups.find((g) => !g.defaultPlaylistId);
  const steps: GetStartedStep[] = [
    { title: "Connect a provider", done: linked.length > 0, detail: linked.length ? `${linkedNames.join(" and ")} ${linkedNames.length === 1 ? "is" : "are"} connected` : "Dropbox, Google Drive, Lessons.church and more", verb: { label: "Open providers", to: "/providers" } },
    { title: "Build a playlist", done: playlists.length > 0, detail: playlists.length ? `${playlists.length} playlist${playlists.length === 1 ? "" : "s"}` : "Pick images and videos from a provider", verb: { label: "Add playlist", to: "/playlists?add=1" } },
    { title: "Put it on the calendar", done: entries.length > 0 || (groups.length > 0 && !groupWithoutLoop), detail: groupWithoutLoop ? `${groupWithoutLoop.name} has no default loop yet` : "Choose what plays when", verb: { label: "Open calendar", to: "/calendar" } },
    { title: "Pair a screen", done: screens.length > 0, detail: "Enter the code shown on the TV", verb: { label: "Pair screen", onClick: openPair } }
  ];

  const setGroupsView = (on: boolean) => setSearchParams(on ? { view: "groups" } : {}, { replace: false });

  const filterOptions: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "scheduled", label: "Scheduled" },
    { value: "manual", label: "Manual" },
    { value: "attention", label: "Needs attention" },
    ...groups.map((g) => ({ value: g.id || "", label: g.name || "" }))
  ];

  return (
    <>
      <PageHeader
        title={groupsView ? "Screen groups" : "Screens"}
        subtitle={groupsView ? "Screens in a group share one calendar and default loop" : subtitle}
        statistics={groupsView ? undefined : [
          { value: screens.filter(isOnline).length, label: "Online now" },
          { value: `${scheduled.filter(isReadyForSunday).length} of ${scheduled.length}`, label: "Ready for Sunday" },
          { value: screens.filter(needsAttention).length, label: "Needs attention" }
        ]}>
        <HeaderTextButton onClick={() => setGroupsView(!groupsView)} data-testid="groups-toggle">{groupsView ? "Screens" : "Groups"}</HeaderTextButton>
        <HeaderPrimaryButton startIcon={<AddIcon />} onClick={() => { if (groupsView) setGroupsView(false); openPair(); }} data-testid="pair-screen-button">Pair screen</HeaderPrimaryButton>
      </PageHeader>
      <PageContainer>
        <Surface>
          {groupsView ? (
            <GroupsView groups={groups} screens={screens} playlists={playlists} />
          ) : (
            <Stack spacing={3}>
              <GetStarted steps={steps} />
              <SearchField value={search} onChange={setSearch} placeholder="Search screens" data-testid="screens-search" />
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {filterOptions.map((o) => <FilterChip key={o.value} selected={filter === o.value} onClick={() => setFilter(o.value)}>{o.label}</FilterChip>)}
              </Stack>
              <Box>
                <ResultsBar end={<ViewToggle value={view} onChange={changeView} options={[{ value: "table", label: "Table", icon: <TableIcon /> }, { value: "grid", label: "Grid", icon: <GridIcon /> }]} />}>
                  <CountChip count={filtered.length} />
                  <Typography variant="body2" color="text.secondary">{filtered.length === 1 ? "screen" : "screens"}</Typography>
                </ResultsBar>
                {filtered.length === 0
                  ? <Box sx={{ pt: 2 }}><EmptyState variant="plain" title={screens.length ? "No screens match." : "No screens yet."} description={screens.length ? undefined : "Open FreePlay on a TV, choose Settings → Pair to a calendar, then pair it here."} /></Box>
                  : <ScreenTable screens={filtered} groupName={groupName} onEdit={setEditing} view={view} />}
              </Box>
              {pairing ? (
                <Box sx={{ borderTop: 1, borderColor: "divider", pt: 3 }}>
                  <PairScreenForm groups={groups} onDone={() => setPairing(false)} />
                </Box>
              ) : (
                <AddBar sx={{ mt: 0 }}>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={openPair}>Pair screen</Button>
                </AddBar>
              )}
            </Stack>
          )}
        </Surface>
      </PageContainer>
      <ScreenEditSheet screen={editing} groups={groups} onClose={() => setEditing(null)} />
    </>
  );
};
