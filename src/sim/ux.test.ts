import { describe, expect, it } from "vitest";
import { PRESETS, worldFromSpec } from "./experiment";
import { replayTo } from "./world";

describe("chamber UX", () => {
  it("Living spheroid opens on a visible mass, not 12 founders", () => {
    const world = worldFromSpec(PRESETS.living);
    const live = world.cells.filter((c) => !c.dead).length;
    expect(world.hours).toBe(PRESETS.living.viewHours);
    expect(world.cells.length).toBeGreaterThan(50);
    expect(live).toBeGreaterThan(15);
  });

  it("RESET at the current hour rebuilds the same hour, not t=0", () => {
    const world = worldFromSpec(PRESETS.living);
    const hours = world.hours;
    const again = replayTo({ ...world.config }, hours);
    expect(again.hours).toBe(hours);
    expect(again.hours).not.toBe(0);
    expect(again.cells.length).toBe(world.cells.length);
  });
});
