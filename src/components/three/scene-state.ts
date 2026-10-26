import * as THREE from "three";
import type { GeoPoint } from "@/engine/geo";
import type { Wind } from "@/engine/wind";
import { createWavePhases, type WavePhases } from "./waves";

/**
 * Per-frame scene state shared between 3D components without React re-renders. The
 * SailingScene updates it once per frame from the game store; components read it in
 * their own useFrame callbacks.
 */
export interface SceneFrame {
  /** Floating origin for the local tangent plane. */
  origin: GeoPoint;
  /** Player ship position in scene metres (x east, z south). */
  ship: { x: number; z: number; heading: number; speed: number; length: number; y: number; pitch: number; roll: number };
  /**
   * Metres the ship would have covered this frame at its real speed (not time-scaled).
   * Effects that should look right at any time acceleration (wake, foam) move by this.
   */
  realStep: { x: number; z: number };
  /** Per-component wave phases; see waves.ts for why these replace a shared clock. */
  wavePhases: WavePhases;
  /** Real seconds the scene has been animating (buoy rocking, foam flicker). */
  waveClock: number;
  waveAmp: number;
  wind: Wind;
  sunDir: THREE.Vector3;
  sunColor: THREE.Color;
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  sunElevation: number;
  timeScale: number;
  paused: boolean;
  /** Simulated seconds, for effects that should age in game time (wake). */
  simSeconds: number;
}

const frame: SceneFrame = {
  origin: { lat: 0, lon: 0 },
  ship: { x: 0, z: 0, heading: 0, speed: 0, length: 100, y: 0, pitch: 0, roll: 0 },
  realStep: { x: 0, z: 0 },
  wavePhases: createWavePhases(),
  waveClock: 0,
  waveAmp: 1,
  wind: { from: 0, speed_knots: 0 },
  sunDir: new THREE.Vector3(0.3, 0.6, 0.4).normalize(),
  sunColor: new THREE.Color("#fff1d0"),
  skyColor: new THREE.Color("#8fc6e8"),
  fogColor: new THREE.Color("#9fcbe6"),
  sunElevation: 40,
  timeScale: 1,
  paused: false,
  simSeconds: 0,
};

export function getSceneFrame(): SceneFrame {
  return frame;
}

/** Camera view state controlled from the HUD (zoom, reset) and read by the camera rig. */
export const viewState = {
  distance: 1,
  resetRequested: false,
  zoom(delta: number) {
    this.distance = Math.min(3.5, Math.max(0.4, this.distance * (delta > 0 ? 1.15 : 1 / 1.15)));
  },
  reset() {
    this.distance = 1;
    this.resetRequested = true;
  },
};

/** Geo → scene conversion (x east, z south) relative to the floating origin. */
export function geoToScene(origin: GeoPoint, p: GeoPoint): { x: number; z: number } {
  const metersPerDegLat = 111_194.9;
  const metersPerDegLon = metersPerDegLat * Math.cos((origin.lat * Math.PI) / 180);
  let dLon = p.lon - origin.lon;
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  return { x: dLon * metersPerDegLon, z: -(p.lat - origin.lat) * metersPerDegLat };
}

export function headingToRotationY(headingDeg: number): number {
  return -(headingDeg * Math.PI) / 180;
}
