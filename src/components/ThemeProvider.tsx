"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "oled";

interface ThemeContextType {
  theme: Theme;
  toggle: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggle: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Read persisted preference or fallback to system
    const stored = localStorage.getItem("kortex-theme") || localStorage.getItem("anki-pro-theme");
    if (stored === "light" || stored === "dark" || stored === "oled") {
      setThemeState(stored as Theme);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setThemeState(prefersDark ? "dark" : "light");
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    root.classList.remove("dark", "oled");
    root.removeAttribute("data-theme");

    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "oled") {
      root.classList.add("dark", "oled");
      root.setAttribute("data-theme", "oled");
    }

    // Update meta theme-color for mobile browser chrome
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute(
        "content",
        theme === "oled" ? "#000000" : theme === "dark" ? "#090a0f" : "#f8fafc"
      );
    }

    localStorage.setItem("kortex-theme", theme);
  }, [theme, mounted]);

  const toggle = useCallback(() => {
    setThemeState((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "oled";
      return "light";
    });
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggle, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
