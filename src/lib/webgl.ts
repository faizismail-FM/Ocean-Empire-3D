"use client";

import { useSyncExternalStore } from "react";

let cache: boolean | null = null;

/** Whether this browser can create a WebGL context (checked once, client only). */
export function webglAvailable(): boolean {
  if (cache !== null) return cache;
  try {
    const canvas = document.createElement("canvas");
    cache = !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    cache = false;
  }
  return cache;
}

const noopSubscribe = () => () => {};

/** `null` during server rendering and hydration, then the WebGL availability. */
export function useWebGL(): boolean | null {
  return useSyncExternalStore(noopSubscribe, webglAvailable, () => null);
}
