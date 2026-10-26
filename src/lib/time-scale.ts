/** Simulation speed presets shared by the top bar and the sailing HUD. */
export const TIME_SCALES = [1, 10, 60, 600, 3600] as const;

export function timeScaleLabel(scale: number): string {
  return `${scale}×`;
}

/** Plain-language meaning of a scale, for tooltips and the HUD caption. */
export function timeScaleHint(scale: number): string {
  if (scale <= 1) return "Real time";
  if (scale < 60) return `${scale} game seconds per second`;
  if (scale < 3600) return scale === 60 ? "1 game minute per second" : `${Math.round(scale / 60)} game minutes per second`;
  return scale === 3600 ? "1 game hour per second" : `${Math.round(scale / 3600)} game hours per second`;
}
