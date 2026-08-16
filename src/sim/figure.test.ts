import { describe, expect, it } from "vitest";
import { PRESETS } from "./experiment";
import { renderSectionSvg, sliceCells } from "./figure";
import { replayTo } from "./world";

describe("L3 section figure", () => {
  it("Hypoxic 4821 / 240 h midplane contains core and rim state colors", () => {
    const spec = PRESETS.hypoxic;
    const world = replayTo({ seed: spec.seed, env: spec.env, rules: spec.rules }, 240);
    const slice = sliceCells(world.cells, 0);
    expect(slice.some((c) => c.state === "NECROTIC")).toBe(true);
    expect(slice.some((c) => c.state === "HYPOXIC" || c.state === "CYCLING")).toBe(true);
    const svg = renderSectionSvg(world.cells, {
      title: "CELL//SHIFT",
      protocol: spec.name,
      seed: spec.seed,
      hours: 240,
      clip: 0,
      mode: "state",
    });
    expect(svg).toContain("CORE");
    expect(svg).toContain("RIM");
    expect(svg).toContain("#2a2428");
    expect(svg.includes("#7a5ea8") || svg.includes("#e8a0b4")).toBe(true);
    expect(svg).toContain("seed 4821");
    expect(svg).toContain("240h");
  });
});
