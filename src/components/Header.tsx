import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SiteHeader } from "@churchapps/apphelper";
import UserContext from "../UserContext";
import { EnvironmentHelper } from "../helpers";
import { ThemeMenuControls } from "./ThemeMenuControls";
import { CommandPalette, type PaletteAction, type PaletteMenuItem } from "./commandPalette/CommandPalette";

const menu: PaletteMenuItem[] = [
  { url: "/screens", icon: "tv", label: "Screens", children: [{ url: "/screens?view=groups", icon: "grid_view", label: "Groups" }] },
  { url: "/playlists", icon: "playlist_play", label: "Playlists" },
  { url: "/calendar", icon: "calendar_month", label: "Calendar" },
  { url: "/providers", icon: "extension", label: "Providers" }
];

const actions: PaletteAction[] = [
  { url: "/screens?pair=1", icon: "add", label: "Pair screen", keywords: ["tv", "code", "new"] },
  { url: "/playlists?add=1", icon: "add", label: "Add playlist", keywords: ["new", "create"] },
  { url: "/calendar?add=1", icon: "add", label: "Add schedule", keywords: ["new", "event", "time"] }
];

interface Props { page?: string }

export const Header: React.FC<Props> = ({ page }) => {
  const context = React.useContext(UserContext);
  const navigate = useNavigate();
  const location = useLocation();

  const also: PaletteAction[] = React.useMemo(() => [
    { url: EnvironmentHelper.B1AdminUrl, icon: "open_in_new", label: "Open B1 Admin" },
    { url: "https://support.churchapps.org/freeplay", icon: "help_outline", label: "Help · support.churchapps.org/freeplay" }
  ], []);

  const section = menu.find((m) => location.pathname.startsWith(m.url))?.label || "Screens";
  const primaryMenu = menu.map((m) => ({ url: m.url, icon: m.icon || "", label: m.label }));

  return (
    <>
      <SiteHeader
        primaryMenuItems={primaryMenu}
        primaryMenuLabel={section}
        secondaryMenuItems={[]}
        secondaryMenuLabel={page || section}
        context={context!}
        appName="FreePlay"
        onNavigate={(url) => navigate(url)}
        userMenuExtras={<ThemeMenuControls />}
      />
      <CommandPalette menu={menu} actions={actions} also={also} label={section} page={page} />
    </>
  );
};
