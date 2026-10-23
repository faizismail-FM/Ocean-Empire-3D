"use client";

import dynamic from "next/dynamic";
import { useEffect, useSyncExternalStore } from "react";
import { Waves } from "lucide-react";
import { SailingHUD } from "@/components/hud/SailingHUD";
import { LinkButton } from "@/components/ui";
import { useGameStore } from "@/store/game-store";

// Three.js must never run during server rendering.
const SailingScene = dynamic(() => import("@/components/three/SailingScene").then((m) => m.SailingScene), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-foam/60">
      <Waves className="mr-2 animate-pulse text-cyan-300" /> Preparing the ocean…
    </div>
  ),
});

let webglCache: boolean | null = null;
function webglAvailable(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    const canvas = document.createElement("canvas");
    webglCache = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    webglCache = false;
  }
  return webglCache;
}
const noopSubscribe = () => () => {};

export default function SailPage() {
  const webgl = useSyncExternalStore(noopSubscribe, webglAvailable, () => null);
  const hasShip = useGameStore((s) => !!(s.state?.active_ship_id && s.state.ships[s.state.active_ship_id]));
  const setActiveShip = useGameStore((s) => s.setActiveShip);
  const firstShip = useGameStore((s) => Object.keys(s.state?.ships ?? {})[0]);

  useEffect(() => {
    if (!hasShip && firstShip) setActiveShip(firstShip);
  }, [hasShip, firstShip, setActiveShip]);

  if (webgl === false) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="panel max-w-md p-6 text-center">
          <h2 className="text-2xl">3D view unavailable</h2>
          <p className="mt-2 text-sm text-foam/70">Your browser does not provide WebGL, which the sailing scene needs. Ships still move on the World map and the fleet screen, and autopilot voyages complete normally.</p>
          <div className="mt-4 flex justify-center gap-2">
            <LinkButton href="/play/world">World map</LinkButton>
            <LinkButton href="/play/fleet" variant="secondary">Fleet</LinkButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#06192e]">
      {webgl && hasShip && <SailingScene />}
      <SailingHUD />
    </div>
  );
}
