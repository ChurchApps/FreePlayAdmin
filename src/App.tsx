import React, { useMemo } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { CookiesProvider } from "react-cookie";
import { QueryClientProvider } from "@tanstack/react-query";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ControlPanel } from "./ControlPanel";
import { UserProvider } from "./UserContext";
import { ThemeContextProvider, useThemeMode } from "./ThemeContext";
import { createAppTheme } from "./helpers/Themes";
import { queryClient } from "./queryClient";

const ThemedApp: React.FC = () => {
  const { mode, themeId, brandColor } = useThemeMode();
  const theme = useMemo(() => createAppTheme(mode, themeId, brandColor), [mode, themeId, brandColor]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <CookiesProvider defaultSetOptions={{ path: "/" }}>
          <UserProvider>
            <DndProvider backend={HTML5Backend}>
              <Router>
                <Routes>
                  <Route path="/*" element={<ControlPanel />} />
                </Routes>
              </Router>
            </DndProvider>
          </UserProvider>
        </CookiesProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

const App: React.FC = () => (
  <ThemeContextProvider>
    <ThemedApp />
  </ThemeContextProvider>
);
export default App;
