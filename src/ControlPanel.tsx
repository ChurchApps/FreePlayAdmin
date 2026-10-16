import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ApiHelper } from "@churchapps/apphelper";
import UserContext from "./UserContext";
import { Login } from "./Login";
import { Logout } from "./Logout";
import { Authenticated } from "./Authenticated";

export const ControlPanel = () => {
  React.useContext(UserContext);
  return (
    <Routes>
      <Route path="/logout" element={<Logout />} />
      <Route path="/login" element={<Login />} />
      <Route path="/*" element={<RequireAuth><Authenticated /></RequireAuth>} />
    </Routes>
  );
};

const RequireAuth = ({ children }: { children: React.ReactElement }) => {
  const location = useLocation();
  if (!ApiHelper.isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};
