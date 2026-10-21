import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "system",
  effectiveTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
});

import { THEME_STORAGE_KEY, resolveEffectiveTheme } from "../utils/theme.js";

export { THEME_STORAGE_KEY, resolveEffectiveTheme };

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        return stored;
      }
    } catch {
      // Ignorar fallos de acceso a localStorage
    }
    return "system";
  });

  const [effectiveTheme, setEffectiveTheme] = useState("light");

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const isDark = theme === "dark" || (theme === "system" && Boolean(window.matchMedia?.("(prefers-color-scheme: dark)")?.matches));

      if (isDark) {
        root.classList.add("dark");
        root.setAttribute("data-theme", "dark");
        setEffectiveTheme("dark");
      } else {
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
        setEffectiveTheme("light");
      }
    };

    applyTheme();

    if (theme === "system" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme();
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    if (newTheme === "light" || newTheme === "dark" || newTheme === "system") {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch {
        // Ignorar
      }
    }
  };

  const toggleTheme = () => {
    setTheme(effectiveTheme === "dark" ? "light" : "dark");
  };

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe ser utilizado dentro de un ThemeProvider");
  }
  return context;
}
