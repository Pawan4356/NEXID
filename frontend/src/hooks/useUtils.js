import { useCallback, useEffect, useRef, useState } from "react";

export function useDebouncedValue(value, delay = 250) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/** Ctrl/⌘ + key global shortcut. */
export function useHotkey(key, handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key) {
        e.preventDefault();
        ref.current(e);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [key]);
}

export function useLocalStorageState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw == null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

/**
 * Debounced autosave. Reports honest status: "saving" while a write is in
 * flight, "saved" only after the save function resolves, "error" if it rejects.
 */
export function useAutosave(save, delay = 700) {
  const [status, setStatus] = useState("idle");
  const [savedAt, setSavedAt] = useState(null);
  const timer = useRef(null);
  const pending = useRef(null);
  const saveRef = useRef(save);
  saveRef.current = save;
  const mounted = useRef(true);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    if (!pending.current) return;
    const value = pending.current;
    pending.current = null;
    setStatus("saving");
    try {
      await saveRef.current(value);
      setSavedAt(new Date());
      setStatus(pending.current ? "pending" : "saved");
    } catch (err) {
      // Keep the failed patch queued (newer edits win) so the next save retries it.
      const newer = pending.current;
      pending.current = newer && typeof newer === "object" && typeof value === "object" ? { ...value, ...newer } : (newer ?? value);
      // A final save after unmount (e.g. the record was just deleted) has nobody to report to.
      if (!mounted.current) return;
      setStatus("error");
      console.error(err);
    }
  }, []);

  const schedule = useCallback(
    (value) => {
      // Object patches merge so e.g. a title edit and a content edit save together.
      const prev = pending.current;
      pending.current = prev && typeof prev === "object" && typeof value === "object" ? { ...prev, ...value } : value;
      setStatus("pending");
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush, delay],
  );

  // Save whatever is left when the component unmounts (e.g. navigating away).
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      void flush();
    };
  }, [flush]);

  /** Drop unsaved changes (e.g. the record is being deleted). */
  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    pending.current = null;
  }, []);

  // Warn before closing the tab with unsaved changes.
  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (pending.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return { status, savedAt, schedule, flush, cancel };
}
