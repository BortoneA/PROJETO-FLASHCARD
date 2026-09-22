"use client";

import { useRef, useCallback } from "react";
import {
  Bold, Italic, Underline, List, ListOrdered, Heading2, Heading3,
  Strikethrough, Code, Quote, Minus, Link as LinkIcon
} from "lucide-react";

interface RichToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
}

export default function RichToolbar({ textareaRef, value, onChange }: RichToolbarProps) {

  const wrapSelection = useCallback((prefix: string, suffix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const before = value.substring(0, start);
    const after = value.substring(end);

    if (selectedText) {
      const newText = `${before}${prefix}${selectedText}${suffix}${after}`;
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {
      const placeholder = "texto";
      const newText = `${before}${prefix}${placeholder}${suffix}${after}`;
      onChange(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
      }, 0);
    }
  }, [textareaRef, value, onChange]);

  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const before = value.substring(0, start);
    const after = value.substring(start);

    // Ensure we're on a new line
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const prefix = needsNewline ? "\n" : "";

    const newText = `${before}${prefix}${text}${after}`;
    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + text.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  }, [textareaRef, value, onChange]);

  const tools = [
    { icon: Bold, label: "Negrito", action: () => wrapSelection("**", "**") },
    { icon: Italic, label: "It\u00e1lico", action: () => wrapSelection("*", "*") },
    { icon: Strikethrough, label: "Tachado", action: () => wrapSelection("~~", "~~") },
    { icon: Code, label: "C\u00f3digo", action: () => wrapSelection("`", "`") },
    { divider: true },
    { icon: Heading2, label: "T\u00edtulo", action: () => insertAtCursor("## ") },
    { icon: Heading3, label: "Subt\u00edtulo", action: () => insertAtCursor("### ") },
    { divider: true },
    { icon: List, label: "Lista", action: () => insertAtCursor("- ") },
    { icon: ListOrdered, label: "Lista Numerada", action: () => insertAtCursor("1. ") },
    { divider: true },
    { icon: Quote, label: "Cita\u00e7\u00e3o", action: () => insertAtCursor("> ") },
    { icon: Minus, label: "Separador", action: () => insertAtCursor("---\n") },
    { icon: LinkIcon, label: "Link", action: () => wrapSelection("[", "](url)") },
  ];

  return (
    <div className="flex items-center gap-0.5 flex-wrap px-1 py-1.5 bg-zinc-100/80 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/50 rounded-t-xl transition-colors">
      {tools.map((tool, i) => {
        if ("divider" in tool && tool.divider) {
          return (
            <div key={`div-${i}`} className="w-px h-5 bg-zinc-300 dark:bg-zinc-600 mx-0.5" />
          );
        }

        const Icon = tool.icon!;
        return (
          <button
            key={i}
            type="button"
            onClick={tool.action}
            title={tool.label}
            className="p-1.5 rounded-lg text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 transition-all active:scale-90 touch-manipulation"
          >
            <Icon size={15} strokeWidth={2.2} />
          </button>
        );
      })}
    </div>
  );
}
