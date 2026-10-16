import React, { Suspense } from "react";
import { Routes, Route, Navigate, Outlet, useNavigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { UserHelper } from "@churchapps/apphelper";
import UserContext from "./UserContext";
import { Header } from "./components/Header";
import { PageTitleContext } from "./components/PageTitle";

const ScreensPage = React.lazy(() => import("./screens/ScreensPage").then((m) => ({ default: m.ScreensPage })));
const ScreenPage = React.lazy(() => import("./screens/ScreenPage").then((m) => ({ default: m.ScreenPage })));
const PlaylistsPage = React.lazy(() => import("./playlists/PlaylistsPage").then((m) => ({ default: m.PlaylistsPage })));
const PlaylistPage = React.lazy(() => import("./playlists/PlaylistPage").then((m) => ({ default: m.PlaylistPage })));
const CalendarPage = React.lazy(() => import("./calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const ProvidersPage = React.lazy(() => import("./providers/ProvidersPage").then((m) => ({ default: m.ProvidersPage })));
const PresentPlaylistPage = React.lazy(() => import("./present/PresentPage").then((m) => ({ default: m.PresentPlaylistPage })));
const PresentScreenPage = React.lazy(() => import("./present/PresentPage").then((m) => ({ default: m.PresentScreenPage })));

const Loading: React.FC = () => <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}><CircularProgress /></Box>;

const Layout: React.FC = () => {
  const [title, setTitle] = React.useState("");
  const value = React.useMemo(() => ({ title, setTitle }), [title]);
  return (
    <PageTitleContext.Provider value={value}>
      <Header page={title} />
      <Box component="main" sx={{ width: "100%" }}>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </Box>
    </PageTitleContext.Provider>
  );
};

export const Authenticated: React.FC = () => {
  const navigate = useNavigate();
  const context = React.useContext(UserContext);

  if (context) {
    UserHelper.currentUserChurch = context.userChurch;
    UserHelper.userChurches = context.userChurches;
    UserHelper.user = context.user;
    UserHelper.person = context.person;
  }

  React.useEffect(() => {
    if (UserHelper.churchChanged) {
      UserHelper.churchChanged = false;
      navigate("/screens");
    }
  });

  if (!context || UserHelper.churchChanged) return null;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/screens/:id" element={<ScreenPage />} />
        <Route path="/screens" element={<ScreensPage />} />
        <Route path="/pair" element={<Navigate to="/screens?pair=1" replace />} />
        <Route path="/playlists/:id" element={<PlaylistPage />} />
        <Route path="/playlists" element={<PlaylistsPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/providers" element={<ProvidersPage />} />
        <Route path="*" element={<Navigate to="/screens" replace />} />
      </Route>
      <Route path="/present/playlist/:id" element={<Suspense fallback={<Loading />}><PresentPlaylistPage /></Suspense>} />
      <Route path="/present/screen/:deviceId" element={<Suspense fallback={<Loading />}><PresentScreenPage /></Suspense>} />
    </Routes>
  );
};
