export const THEME_STORAGE_KEY = "gtel_theme";

export function resolveEffectiveTheme(theme, systemPrefersDark = false) {
  if (theme === "dark") return "dark";
  if (theme === "light") return "light";
  return systemPrefersDark ? "dark" : "light";
}
