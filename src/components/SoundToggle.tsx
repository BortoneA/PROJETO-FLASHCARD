"use client";

import { useState, useEffect } from "react";
import { sound } from "@/lib/sound";
import { Volume2, VolumeX } from "lucide-react";

export function SoundToggle() {
  const [muted, setMuted] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMuted(sound.isSoundMuted());
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 sm:w-10 sm:h-10" />;
  }

  const handleToggle = () => {
    const isNowMuted = sound.toggleMute();
    setMuted(isNowMuted);
    if (!isNowMuted) {
      sound.playSuccess(4);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="btn-duo-white w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center text-zinc-600 dark:text-zinc-300"
      aria-label={muted ? "Ativar Efeitos Sonoros" : "Desativar Efeitos Sonoros"}
      title={muted ? "Ativar Efeitos Sonoros" : "Desativar Efeitos Sonoros"}
    >
      {muted ? (
        <VolumeX size={18} className="text-rose-500" />
      ) : (
        <Volume2 size={18} className="text-[#58cc02]" />
      )}
    </button>
  );
}
