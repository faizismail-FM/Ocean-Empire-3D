"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { ShipModel } from "@/data/schemas";
import { distanceNm } from "@/engine/geo";
import { berthHeading, landBearing } from "@/engine/harbour";
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
  /** Berth slot along the quay when docked (the player's ship has the centre berth). */
  slot: number;
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
      const berths = new Map<string, number>();
      for (const def of cat.scenario.rivals) {
        const rival = state.rivals[def.id];
        if (!rival) continue;
        for (const ship of Object.values(rival.ships)) {
          if (distanceNm(me.position, ship.position) > VISIBLE_NM) continue;
          const cls = cat.ships.find((c) => c.id === ship.class_id);
          if (!cls) continue;
          let slot = 0;
          if (ship.status === "docked" && ship.docked_port_id) {
            slot = berths.get(ship.docked_port_id) ?? 0;
            berths.set(ship.docked_port_id, slot + 1);
          }
          list.push({ key: `${def.id}:${ship.id}`, model: cls.model, length: cls.length_m, color: def.color, name: ship.name, slot });
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
    let x = p.x;
    let z = p.z;
    let heading = ship.heading;
    // Docked rivals lie alongside the quay in their own berths, either side of the player's.
    const port = ship.status === "docked" && ship.docked_port_id ? useGameStore.getState().catalog?.portMap.get(ship.docked_port_id) : undefined;
    if (port) {
      const b = (landBearing(port) * Math.PI) / 180;
      const side = info.slot % 2 === 0 ? 1 : -1;
      const rank = Math.floor(info.slot / 2) + 1;
      const along = side * rank * (info.length * 1.3 + 50);
      x += Math.cos(b) * along;
      z += Math.sin(b) * along;
      heading = berthHeading(port, ship.heading);
    }
    const damp = Math.min(1, 40 / info.length);
    g.visible = true;
    g.position.set(x, waveHeight(x, z, frame.wavePhases, frame.waveAmp) * damp, z);
    g.rotation.set(0, headingToRotationY(heading), 0);
  });
  return (
    <group ref={group}>
      <ProceduralShip model={info.model} length={info.length} sailYaw={15} sailSet={1} accent={info.color} seed={info.key} />
    </group>
  );
}
