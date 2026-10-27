"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

const THEME_STORAGE_KEY = "cariockko-theme";
const THEME_CHANGE_EVENT = "cariockko-theme-change";

function isDarkMode(): boolean {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const syncTheme = () => setDarkMode(isDarkMode());
    syncTheme();
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);
    return () => window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
  }, []);

  function toggleTheme() {
    const nextDarkMode = !isDarkMode();
    document.documentElement.classList.toggle("dark", nextDarkMode);
    setDarkMode(nextDarkMode);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextDarkMode ? "dark" : "light");
    } catch (error) {
      console.error("[ThemeToggle] Could not persist theme preference:", error);
    }

    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }

  const label = darkMode ? "Ativar modo claro" : "Ativar modo escuro";
  const Icon = darkMode ? Sun : Moon;

  if (mobile) {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={label}
        className="flex min-h-[58px] flex-1 flex-col items-center justify-center gap-1 py-2 text-slate-400 transition-colors hover:text-indigo-700"
      >
        <Icon size={19} strokeWidth={1.9} />
        <span className="font-sora text-[10px] font-medium">Tema</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      className="mb-4 inline-flex min-h-10 items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-indigo-200 hover:text-indigo-700"
    >
      <Icon size={16} />
      {darkMode ? "Modo claro" : "Modo escuro"}
    </button>
  );
}
