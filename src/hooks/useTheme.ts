import { useEffect } from "react";
import { useStore } from "./useStore";

export function useTheme() {
  const { state, setTheme } = useStore();
  const theme = state.prefs.theme;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const isDark = theme === "dark" || (theme === "system" && mql.matches);
      root.classList.toggle("dark", isDark);
      root.style.colorScheme = isDark ? "dark" : "light";
    };
    apply();
    if (theme === "system") {
      mql.addEventListener("change", apply);
      return () => mql.removeEventListener("change", apply);
    }
  }, [theme]);

  const cycle = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  return { theme, setTheme, cycle };
}
