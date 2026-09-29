"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="btn-duo-white w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-zinc-600 dark:text-zinc-300"
      aria-label="Alternar tema"
      title={theme === "dark" ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
    >
      {theme === "dark" ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
    </button>
  );
}
