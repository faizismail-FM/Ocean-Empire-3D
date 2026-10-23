"use client";

import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { CameraMode } from "@/store/settings-store";
import { getSceneFrame, viewState } from "./scene-state";

/**
 * Three camera behaviours: a smoothed chase camera behind the ship, a free orbit camera
 * whose target follows the ship, and a north-up overhead navigation camera.
 */
export function CameraRig({ mode }: { mode: CameraMode }) {
  const { camera } = useThree();
  const orbit = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const target = useRef(new THREE.Vector3());
  const desired = useRef(new THREE.Vector3());
  const offset = useRef(new THREE.Vector3(0, 60, 220));
  const initialized = useRef(false);

  useEffect(() => {
    initialized.current = false;
  }, [mode]);

  useFrame((_, dt) => {
    const frame = getSceneFrame();
    const s = frame.ship;
    const L = s.length;
    const zoom = viewState.distance;
    target.current.set(s.x, s.y + L * 0.06, s.z);
    const smoothing = initialized.current ? 1 - Math.exp(-dt * 3.2) : 1;

    if (mode === "chase") {
      // Smooth the camera's OFFSET from the ship, never its absolute position: at high time
      // acceleration the ship covers hundreds of metres per real second and an absolute lerp
      // would lag far behind it.
      const h = (s.heading * Math.PI) / 180;
      const back = (L * 1.9 + 15) * zoom;
      const up = (L * 0.8 + 9) * zoom;
      desired.current.set(-Math.sin(h) * back, up, Math.cos(h) * back);
      offset.current.lerp(desired.current, smoothing);
      camera.position.set(s.x + offset.current.x, s.y + offset.current.y, s.z + offset.current.z);
      camera.up.set(0, 1, 0);
      camera.lookAt(s.x + Math.sin(h) * L * 0.3, s.y + L * 0.05, s.z - Math.cos(h) * L * 0.3);
    } else if (mode === "overhead") {
      const height = (L * 7 + 80) * zoom;
      desired.current.set(0, height, 0.01);
      offset.current.lerp(desired.current, smoothing);
      camera.position.set(s.x + offset.current.x, offset.current.y, s.z + offset.current.z);
      camera.up.set(0, 0, -1); // north up
      camera.lookAt(s.x, 0, s.z);
    } else if (orbit.current) {
      // Free camera: keep the orbit target glued to the ship, preserve the user's offset.
      const controls = orbit.current;
      const userOffset = new THREE.Vector3().subVectors(camera.position, controls.target);
      if (!initialized.current || viewState.resetRequested) {
        const h = (s.heading * Math.PI) / 180;
        userOffset.set(-Math.sin(h) * L * 1.5 - L * 0.8, L * 0.6 + 15, Math.cos(h) * L * 1.5);
        viewState.resetRequested = false;
      }
      controls.target.copy(target.current);
      camera.position.copy(target.current).add(userOffset);
      camera.up.set(0, 1, 0);
      controls.update();
    }
    if (viewState.resetRequested && mode !== "free") viewState.resetRequested = false;
    initialized.current = true;
  });

  if (mode === "free") {
    return <OrbitControls ref={orbit} enablePan={false} minDistance={20} maxDistance={2500} maxPolarAngle={Math.PI / 2 - 0.03} makeDefault />;
  }
  return null;
}
