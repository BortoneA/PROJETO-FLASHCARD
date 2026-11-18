"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun, Zap } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  const getTitle = () => {
    if (theme === "light") return "Tema: Claro (clique para Escuro Slate)";
    if (theme === "dark") return "Tema: Escuro Slate (clique para OLED Black)";
    return "Tema: OLED Black Puro (clique para Modo Claro)";
  };

  return (
    <button
      onClick={toggle}
      className="btn-saas-secondary h-8 px-2 rounded-lg flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all"
      aria-label="Alternar tema"
      title={getTitle()}
    >
      {theme === "light" && <Sun size={14} className="text-amber-500" />}
      {theme === "dark" && <Moon size={14} className="text-sky-400" />}
      {theme === "oled" && <Zap size={13} className="text-emerald-400" />}
      <span className="hidden md:inline font-mono text-[10px] uppercase font-semibold text-muted-foreground">
        {theme === "oled" ? "OLED" : theme === "dark" ? "Dark" : "Light"}
      </span>
    </button>
  );
}
