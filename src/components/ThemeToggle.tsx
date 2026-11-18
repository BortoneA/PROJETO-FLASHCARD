"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="btn-saas-secondary w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
      aria-label="Alternar tema"
      title={theme === "dark" ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
    >
      {theme === "dark" ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
    </button>
  );
}
