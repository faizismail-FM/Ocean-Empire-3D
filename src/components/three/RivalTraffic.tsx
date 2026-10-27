"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ShipModel } from "@/data/schemas";
import { distanceNm } from "@/engine/geo";
import { useGameStore } from "@/store/game-store";
import { ProceduralShip } from "./ProceduralShip";
import { geoToScene, getSceneFrame, headingToRotationY } from "./scene-state";
import { waveHeight } from "./waves";

const VISIBLE_NM = 8;
const MAX_VISIBLE = 6;

interface Nearby {
  key: string;
  model: ShipModel;
  length: number;
  color: string;
  name: string;
}

/**
 * Rival ships within visual range of the player, drawn from the simulation rather than
 * generated: their positions, headings and hulls are the ones the Rivals screen reports.
 * Membership is re-evaluated once a second; positions follow the game state every frame.
 */
export function RivalTraffic() {
  const [nearby, setNearby] = useState<Nearby[]>([]);
  const catalog = useGameStore((s) => s.catalog);

  useEffect(() => {
    const update = () => {
      const st = useGameStore.getState();
      const state = st.state;
      const cat = st.catalog;
      if (!state || !cat || !state.active_ship_id) return;
      const me = state.ships[state.active_ship_id];
      if (!me) return;
      const list: Nearby[] = [];
      for (const def of cat.scenario.rivals) {
        const rival = state.rivals[def.id];
        if (!rival) continue;
        for (const ship of Object.values(rival.ships)) {
          if (distanceNm(me.position, ship.position) > VISIBLE_NM) continue;
          const cls = cat.ships.find((c) => c.id === ship.class_id);
          if (!cls) continue;
          list.push({ key: `${def.id}:${ship.id}`, model: cls.model, length: cls.length_m, color: def.color, name: ship.name });
          if (list.length >= MAX_VISIBLE) break;
        }
      }
      setNearby((prev) => (prev.length === list.length && prev.every((p, i) => p.key === list[i]?.key) ? prev : list));
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!catalog) return null;
  return (
    <>
      {nearby.map((n) => (
        <RivalShipMesh key={n.key} info={n} />
      ))}
    </>
  );
}

function RivalShipMesh({ info }: { info: Nearby }) {
  const group = useRef<THREE.Group>(null);
  const [rivalId, shipId] = info.key.split(":") as [string, string];
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const frame = getSceneFrame();
    const state = useGameStore.getState().state;
    const ship = state?.rivals[rivalId]?.ships[shipId];
    if (!ship) {
      g.visible = false;
      return;
    }
    const p = geoToScene(frame.origin, ship.position);
    // Docked rivals sit a little off the quay so they never share the player's berth.
    const offset = ship.status === "docked" ? info.length * 1.6 : 0;
    const x = p.x + offset;
    const z = p.z - offset * 0.4;
    const damp = Math.min(1, 40 / info.length);
    g.visible = true;
    g.position.set(x, waveHeight(x, z, frame.wavePhases, frame.waveAmp) * damp, z);
    g.rotation.set(0, headingToRotationY(ship.heading), 0);
  });
  return (
    <group ref={group}>
      <ProceduralShip model={info.model} length={info.length} sailYaw={15} sailSet={1} accent={info.color} seed={info.key} />
    </group>
  );
}
