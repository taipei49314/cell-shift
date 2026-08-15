import { describe, expect, it } from "vitest";
import { experimentHash } from "./experiment";
import { livingShares } from "./morphology";
import { restoreTo } from "./snapshot";
import { DEFAULT_ENV, DEFAULT_RULES } from "./types";
import { createWorld, replayTo, seekTo, step } from "./world";

describe("clone SHIFT", () => {
  it("enters the experiment hash", () => {
    const base = { seed: 1, env: DEFAULT_ENV, rules: DEFAULT_RULES };
    const a = experimentHash(base);
    const b = experimentHash({
      ...base,
      shift: { cloneId: "C1", deltas: { cycle_rate: 0.2 } },
    });
    expect(a).not.toBe(b);
    expect(
      experimentHash({ ...base, shift: { cloneId: "C1", deltas: { cycle_rate: 0.2 } } }),
    ).toBe(b);
  });

  it("same seed + same SHIFT replays the same tissue", () => {
    const shift = { cloneId: "C1" as const, deltas: { cycle_rate: 0.3 } };
    const a = replayTo({ seed: 21, shift }, 40);
    const b = replayTo({ seed: 21, shift }, 40);
    expect(a.cells.map((c) => `${c.id}:${c.pos[0].toFixed(3)}`).join("|")).toBe(
      b.cells.map((c) => `${c.id}:${c.pos[0].toFixed(3)}`).join("|"),
    );
  });

  it("does not apply C1 SHIFT to a new mutant clone", () => {
    const world = createWorld({
      seed: 4,
      founders: 2,
      env: { oxygen: 1, nutrient: 1, mutationRate: 1 },
      rules: { cycleHours: 10, deathRate: 0.01, adhesion: 0.7, motility: 0.04 },
      shift: { cloneId: "C1", deltas: { cycle_rate: 0.4 } },
    });
    for (let i = 0; i < 40; i++) step(world);
    const mutant = world.cells.find((c) => c.cloneId !== "C1");
    expect(mutant).toBeTruthy();
    expect(mutant!.traits.cycleTime).toBeGreaterThan(8);
    const c1 = world.cells.find((c) => c.cloneId === "C1")!;
    expect(c1.traits.cycleTime).toBe(10);
  });

  it("C1 faster cycle raises C1 share against an unshifted C2", () => {
    const env = { oxygen: 0.9, nutrient: 0.95, mutationRate: 0 };
    const rules = { cycleHours: 12, deathRate: 0.02, adhesion: 0.65, motility: 0.04 };
    const shifted = createWorld({
      seed: 8,
      founders: 12,
      env,
      rules,
      shift: { cloneId: "C1", deltas: { cycle_rate: 0.45 } },
    });
    const plain = createWorld({ seed: 8, founders: 12, env, rules, shift: null });
    for (const world of [shifted, plain]) {
      for (let i = 6; i < world.cells.length; i++) world.cells[i]!.cloneId = "C2";
      for (let t = 0; t < 90; t++) step(world);
    }
    const share = (world: typeof shifted) =>
      livingShares(world.cells).find((s) => s.cloneId === "C1")?.share ?? 0;
    expect(share(shifted)).toBeGreaterThan(share(plain));
  });
});

describe("snapshot seek", () => {
  it("restores a recorded frame without replaying from t=0", () => {
    const world = createWorld({ seed: 3, env: { oxygen: 0.9, nutrient: 0.9, mutationRate: 0 } });
    for (let i = 0; i < 24; i++) step(world);
    const at12 = world.frames.find((f) => f.hours === 12);
    expect(at12).toBeTruthy();
    const ids = at12!.cells.map((c) => c.id);
    const ok = restoreTo(world, 12);
    expect(ok).toBe(true);
    expect(world.hours).toBe(12);
    expect(world.cells.map((c) => c.id)).toEqual(ids);
    expect(world.frames.every((f) => f.hours <= 12)).toBe(true);
  });

  it("seekTo walks forward from a snapshot, not from seed", () => {
    const world = createWorld({ seed: 9 });
    for (let i = 0; i < 30; i++) step(world);
    const cellsAt30 = world.cells.length;
    seekTo(world, 12);
    expect(world.hours).toBe(12);
    expect(world.cells.length).toBeLessThanOrEqual(cellsAt30);
    seekTo(world, 18);
    expect(world.hours).toBe(18);
    expect(world.frames.some((f) => f.hours === 18)).toBe(true);
  });
});
