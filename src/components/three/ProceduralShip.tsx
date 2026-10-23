"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ShipModel } from "@/data/schemas";
import { createRandom } from "@/engine/rng";

/**
 * Original procedural ship models built from primitives, so the game never depends on an
 * external model URL. Every model points its bow toward -Z and sits with its waterline at
 * y = 0. `length` is the vessel's length in metres; other dimensions derive from it.
 */

interface ShipProps {
  model: ShipModel;
  length: number;
  /** Sail yaw in degrees (sail models only): positive swings the sail to starboard. */
  sailYaw?: number;
  /** 0..1 how much sail is set (sail models), or engine load (unused visually). */
  sailSet?: number;
  accent?: string;
  seed?: string;
}

export function ProceduralShip({ model, length, sailYaw = 0, sailSet = 1, accent = "#22d3ee", seed = "ship" }: ShipProps) {
  switch (model) {
    case "container_feeder":
    case "container_large":
      return <ContainerShip length={length} accent={accent} seed={seed} large={model === "container_large"} />;
    case "sewn_plank":
    case "lateen_coaster":
      return <SewnPlankShip length={length} sailYaw={sailYaw} sailSet={sailSet} masts={model === "sewn_plank" ? 2 : 1} accent={accent} />;
    case "jong":
      return <Jong length={length} sailYaw={sailYaw} sailSet={sailSet} accent={accent} />;
    case "lancaran":
      return <Lancaran length={length} sailYaw={sailYaw} sailSet={sailSet} accent={accent} />;
    case "junk":
      return <Junk length={length} sailYaw={sailYaw} sailSet={sailSet} accent={accent} />;
  }
}

// ---------------------------------------------------------------------------
// Geometry helpers

/** Hull outline in plan view (x = beam, y = length with bow at +y), extruded upward. */
function hullGeometry(length: number, beam: number, height: number, bowSharpness = 0.3, sternSharpness = 0, bevel = true): THREE.ExtrudeGeometry {
  const L = length / 2;
  const B = beam / 2;
  const shape = new THREE.Shape();
  if (sternSharpness > 0) {
    shape.moveTo(0, -L);
    shape.quadraticCurveTo(B, -L + length * sternSharpness * 0.6, B, -L + length * sternSharpness);
  } else {
    shape.moveTo(-B, -L);
    shape.lineTo(B, -L);
  }
  shape.lineTo(B, L - length * bowSharpness);
  shape.quadraticCurveTo(B, L - length * bowSharpness * 0.35, 0, L);
  shape.quadraticCurveTo(-B, L - length * bowSharpness * 0.35, -B, L - length * bowSharpness);
  if (sternSharpness > 0) {
    shape.lineTo(-B, -L + length * sternSharpness);
    shape.quadraticCurveTo(-B, -L + length * sternSharpness * 0.6, 0, -L);
  } else {
    shape.lineTo(-B, -L);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: bevel, bevelThickness: height * 0.25, bevelSize: beam * 0.08, bevelSegments: 2, curveSegments: 10 });
  // Extrusion runs along +Z; rotate so it runs along +Y and plan-view +Y becomes -Z (bow forward).
  geo.rotateX(-Math.PI / 2);
  return geo;
}

