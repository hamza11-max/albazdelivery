import { createTheme, type Theme } from "@mui/material/styles"

/** Align MUI palette with vendor CSS tokens in app/globals.css */
export function createVendorMuiTheme(mode: "light" | "dark"): Theme {
  const isDark = mode === "dark"

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#fb923c" : "#ea580c",
        contrastText: isDark ? "#0c1118" : "#fffbeb",
      },
      secondary: {
        main: isDark ? "#1a2433" : "#e2e8f0",
        contrastText: isDark ? "#cbd5e1" : "#1e293b",
      },
      error: {
        main: isDark ? "#ef4444" : "#dc2626",
        contrastText: "#fef2f2",
      },
      background: {
        default: isDark ? "#0c1118" : "#f0f2f7",
        paper: isDark ? "#141c28" : "#ffffff",
      },
      text: {
        primary: isDark ? "#e8edf5" : "#121b26",
        secondary: isDark ? "#94a3b8" : "#64748b",
      },
      divider: isDark ? "#243044" : "#cbd5e1",
    },
    typography: {
      fontFamily: "var(--font-inter), Inter, system-ui, sans-serif",
    },
    shape: {
      borderRadius: 8,
    },
  })
}
