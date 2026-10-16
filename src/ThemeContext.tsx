import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { type ThemeId } from "./helpers/Themes";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
  themeId: ThemeId;
  brandColor: string;
}

export const FREEPLAY_BRAND = "#E91E63";
const THEME_STORAGE_KEY = "freeplay-theme-mode";

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getInitialMode = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch { /* storage unavailable */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

interface Props {
  children: React.ReactNode;
}

export const ThemeContextProvider = ({ children }: Props) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);

  useEffect(() => {
    document.body.classList.toggle("dark-theme", mode === "dark");
    document.body.dataset.b1Theme = "custom";
  }, [mode]);

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* storage unavailable */ }
      return next;
    });
  };

  const value = useMemo<ThemeContextType>(() => ({ mode, toggleTheme, themeId: "custom", brandColor: FREEPLAY_BRAND }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeMode = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemeMode must be used within a ThemeContextProvider");
  return context;
};

export default ThemeContext;
