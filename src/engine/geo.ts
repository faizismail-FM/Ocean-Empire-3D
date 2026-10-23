/**
 * Geographic helpers. All angles in degrees, distances in nautical miles unless noted.
 * These are pure functions shared by the simulation, the global map and the 3D scene so
 * that positions stay consistent everywhere.
 */

export interface GeoPoint {
  lat: number;
  lon: number;
}

export const EARTH_RADIUS_NM = 3440.065;
export const EARTH_RADIUS_M = 6371008.8;
export const NM_IN_METERS = 1852;
export const KNOTS_TO_MS = NM_IN_METERS / 3600;

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export function toRadians(deg: number): number {
  return deg * DEG;
}

export function toDegrees(rad: number): number {
  return rad * RAD;
}

/** Normalise an angle to the range [0, 360). */
export function normalizeHeading(deg: number): number {
  const h = deg % 360;
  return h < 0 ? h + 360 : h;
}

/** Signed smallest difference from `from` to `to` in the range (-180, 180]. */
export function headingDifference(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/** Great-circle distance using the haversine formula, in nautical miles. */
export function distanceNm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLon = toRadians(b.lon - a.lon);
  const la1 = toRadians(a.lat);
  const la2 = toRadians(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_NM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  return distanceNm(a, b) * NM_IN_METERS / 1000;
}

/** Initial great-circle bearing from a to b, in degrees [0, 360). */
export function initialBearing(a: GeoPoint, b: GeoPoint): number {
  const la1 = toRadians(a.lat);
  const la2 = toRadians(b.lat);
  const dLon = toRadians(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(la2);
  const x = Math.cos(la1) * Math.sin(la2) - Math.sin(la1) * Math.cos(la2) * Math.cos(dLon);
  return normalizeHeading(toDegrees(Math.atan2(y, x)));
}

/** Point reached after travelling `distanceNm` along `bearing` from `start`. */
export function destinationPoint(start: GeoPoint, bearing: number, distance: number): GeoPoint {
  if (distance === 0) return { ...start };
  const delta = distance / EARTH_RADIUS_NM;
  const theta = toRadians(bearing);
  const la1 = toRadians(start.lat);
  const lo1 = toRadians(start.lon);
  const sinLat2 = Math.sin(la1) * Math.cos(delta) + Math.cos(la1) * Math.sin(delta) * Math.cos(theta);
  const la2 = Math.asin(Math.max(-1, Math.min(1, sinLat2)));
  const y = Math.sin(theta) * Math.sin(delta) * Math.cos(la1);
  const x = Math.cos(delta) - Math.sin(la1) * sinLat2;
  const lo2 = lo1 + Math.atan2(y, x);
  return { lat: toDegrees(la2), lon: normalizeLongitude(toDegrees(lo2)) };
}

export function normalizeLongitude(lon: number): number {
  let l = ((lon + 540) % 360) - 180;
  if (l === -180) l = 180;
  return l;
}

/** Great-circle interpolation. `t` in [0, 1]. */
export function interpolate(a: GeoPoint, b: GeoPoint, t: number): GeoPoint {
  if (t <= 0) return { ...a };
  if (t >= 1) return { ...b };
  const d = distanceNm(a, b);
  if (d < 1e-9) return { ...a };
  return destinationPoint(a, initialBearing(a, b), d * t);
}

/** Total length of a polyline of geographic points in nautical miles. */
export function pathLengthNm(points: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    if (a && b) total += distanceNm(a, b);
  }
  return total;
}

/**
 * Local tangent-plane projection used by the 3D sailing scene: metres east (x) and
 * north (y) of an origin point. Accurate enough for the few hundred kilometres of a
 * single voyage leg, which is all the local scene ever shows at once.
 */
export function toLocalMeters(origin: GeoPoint, point: GeoPoint): { x: number; y: number } {
  const metersPerDegLat = (Math.PI / 180) * EARTH_RADIUS_M;
  const metersPerDegLon = metersPerDegLat * Math.cos(toRadians(origin.lat));
  let dLon = point.lon - origin.lon;
  if (dLon > 180) dLon -= 360;
  if (dLon < -180) dLon += 360;
  return { x: dLon * metersPerDegLon, y: (point.lat - origin.lat) * metersPerDegLat };
}

export function fromLocalMeters(origin: GeoPoint, x: number, y: number): GeoPoint {
  const metersPerDegLat = (Math.PI / 180) * EARTH_RADIUS_M;
  const metersPerDegLon = metersPerDegLat * Math.cos(toRadians(origin.lat));
  return {
    lat: origin.lat + y / metersPerDegLat,
    lon: normalizeLongitude(origin.lon + x / metersPerDegLon),
  };
}

export function formatCoordinate(p: GeoPoint): string {
  const lat = `${Math.abs(p.lat).toFixed(2)}°${p.lat >= 0 ? "N" : "S"}`;
  const lon = `${Math.abs(p.lon).toFixed(2)}°${p.lon >= 0 ? "E" : "W"}`;
  return `${lat} ${lon}`;
}

export function compassLabel(heading: number): string {
  const labels = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(normalizeHeading(heading) / 22.5) % 16;
  return labels[idx] ?? "N";
}
