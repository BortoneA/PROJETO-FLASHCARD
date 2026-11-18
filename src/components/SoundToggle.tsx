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
    return <div className="w-8 h-8 sm:w-8.5 sm:h-8.5" />;
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
      className="btn-saas-secondary w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground"
      aria-label={muted ? "Ativar Efeitos Sonoros" : "Desativar Efeitos Sonoros"}
      title={muted ? "Ativar Efeitos Sonoros" : "Desativar Efeitos Sonoros"}
    >
      {muted ? (
        <VolumeX size={15} className="text-rose-500" />
      ) : (
        <Volume2 size={15} className="text-emerald-500" />
      )}
    </button>
  );
}
