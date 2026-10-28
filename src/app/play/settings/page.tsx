"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Save, Trash2 } from "lucide-react";
import { serializeState } from "@/engine/save";
import { getPersistence } from "@/persistence";
import { useGameStore } from "@/store/game-store";
import { useSettingsStore, type QualityLevel } from "@/store/settings-store";
import { Button, ConfirmDialog, KeyValue, Panel } from "@/components/ui";
import { AccountPanel } from "@/components/game/AccountPanel";
import { HelpTip } from "@/components/game/Guide";

export default function SettingsPage() {
  const router = useRouter();
  const state = useGameStore((s) => s.state)!;
  const saveGame = useGameStore((s) => s.saveGame);
  const deleteSave = useGameStore((s) => s.deleteSave);
  const quitToMenu = useGameStore((s) => s.quitToMenu);
  const lastSavedAt = useGameStore((s) => s.lastSavedAt);
  const settings = useSettingsStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const exportSave = () => {
    const blob = new Blob([serializeState(state)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ocean-empire-${state.empire.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2"><h1 className="text-3xl">Settings</h1><HelpTip section="saves" /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Graphics" subtitle="Applies to the 3D sailing scene.">
          <div className="flex gap-2">
            {(["low", "medium", "high"] as QualityLevel[]).map((q) => (
              <Button key={q} size="sm" variant={settings.quality === q ? "primary" : "secondary"} onClick={() => settings.setQuality(q)} className="capitalize">
                {q}
              </Button>
            ))}
          </div>
          <KeyValue
            className="mt-3 text-xs"
            items={[
              ["Low", "No shadows, 10 m ocean mesh, pixel ratio 1"],
              ["Medium", "Soft shadows, 5 m ocean mesh, pixel ratio up to 1.5"],
              ["High", "Soft shadows, 3.5 m ocean mesh, pixel ratio up to 2"],
            ]}
          />
          <p className="mt-2 text-xs text-foam/50">Frame rates depend on your hardware; no specific rate is guaranteed.</p>
        </Panel>
        <Panel title="Sound" subtitle="Ocean, wind and a generative music bed, synthesised in the browser; no audio files are downloaded.">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.audio.enabled} onChange={(e) => settings.setAudio({ enabled: e.target.checked })} /> Sound on</label>
          {([["master", "Master"], ["music", "Music"], ["ambience", "Sea, wind and ship"]] as const).map(([key, label]) => (
            <label key={key} className="mt-2 block text-xs text-foam/70">
              <div className="flex justify-between"><span>{label}</span><span className="font-mono">{Math.round(settings.audio[key] * 100)}%</span></div>
              <input type="range" min={0} max={100} step={5} value={Math.round(settings.audio[key] * 100)} onChange={(e) => settings.setAudio({ [key]: Number(e.target.value) / 100 })} className="w-full" aria-label={`${label} volume`} />
            </label>
          ))}
          <p className="mt-2 text-xs text-foam/50">Browsers allow sound only after you click or press a key. The music follows the campaign: a plucked hijaz scale for Siraf, a pentatonic zither for the Ming fleets, a bowed Dorian line for Venice, synthesiser pads for the modern line. It is a mood, not a reconstruction of period music.</p>
        </Panel>
        <Panel title="Gameplay">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.autosave} onChange={(e) => settings.setAutosave(e.target.checked)} /> Autosave every 30 seconds and when the tab is hidden</label>
          <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.showTutorialHints} onChange={(e) => settings.setShowTutorialHints(e.target.checked)} /> Show tutorial hints in the sailing view</label>
          <div className="mt-3 text-sm text-foam/70">Default camera</div>
          <div className="mt-1 flex gap-2">
            {(["chase", "free", "overhead"] as const).map((c) => (
              <Button key={c} size="sm" variant={settings.camera === c ? "primary" : "secondary"} onClick={() => settings.setCamera(c)} className="capitalize">{c}</Button>
            ))}
          </div>
        </Panel>
        <Panel title="Controls" subtitle="Keyboard shortcuts in the sailing view. Ignored while typing in a text field.">
          <KeyValue
            items={[
              ["W / S", "Increase or decrease throttle or sail"],
              ["A / D", "Steer to port or starboard (hold)"],
              ["Space", "Pause or resume the simulation"],
              ["C", "Cycle camera: chase, free, overhead"],
              ["+ / −", "Camera zoom"],
              ["R", "Reset camera"],
              ["Escape", "Open the game menu"],
            ]}
          />
        </Panel>
        <Panel title="Save data" subtitle={`Storage: ${getPersistence().name}${lastSavedAt ? ` · last saved ${new Date(lastSavedAt).toLocaleTimeString()}` : ""}`}>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => void saveGame()}><Save size={14} /> Save now</Button>
            <Button size="sm" variant="secondary" onClick={exportSave}><Download size={14} /> Export JSON</Button>
            <Button size="sm" variant="secondary" onClick={() => { void saveGame(); quitToMenu(); router.push("/"); }}>Save & quit to menu</Button>
            <Button size="sm" variant="danger" onClick={() => setConfirmReset(true)}><Trash2 size={14} /> Reset this game</Button>
          </div>
          <p className="mt-3 text-xs text-foam/50">Saves live in this browser{getPersistence().hasRemote ? " and are mirrored to Supabase" : ""}. Export a JSON file to move progress by hand.</p>
          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="label-caps mb-2">Account</div>
            <AccountPanel />
          </div>
        </Panel>
      </div>
      <ConfirmDialog
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          await deleteSave(state.id);
          setConfirmReset(false);
          router.push("/");
        }}
        title="Reset this game?"
        message="This deletes the save permanently and returns you to the main menu. The historical database is unaffected."
        confirmLabel="Delete and reset"
        danger
      />
    </div>
  );
}
