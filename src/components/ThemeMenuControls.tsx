import React from "react";
import { Box, Typography } from "@mui/material";
import { DarkModeOutlined as DarkIcon, LightModeOutlined as LightIcon } from "@mui/icons-material";
import { Locale } from "@churchapps/apphelper";
import { useThemeMode } from "../ThemeContext";
import { ViewToggle } from "./ui";

export const ThemeMenuControls: React.FC = () => {
  const { mode, toggleTheme } = useThemeMode();
  return (
    <Box data-testid="user-menu-theme">
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>{Locale.label("profile.profilePage.themePreferences", "Theme")}</Typography>
      <ViewToggle
        value={mode}
        onChange={(v) => { if (v !== mode) toggleTheme(); }}
        options={[
          { value: "light", label: Locale.label("profile.profilePage.lightMode", "Light"), icon: <LightIcon />, "data-testid": "theme-mode-light" },
          { value: "dark", label: Locale.label("profile.profilePage.darkMode", "Dark"), icon: <DarkIcon />, "data-testid": "theme-mode-dark" }
        ]}
      />
    </Box>
  );
};
