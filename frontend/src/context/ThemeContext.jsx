import { createContext, useCallback, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "nexid.theme";
const media = () => window.matchMedia("(prefers-color-scheme: dark)");

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => localStorage.getItem(KEY) || "system");
  const [systemDark, setSystemDark] = useState(() => media().matches);

  useEffect(() => {
    const m = media();
    const onChange = (e) => setSystemDark(e.matches);
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, []);

  const resolved = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
  }, [resolved]);

  const setTheme = useCallback((t) => {
    localStorage.setItem(KEY, t);
    setPreference(t);
  }, []);

  return <ThemeContext.Provider value={{ preference, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
