import { describe, expect, it } from "vitest";
import { requireShipClass } from "@/data";
import { stepKinematics, type Kinematics } from "@/engine/ship";
import { sailEfficiency, isInIrons } from "@/engine/wind";
import { computeAutopilot, advanceWaypoint, hasArrived } from "@/engine/autopilot";
import { distanceNm } from "@/engine/geo";

const feeder = requireShipClass("feeder_1000");
const sewn = requireShipClass("ship_sewn_ocean");

function run(k: Kinematics, seconds: number, step = 10) {
  let state = k;
  let fuel = 0;
  for (let t = 0; t < seconds; t += step) {
    const r = stepKinematics(feeder, state, step, null);
    state = r.kinematics;
    fuel += r.endurance_used;
  }
  return { state, fuel };
}

describe("ship kinematics", () => {
  const start: Kinematics = { position: { lat: 3, lon: 101 }, heading: 90, speed_knots: 0, throttle: 1, rudder: 0 };

  it("accelerates gradually toward the throttle target and never exceeds max speed", () => {
    const after10 = stepKinematics(feeder, start, 10, null).kinematics;
    expect(after10.speed_knots).toBeGreaterThan(0);
    expect(after10.speed_knots).toBeLessThan(feeder.max_speed_knots);
    expect(after10.speed_knots).toBeCloseTo(feeder.acceleration_knots_per_s * 10, 5);
    const { state } = run(start, 1200);
    expect(state.speed_knots).toBeCloseTo(feeder.max_speed_knots, 3);
  });

  it("decelerates gradually when throttle is cut", () => {
    const cruising: Kinematics = { ...start, speed_knots: 18, throttle: 0 };
    const after = stepKinematics(feeder, cruising, 10, null).kinematics;
    expect(after.speed_knots).toBeLessThan(18);
    expect(after.speed_knots).toBeGreaterThan(0);
  });

  it("turns in the rudder direction and turn rate scales with speed", () => {
    const moving: Kinematics = { ...start, speed_knots: 18, rudder: 1 };
    const turned = stepKinematics(feeder, moving, 10, null).kinematics;
    expect(turned.heading).toBeGreaterThan(90);
    const left = stepKinematics(feeder, { ...moving, rudder: -1 }, 10, null).kinematics;
    expect(left.heading).toBeLessThan(90);
    const slow = stepKinematics(feeder, { ...moving, speed_knots: 2 }, 10, null).kinematics;
    expect(slow.heading - 90).toBeLessThan(turned.heading - 90);
  });

  it("moves along its heading, so an eastbound ship gains longitude not latitude", () => {
    const { state } = run(start, 3600);
    expect(state.position.lon).toBeGreaterThan(101);
    expect(Math.abs(state.position.lat - 3)).toBeLessThan(0.01);
  });

  it("burns fuel following a cube law", () => {
    const full = run({ ...start, speed_knots: 18 }, 86400, 60).fuel;
    const half = run({ ...start, speed_knots: 9, throttle: 0.5 }, 86400, 60).fuel;
    expect(full).toBeCloseTo(feeder.consumption_per_day_at_max, 0);
    expect(half).toBeLessThan(full * 0.25);
  });

  it("cannot make way with an empty tank", () => {
    const r = stepKinematics(feeder, { ...start, speed_knots: 10 }, 60, null, undefined, true);
    expect(r.kinematics.speed_knots).toBeLessThan(10);
  });
});

describe("sailing vessels and wind", () => {
  it("cannot sail into the wind but runs well downwind", () => {
    const wind = { from: 45, speed_knots: 15 };
    expect(isInIrons(45, wind, 65)).toBe(true);
    expect(sailEfficiency(45, wind, 65)).toBeLessThan(0.15);
    expect(sailEfficiency(225, wind, 65)).toBeGreaterThan(0.7);
    expect(sailEfficiency(135, wind, 65)).toBeGreaterThan(sailEfficiency(80, wind, 65));
  });

  it("a sewn-plank ship sailing downwind reaches a speed scaled by the wind", () => {
    const k: Kinematics = { position: { lat: 27, lon: 52 }, heading: 180, speed_knots: 0, throttle: 1, rudder: 0 };
    let state = k;
    for (let t = 0; t < 3600; t += 10) state = stepKinematics(sewn, state, 10, { from: 0, speed_knots: 15 }).kinematics;
    expect(state.speed_knots).toBeGreaterThan(3);
    expect(state.speed_knots).toBeLessThanOrEqual(sewn.max_speed_knots * 1.15);
  });
});

describe("autopilot", () => {
  const route = [
    { lat: 3, lon: 101, port_id: "a" },
    { lat: 2.5, lon: 102 },
    { lat: 1.3, lon: 103.8, port_id: "b" },
  ];

  it("steers toward the next waypoint", () => {
    const ap = computeAutopilot(feeder, { lat: 3, lon: 101 }, 0, 10, route[1]!, false, null, 0);
    expect(ap.rudder).toBeGreaterThan(0); // target is to the south-east, ship points north: turn right
    expect(ap.desired_heading).toBeGreaterThan(90);
    expect(ap.desired_heading).toBeLessThan(180);
  });

  it("advances past reached waypoints and detects arrival", () => {
    const adv = advanceWaypoint({ lat: 2.5, lon: 102.001 }, route, 1);
    expect(adv.index).toBe(2);
    expect(adv.reached).toHaveLength(1);
    expect(hasArrived({ lat: 1.3, lon: 103.8 }, route)).toBe(true);
    expect(hasArrived({ lat: 2.5, lon: 102 }, route)).toBe(false);
  });

  it("drives a ship all the way along a route with waypoint progression", () => {
    let k: Kinematics = { position: { lat: 3, lon: 101 }, heading: 90, speed_knots: 0, throttle: 1, rudder: 0 };
    let index = 1;
    let seconds = 0;
    while (index < route.length && seconds < 48 * 3600) {
      const target = route[index]!;
      const ap = computeAutopilot(feeder, k.position, k.heading, k.speed_knots, target, index === route.length - 1, null, seconds, 60);
      k = stepKinematics(feeder, { ...k, throttle: ap.throttle, rudder: ap.rudder }, 60, null).kinematics;
      const adv = advanceWaypoint(k.position, route, index);
      index = adv.index;
      seconds += 60;
    }
    expect(index).toBe(route.length);
    expect(distanceNm(k.position, route[2]!)).toBeLessThan(1);
    // ~190 nm at up to 18 knots should take well under a day
    expect(seconds).toBeLessThan(20 * 3600);
  });
});