/** A curved sail surface spanning four corners (a triangle when two corners coincide). */
function sailGeometry(p00: THREE.Vector3, p10: THREE.Vector3, p01: THREE.Vector3, p11: THREE.Vector3, belly: number, segments = 8): THREE.BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const p = new THREE.Vector3();
  // Belly direction: normal of the sail plane.
  const normal = new THREE.Vector3().subVectors(p10, p00).cross(new THREE.Vector3().subVectors(p01, p00)).normalize();
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    for (let j = 0; j <= segments; j++) {
      const v = j / segments;
      a.lerpVectors(p00, p10, u);
      b.lerpVectors(p01, p11, u);
      p.lerpVectors(a, b, v);
      const bulge = Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * belly;
      p.addScaledVector(normal, bulge);
      positions.push(p.x, p.y, p.z);
      uvs.push(u, v);
    }
  }
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segments; j++) {
      const k = i * (segments + 1) + j;
      indices.push(k, k + 1, k + segments + 1, k + 1, k + segments + 2, k + segments + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

const materials = {
  hullDark: new THREE.MeshStandardMaterial({ color: "#1d2a3a", roughness: 0.6, metalness: 0.3 }),
  hullRed: new THREE.MeshStandardMaterial({ color: "#7a2e24", roughness: 0.7, metalness: 0.2 }),
  deck: new THREE.MeshStandardMaterial({ color: "#3b4a5a", roughness: 0.9 }),
  white: new THREE.MeshStandardMaterial({ color: "#e8eef3", roughness: 0.5 }),
  glass: new THREE.MeshStandardMaterial({ color: "#1d3b52", roughness: 0.2, metalness: 0.6 }),
  funnel: new THREE.MeshStandardMaterial({ color: "#c9d1d9", roughness: 0.5 }),
  wood: new THREE.MeshStandardMaterial({ color: "#6b4a2b", roughness: 0.85 }),
  woodDark: new THREE.MeshStandardMaterial({ color: "#3f2a16", roughness: 0.9 }),
  woodLight: new THREE.MeshStandardMaterial({ color: "#a67c4e", roughness: 0.85 }),
  mast: new THREE.MeshStandardMaterial({ color: "#4a3520", roughness: 0.8 }),
  sail: new THREE.MeshStandardMaterial({ color: "#e9dcc3", roughness: 0.95, side: THREE.DoubleSide }),
  sailDark: new THREE.MeshStandardMaterial({ color: "#c9b48a", roughness: 0.95, side: THREE.DoubleSide }),
  rope: new THREE.MeshStandardMaterial({ color: "#2a1d10", roughness: 1 }),
};

// ---------------------------------------------------------------------------
// Modern container ship

function ContainerShip({ length, accent, seed, large }: { length: number; accent: string; seed: string; large: boolean }) {
  const beam = length / (large ? 6.2 : 6.8);
  const height = length / 13;
  const draft = height * 0.45;
  const hull = useMemo(() => hullGeometry(length, beam, height, 0.28, 0, true), [length, beam, height]);
  const bulb = useMemo(() => new THREE.SphereGeometry(beam * 0.12, 10, 8), [beam]);

  // Container stacks as a single instanced mesh.
  const containers = useMemo(() => {
    const rng = createRandom(`${seed}:containers`);
    const unitL = 6.1;
    const unitW = 2.55;
    const unitH = 2.6;
    const rows = Math.max(3, Math.floor((beam * 0.9) / unitW));
    const superLen = length * 0.11;
    const bayStart = -length / 2 + superLen + length * 0.06;
    const bayEnd = length / 2 - length * 0.2;
    const bays = Math.floor((bayEnd - bayStart) / (unitL + 0.6));
    const palette = ["#c0392b", "#2e86de", "#27ae60", "#f39c12", "#8e44ad", "#16a085", "#7f8c8d", "#d35400", accent];
    const items: Array<{ pos: [number, number, number]; color: string }> = [];
    const maxTiers = large ? 6 : 4;
    for (let bay = 0; bay < bays; bay++) {
      const yPlan = bayStart + bay * (unitL + 0.6) + unitL / 2; // plan-view length axis (bow at +)
      const z = -yPlan; // bow toward -z
      const bayTier = Math.max(1, Math.round(maxTiers * (0.5 + 0.5 * Math.sin((bay / bays) * Math.PI))) - rng.int(0, 1));
      for (let r = 0; r < rows; r++) {
        const x = (r - (rows - 1) / 2) * unitW;
        const tiers = Math.max(0, bayTier - (r === 0 || r === rows - 1 ? rng.int(0, 1) : 0));
        for (let t = 0; t < tiers; t++) {
          items.push({ pos: [x, height * 0.55 + unitH / 2 + t * unitH, z], color: rng.pick(palette) });
        }
      }
    }
    return items;
  }, [length, beam, height, seed, accent, large]);

  const instanced = useMemo(() => {
    const geo = new THREE.BoxGeometry(2.5, 2.55, 6.0);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.15 });
    const mesh = new THREE.InstancedMesh(geo, mat, containers.length);
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    containers.forEach((item, i) => {
      m.makeTranslation(item.pos[0], item.pos[1], item.pos[2]);
      mesh.setMatrixAt(i, m);
      c.set(item.color);
      mesh.setColorAt(i, c);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.castShadow = true;
    return mesh;
  }, [containers]);

  const superLen = length * 0.11;
  const superZ = length / 2 - superLen / 2 - length * 0.02;

  return (
    <group>
      {/* hull */}
      <mesh geometry={hull} material={materials.hullDark} position={[0, -draft, 0]} castShadow receiveShadow />
      <mesh position={[0, -draft * 0.9, -length / 2 + beam * 0.1]} geometry={bulb} material={materials.hullRed} />
      {/* deck plating */}
      <mesh position={[0, height * 0.56, length * 0.03]} receiveShadow>
        <boxGeometry args={[beam * 0.92, 0.4, length * 0.9]} />
        <primitive object={materials.deck} attach="material" />
      </mesh>
      {/* bulwarks */}
      <mesh position={[beam * 0.47, height * 0.62 + 0.8, 0]}>
        <boxGeometry args={[0.3, 1.6, length * 0.86]} />
        <primitive object={materials.hullDark} attach="material" />
      </mesh>
      <mesh position={[-beam * 0.47, height * 0.62 + 0.8, 0]}>
        <boxGeometry args={[0.3, 1.6, length * 0.86]} />
        <primitive object={materials.hullDark} attach="material" />
      </mesh>
      <primitive object={instanced} />
      {/* accommodation block aft */}
      <group position={[0, height * 0.6, superZ]}>
        <mesh position={[0, height * 0.9, 0]} castShadow>
          <boxGeometry args={[beam * 0.78, height * 1.8, superLen]} />
          <primitive object={materials.white} attach="material" />
        </mesh>
        <mesh position={[0, height * 2.1, -superLen * 0.1]} castShadow>
          <boxGeometry args={[beam * 1.05, height * 0.55, superLen * 0.7]} />
          <primitive object={materials.white} attach="material" />
        </mesh>
        <mesh position={[0, height * 2.1, -superLen * 0.46]}>
          <boxGeometry args={[beam * 1.0, height * 0.3, 0.3]} />
          <primitive object={materials.glass} attach="material" />
        </mesh>
        <mesh position={[0, height * 2.95, superLen * 0.2]} castShadow>
          <cylinderGeometry args={[beam * 0.07, beam * 0.1, height * 1.2, 12]} />
          <primitive object={materials.funnel} attach="material" />
        </mesh>
        <mesh position={[0, height * 2.95 + height * 0.62, superLen * 0.2]}>
          <cylinderGeometry args={[beam * 0.075, beam * 0.075, 0.6, 12]} />
          <meshStandardMaterial color={accent} />
        </mesh>
        <mesh position={[0, height * 2.6, -superLen * 0.1]}>
          <cylinderGeometry args={[0.15, 0.2, height * 1.4, 6]} />
          <primitive object={materials.funnel} attach="material" />
        </mesh>
      </group>
      {/* forecastle and foremast */}
      <mesh position={[0, height * 0.75, -length / 2 + length * 0.07]} castShadow>
        <boxGeometry args={[beam * 0.6, height * 0.35, length * 0.08]} />
        <primitive object={materials.white} attach="material" />
      </mesh>
      <mesh position={[0, height * 1.6, -length / 2 + length * 0.07]}>
        <cylinderGeometry args={[0.12, 0.18, height * 1.6, 6]} />
        <primitive object={materials.funnel} attach="material" />
      </mesh>
      {/* nav lights */}
      <mesh position={[beam * 0.52, height * 2.6, superZ]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshBasicMaterial color="#2ecc71" />
      </mesh>
      <mesh position={[-beam * 0.52, height * 2.6, superZ]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshBasicMaterial color="#e74c3c" />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Ninth-century sewn-plank ship: double-ended hull, raked masts, lateen-style sails.

function SewnPlankShip({ length, sailYaw, sailSet, masts, accent }: { length: number; sailYaw: number; sailSet: number; masts: number; accent: string }) {
  const beam = length / 3.6;
  const height = length / 9;
  const draft = height * 0.5;
  const hull = useMemo(() => hullGeometry(length, beam, height, 0.32, 0.28, true), [length, beam, height]);
  const mastPositions = masts === 2 ? [length * 0.12, -length * 0.25] : [0];
  return (
    <group>
      <mesh geometry={hull} material={materials.wood} position={[0, -draft, 0]} castShadow receiveShadow />
      {/* planking lines */}
      {[0.25, 0.5, 0.75].map((f) => (
        <mesh key={f} position={[0, -draft + height * f, 0]}>
          <boxGeometry args={[beam * 1.01, 0.08, length * 0.78]} />
          <primitive object={materials.woodDark} attach="material" />
        </mesh>
      ))}
      <mesh position={[0, height * 0.52, 0]} receiveShadow>
        <boxGeometry args={[beam * 0.86, 0.3, length * 0.74]} />
        <primitive object={materials.woodLight} attach="material" />
      </mesh>
      {/* raised stern platform */}
      <mesh position={[0, height * 0.75, length * 0.33]} castShadow>
        <boxGeometry args={[beam * 0.7, height * 0.35, length * 0.16]} />
        <primitive object={materials.woodLight} attach="material" />
      </mesh>
      {/* steering oar */}
      <mesh position={[beam * 0.5, height * 0.3, length * 0.42]} rotation={[0.5, 0, 0.25]}>
        <boxGeometry args={[0.25, length * 0.3, 0.6]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>
      {mastPositions.map((z, i) => (
        <LateenRig key={i} z={z} mastHeight={length * (i === 0 ? 0.95 : 0.7)} yardLength={length * (i === 0 ? 1.05 : 0.75)} sailYaw={sailYaw} sailSet={sailSet} accent={accent} />
      ))}
    </group>
  );
}

function LateenRig({ z, mastHeight, yardLength, sailYaw, sailSet, accent }: { z: number; mastHeight: number; yardLength: number; sailYaw: number; sailSet: number; accent: string }) {
  const sail = useMemo(() => {
    // Yard slopes from low forward to high aft; sail hangs from it to a clew near the deck aft.
    const peak = new THREE.Vector3(0, mastHeight * 0.98, yardLength * 0.42);
    const tack = new THREE.Vector3(0, mastHeight * 0.18, -yardLength * 0.5);
    const clew = new THREE.Vector3(0, mastHeight * 0.1, yardLength * 0.46);
    return sailGeometry(tack, peak, clew, clew, 1.6 * sailSet, 10);
  }, [mastHeight, yardLength, sailSet]);
  const yardDir = useMemo(() => new THREE.Vector3(0, mastHeight * 0.8, yardLength * 0.92), [mastHeight, yardLength]);
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, mastHeight / 2, 0]} rotation={[0.08, 0, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.3, mastHeight, 8]} />
        <primitive object={materials.mast} attach="material" />
      </mesh>
      <group rotation={[0, (sailYaw * Math.PI) / 180, 0]}>
        {/* yard */}
        <mesh position={[0, mastHeight * 0.58, -yardLength * 0.04]} rotation={[Math.atan2(yardDir.z, yardDir.y) * -1 + Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.12, yardLength, 6]} />
          <primitive object={materials.mast} attach="material" />
        </mesh>
        <mesh geometry={sail} material={materials.sail} scale={[1, sailSet > 0.05 ? 1 : 0.02, 1]} castShadow />
        {/* pennant */}
        <mesh position={[0, mastHeight * 1.02, 0]}>
          <boxGeometry args={[0.05, 0.6, 2.2]} />
          <meshStandardMaterial color={accent} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Fifteenth-century jong: multi-layered hull, two or three masts with tilted rectangular sails, quarter rudders.

function Jong({ length, sailYaw, sailSet, accent }: { length: number; sailYaw: number; sailSet: number; accent: string }) {
  const beam = length / 3.2;
  const height = length / 8;
  const draft = height * 0.5;
  const hull = useMemo(() => hullGeometry(length, beam, height, 0.3, 0.3, true), [length, beam, height]);
  const mastZ = length >= 40 ? [length * 0.22, -length * 0.08, -length * 0.32] : [length * 0.15, -length * 0.22];
  return (
    <group>
      <mesh geometry={hull} material={materials.woodDark} position={[0, -draft, 0]} castShadow receiveShadow />
      <mesh position={[0, height * 0.52, 0]} receiveShadow>
        <boxGeometry args={[beam * 0.88, 0.35, length * 0.8]} />
        <primitive object={materials.woodLight} attach="material" />
      </mesh>
      {/* deckhouse */}
      <mesh position={[0, height * 0.95, length * 0.05]} castShadow>
        <boxGeometry args={[beam * 0.6, height * 0.6, length * 0.3]} />
        <primitive object={materials.wood} attach="material" />
      </mesh>
      <mesh position={[0, height * 1.3, length * 0.05]} castShadow>
        <boxGeometry args={[beam * 0.72, 0.2, length * 0.34]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>
      {/* raised bow and stern */}
      <mesh position={[0, height * 0.7, -length * 0.42]} castShadow>
        <boxGeometry args={[beam * 0.5, height * 0.4, length * 0.1]} />
        <primitive object={materials.wood} attach="material" />
      </mesh>
      <mesh position={[0, height * 0.85, length * 0.4]} castShadow>
        <boxGeometry args={[beam * 0.7, height * 0.6, length * 0.14]} />
        <primitive object={materials.wood} attach="material" />
      </mesh>
      {/* quarter rudders */}
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * beam * 0.5, -draft * 0.3, length * 0.4]} rotation={[0.35, 0, s * 0.2]}>
          <boxGeometry args={[0.3, height * 1.6, 1.4]} />
          <primitive object={materials.woodDark} attach="material" />
        </mesh>
      ))}
      {mastZ.map((z, i) => (
        <TanjaRig key={i} z={z} mastHeight={length * (i === 1 ? 0.8 : 0.62)} width={beam * 1.7} sailYaw={sailYaw} sailSet={sailSet} accent={accent} />
      ))}
    </group>
  );
}

/** Tilted rectangular (tanja-style) sail on a forward-raked yard. */
function TanjaRig({ z, mastHeight, width, sailYaw, sailSet, accent }: { z: number; mastHeight: number; width: number; sailYaw: number; sailSet: number; accent: string }) {
  const sail = useMemo(() => {
    const topFwd = new THREE.Vector3(0, mastHeight * 0.95, -width * 0.55);
    const topAft = new THREE.Vector3(0, mastHeight * 0.7, width * 0.45);
    const botFwd = new THREE.Vector3(0, mastHeight * 0.32, -width * 0.42);
    const botAft = new THREE.Vector3(0, mastHeight * 0.12, width * 0.5);
    return sailGeometry(topFwd, topAft, botFwd, botAft, 1.4 * sailSet, 8);
  }, [mastHeight, width, sailSet]);
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, mastHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.32, mastHeight, 8]} />
        <primitive object={materials.mast} attach="material" />
      </mesh>
      <group rotation={[0, (sailYaw * Math.PI) / 180, 0]}>
        <mesh position={[0, mastHeight * 0.83, -width * 0.05]} rotation={[Math.PI / 2 - Math.atan2(mastHeight * 0.25, width), 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, width * 1.05, 6]} />
          <primitive object={materials.mast} attach="material" />
        </mesh>
        <mesh position={[0, mastHeight * 0.22, width * 0.04]} rotation={[Math.PI / 2 - Math.atan2(mastHeight * 0.2, width), 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, width * 0.95, 6]} />
          <primitive object={materials.mast} attach="material" />
        </mesh>
        <mesh geometry={sail} material={materials.sailDark} scale={[1, sailSet > 0.05 ? 1 : 0.02, 1]} castShadow />
        <mesh position={[0, mastHeight * 1.0, 0]}>
          <boxGeometry args={[0.05, 0.5, 2]} />
          <meshStandardMaterial color={accent} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// Lancaran: low, fast hull with oars and a single sail.

function Lancaran({ length, sailYaw, sailSet, accent }: { length: number; sailYaw: number; sailSet: number; accent: string }) {
  const beam = length / 4.5;
  const height = length / 11;
  const draft = height * 0.5;
  const hull = useMemo(() => hullGeometry(length, beam, height, 0.35, 0.3, true), [length, beam, height]);
  const oars = useMemo(() => Array.from({ length: 6 }, (_, i) => -length * 0.3 + i * length * 0.1), [length]);
  return (
    <group>
      <mesh geometry={hull} material={materials.wood} position={[0, -draft, 0]} castShadow receiveShadow />
      <mesh position={[0, height * 0.52, 0]}>
        <boxGeometry args={[beam * 0.85, 0.25, length * 0.8]} />
        <primitive object={materials.woodLight} attach="material" />
      </mesh>
      {oars.map((z) =>
        [1, -1].map((s) => (
          <mesh key={`${z}-${s}`} position={[s * beam * 0.75, height * 0.2, z]} rotation={[0, 0, s * 0.55]}>
            <boxGeometry args={[beam * 0.9, 0.12, 0.25]} />
            <primitive object={materials.woodDark} attach="material" />
          </mesh>
        )),
      )}
      <mesh position={[0, height * 0.8, length * 0.36]} castShadow>
        <boxGeometry args={[beam * 0.6, height * 0.5, length * 0.14]} />
        <primitive object={materials.wood} attach="material" />
      </mesh>
      <TanjaRig z={-length * 0.05} mastHeight={length * 0.7} width={beam * 2.2} sailYaw={sailYaw} sailSet={sailSet} accent={accent} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// Hybrid junk: flat transom, high poop, battened lug sails.

function Junk({ length, sailYaw, sailSet, accent }: { length: number; sailYaw: number; sailSet: number; accent: string }) {
  const beam = length / 3.4;
  const height = length / 7.5;
  const draft = height * 0.5;
  const hull = useMemo(() => hullGeometry(length, beam, height, 0.22, 0, true), [length, beam, height]);
  const mastZ = [length * 0.25, -length * 0.05, -length * 0.3];
  return (
    <group>
      <mesh geometry={hull} material={materials.woodDark} position={[0, -draft, 0]} castShadow receiveShadow />
      <mesh position={[0, height * 0.52, 0]}>
        <boxGeometry args={[beam * 0.9, 0.35, length * 0.86]} />
        <primitive object={materials.woodLight} attach="material" />
      </mesh>
      {/* high poop deck */}
      <mesh position={[0, height * 1.05, length * 0.36]} castShadow>
        <boxGeometry args={[beam * 0.95, height * 1.0, length * 0.22]} />
        <primitive object={materials.wood} attach="material" />
      </mesh>
      <mesh position={[0, height * 1.6, length * 0.4]} castShadow>
        <boxGeometry args={[beam * 1.0, 0.25, length * 0.26]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>
      {/* stern rudder */}
      <mesh position={[0, -draft * 0.4, length * 0.5]}>
        <boxGeometry args={[0.4, height * 1.8, 1.6]} />
        <primitive object={materials.woodDark} attach="material" />
      </mesh>
      {mastZ.map((z, i) => (
        <BattenedRig key={i} z={z} mastHeight={length * (i === 1 ? 0.78 : i === 0 ? 0.55 : 0.6)} width={beam * (i === 1 ? 1.5 : 1.1)} sailYaw={sailYaw} sailSet={sailSet} accent={accent} />
      ))}
    </group>
  );
}

function BattenedRig({ z, mastHeight, width, sailYaw, sailSet, accent }: { z: number; mastHeight: number; width: number; sailYaw: number; sailSet: number; accent: string }) {
  const sail = useMemo(() => {
    const topFwd = new THREE.Vector3(0, mastHeight * 0.96, -width * 0.3);
    const topAft = new THREE.Vector3(0, mastHeight * 0.88, width * 0.45);
    const botFwd = new THREE.Vector3(0, mastHeight * 0.22, -width * 0.42);
    const botAft = new THREE.Vector3(0, mastHeight * 0.18, width * 0.55);
    return sailGeometry(topFwd, topAft, botFwd, botAft, 0.9 * sailSet, 8);
  }, [mastHeight, width, sailSet]);
  const battens = [0.22, 0.37, 0.52, 0.67, 0.82, 0.96];
  return (
    <group position={[0, 0, z]}>
      <mesh position={[0, mastHeight / 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, mastHeight, 8]} />
        <primitive object={materials.mast} attach="material" />
      </mesh>
      <group rotation={[0, (sailYaw * Math.PI) / 180, 0]}>
        <mesh geometry={sail} material={materials.sailDark} scale={[1, sailSet > 0.05 ? 1 : 0.02, 1]} castShadow />
        {sailSet > 0.05 &&
          battens.map((f) => (
            <mesh key={f} position={[0, mastHeight * f, width * 0.06]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.07, 0.07, width * 0.95, 5]} />
              <primitive object={materials.rope} attach="material" />
            </mesh>
          ))}
        <mesh position={[0, mastHeight * 1.02, 0]}>
          <boxGeometry args={[0.05, 0.5, 2]} />
          <meshStandardMaterial color={accent} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
