import { describe, expect, it } from "vitest";
import { lineageIds } from "./lineage";
import { createWorld, replayTo, stats, step } from "./world";

function fingerprint(world: ReturnType<typeof createWorld>): string {
  return world.cells
    .map((c) => `${c.id}:${c.cloneId}:${c.dead ? "d" : "a"}:${c.pos[0].toFixed(3)},${c.pos[1].toFixed(3)},${c.pos[2].toFixed(3)}`)
    .join("|");
}

describe("CELL//SHIFT chamber", () => {
  it("replays the same seed to the same tissue", () => {
    const a = replayTo({ seed: 4821 }, 80);
    const b = replayTo({ seed: 4821 }, 80);
    expect(fingerprint(a)).toBe(fingerprint(b));
    expect(a.cells.length).toBeGreaterThan(12);
  });

  it("a different seed is a different tissue", () => {
    const a = replayTo({ seed: 4821 }, 80);
    const b = replayTo({ seed: 4822 }, 80);
    expect(fingerprint(a)).not.toBe(fingerprint(b));
  });

  it("mutation rate 0 keeps a single living clone", () => {
    const world = replayTo({ seed: 7, env: { oxygen: 0.9, nutrient: 0.9, mutationRate: 0 } }, 120);
    const livingClones = new Set(world.cells.filter((c) => !c.dead).map((c) => c.cloneId));
    expect(livingClones.size).toBe(1);
    expect([...livingClones][0]).toBe("C1");
  });

  it("high mutation rate produces new clones and parent links", () => {
    const world = replayTo(
      { seed: 99, env: { oxygen: 0.9, nutrient: 0.95, mutationRate: 1 }, founders: 4 },
      60,
    );
    const children = world.cells.filter((c) => c.parentId !== null);
    expect(children.length).toBeGreaterThan(0);
    expect(children.every((c) => world.cells.some((p) => p.id === c.parentId))).toBe(true);
    expect(new Set(world.cells.map((c) => c.cloneId)).size).toBeGreaterThan(1);
  });

  it("lineage includes ancestors and descendants only", () => {
    const world = createWorld({
      seed: 3,
      founders: 6,
      env: { oxygen: 1, nutrient: 1, mutationRate: 0 },
      rules: { cycleHours: 12, deathRate: 0.01, adhesion: 0.7, motility: 0.06 },
    });
    for (let i = 0; i < 80; i++) step(world);
    const child = world.cells.find((c) => c.parentId !== null);
    expect(child).toBeTruthy();
    const ids = lineageIds(world.cells, child!.id);
    expect(ids.has(child!.id)).toBe(true);
    expect(ids.has(child!.parentId!)).toBe(true);
    const s = stats(world);
    expect(s.hours).toBe(80);
    expect(s.cells).toBe(world.cells.length);
  });
});
