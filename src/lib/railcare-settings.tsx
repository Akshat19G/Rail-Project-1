import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Device-level preferences: appearance, accessibility and alert behaviour.
 * Applied to <html> so every screen (and portal content) picks them up.
 */

export type ThemeMode = "light" | "dark" | "system";
export type TextSize = "sm" | "md" | "lg";

export type AppSettings = {
  theme: ThemeMode;
  textSize: TextSize;
  highContrast: boolean;
  reduceMotion: boolean;
  alertSound: boolean;
  toastAlerts: boolean;
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  textSize: "md",
  highContrast: false,
  reduceMotion: false,
  alertSound: true,
  toastAlerts: true,
};

const KEY = "railcare.settings.v1";

type Ctx = {
  settings: AppSettings;
  update: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<Ctx | null>(null);

function apply(s: AppSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark =
    s.theme === "dark" ||
    (s.theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", !!dark);
  root.classList.toggle("rc-contrast", s.highContrast);
  root.classList.toggle("rc-reduce-motion", s.reduceMotion);
  root.dataset["textSize"] = s.textSize;
}

export function RailCareSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let next = DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) next = { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AppSettings>) };
    } catch {
      /* ignore */
    }
    setSettings(next);
    apply(next);
  }, []);

  const update = useCallback<Ctx["update"]>((key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      apply(next);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    apply(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ settings, update, resetSettings }), [settings, update, resetSettings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used inside RailCareSettingsProvider");
  return ctx;
}

/** Short alert tone used when an emergency notification arrives. */
export function playAlertTone() {
  try {
    const AudioCtor =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.52);
    osc.onended = () => void ctx.close();
  } catch {
    /* audio unavailable */
  }
}
