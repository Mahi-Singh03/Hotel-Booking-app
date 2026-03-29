"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import styleConfig from "@/src/app/style/style.json";

const ThemeContext = createContext(null);

const MODE_STORAGE_KEY = "app-theme-mode";
const COLOR_THEME_STORAGE_KEY = "app-color-theme";

const themeKeys = Object.keys(styleConfig.themes || {});
const fallbackThemeKey = styleConfig.defaultTheme && styleConfig.themes?.[styleConfig.defaultTheme]
  ? styleConfig.defaultTheme
  : themeKeys[0] || "luxuryGold";

const applyThemeToDocument = (mode, colorThemeKey) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  const selectedTheme = styleConfig.themes?.[colorThemeKey] || styleConfig.themes?.[fallbackThemeKey];
  const colorMap = styleConfig.cssVariableMap || {};

  if (selectedTheme?.colors) {
    Object.entries(colorMap).forEach(([colorName, cssVariableName]) => {
      const value = selectedTheme.colors[colorName];
      if (value) {
        root.style.setProperty(cssVariableName, value);
      }
    });

    if (selectedTheme.colors.background) {
      root.style.setProperty("--background", selectedTheme.colors.background);
    }

    if (selectedTheme.colors.text) {
      root.style.setProperty("--foreground", selectedTheme.colors.text);
    }
  }

  const isDarkMode = mode === "dark";
  root.classList.toggle("dark", isDarkMode);
  root.classList.toggle("light", !isDarkMode);
  root.dataset.colorTheme = colorThemeKey;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");
  const [colorTheme, setColorTheme] = useState(fallbackThemeKey);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
    const preferredMode =
      storedMode === "light" || storedMode === "dark"
        ? storedMode
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    const storedColorTheme = window.localStorage.getItem(COLOR_THEME_STORAGE_KEY);
    const preferredColorTheme = styleConfig.themes?.[storedColorTheme]
      ? storedColorTheme
      : fallbackThemeKey;

    setTheme(preferredMode);
    setColorTheme(preferredColorTheme);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") {
      return;
    }

    applyThemeToDocument(theme, colorTheme);
    window.localStorage.setItem(MODE_STORAGE_KEY, theme);
    window.localStorage.setItem(COLOR_THEME_STORAGE_KEY, colorTheme);
  }, [theme, colorTheme, mounted]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const themeOptions = useMemo(() => {
    return Object.entries(styleConfig.themes || {}).map(([key, value]) => ({
      key,
      name: value.name,
      description: value.description,
      colors: value.colors,
    }));
  }, []);

  const activeTheme = styleConfig.themes?.[colorTheme] || styleConfig.themes?.[fallbackThemeKey];

  const value = useMemo(() => {
    return {
      theme,
      mode: theme,
      setTheme,
      toggleTheme,
      colorTheme,
      setColorTheme,
      themeOptions,
      activeTheme,
      mounted,
    };
  }, [theme, toggleTheme, colorTheme, themeOptions, activeTheme, mounted]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};
