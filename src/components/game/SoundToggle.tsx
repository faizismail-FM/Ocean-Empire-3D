"use client";

import { Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store/settings-store";

/** One button that mutes or unmutes the procedural sound; the levels live in Settings. */
export function SoundToggle({ className, label = false }: { className?: string; label?: boolean }) {
  const enabled = useSettingsStore((s) => s.audio.enabled);
  const setAudio = useSettingsStore((s) => s.setAudio);
  return (
    <button
      onClick={() => setAudio({ enabled: !enabled })}
      className={cn("flex items-center gap-1.5 rounded-md border border-white/10 p-2 text-xs hover:bg-white/10", !enabled && "text-foam/50", className)}
      title={enabled ? "Mute sound" : "Unmute sound"}
      aria-label={enabled ? "Mute sound" : "Unmute sound"}
      aria-pressed={enabled}
    >
      {enabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
      {label && <span>{enabled ? "Sound on" : "Sound off"}</span>}
    </button>
  );
}
