import { describe, expect, it } from "vitest";
import { PRESETS } from "./experiment";
import { measure } from "./morphology";
import { replayTo } from "./world";

describe("field resolution", () => {
  it("16³ cannot resolve Hypoxic core < rim; 24³ and 32³ can, with r90 gap < 35%", () => {
    const base = {
      seed: PRESETS.hypoxic.seed,
      env: PRESETS.hypoxic.env,
      rules: PRESETS.hypoxic.rules,
    };
    const at = (fieldN: number) => {
      const world = replayTo({ ...base, fieldN }, 80);
      return { n: world.field.n, ...measure(world.cells) };
    };
    const m16 = at(16);
    const m24 = at(24);
    const m32 = at(32);
    expect(m16.n).toBe(16);
    expect(m16.rimO2).not.toBeGreaterThan(m16.coreO2);
    expect(m24.rimO2).toBeGreaterThan(m24.coreO2);
    expect(m32.rimO2).toBeGreaterThan(m32.coreO2);
    expect(Math.abs(m24.r90 - m32.r90) / Math.max(m24.r90, 1e-6)).toBeLessThan(0.35);
  });
});

describe("selection from division, not relabeled founders", () => {
  it("cycle_rate-only mutations are born from a parent and run a faster cycle than C1", () => {
    const world = replayTo(
      {
        seed: 5,
        founders: 8,
        env: { oxygen: 0.95, nutrient: 0.95, mutationRate: 0.4 },
        rules: { cycleHours: 12, deathRate: 0.02, adhesion: 0.7, motility: 0.04 },
        mutationPool: ["cycle_rate"],
      },
      70,
    );
    const mutants = world.cells.filter((c) => c.cloneId !== "C1");
    expect(mutants.length).toBeGreaterThan(0);
    expect(mutants.every((c) => c.parentId !== null)).toBe(true);
    expect(mutants.every((c) => c.mutations.some((m) => m.gene === "cycle_rate"))).toBe(true);
    const mean = (xs: typeof world.cells) =>
      xs.reduce((s, c) => s + c.traits.cycleTime, 0) / Math.max(1, xs.length);
    const wild = world.cells.filter((c) => c.cloneId === "C1" && !c.dead);
    expect(mean(mutants)).toBeLessThan(mean(wild.length ? wild : world.cells.filter((c) => c.cloneId === "C1")));
  });
});

describe("morphology beyond r90 and necrotic fraction", () => {
  it("is deterministic and Hypoxic has a hypoxic shell", () => {
    const spec = { seed: PRESETS.hypoxic.seed, env: PRESETS.hypoxic.env, rules: PRESETS.hypoxic.rules };
    const a = measure(replayTo(spec, 160).cells);
    const b = measure(replayTo(spec, 160).cells);
    expect(a.asphericity).toBe(b.asphericity);
    expect(a.roughness).toBe(b.roughness);
    expect(a.hypoxicShell).toBe(b.hypoxicShell);
    expect(a.r10).toBeLessThanOrEqual(a.r50);
    expect(a.r50).toBeLessThanOrEqual(a.r90);
    expect(a.necroticFrac).toBeGreaterThan(0);
    expect(a.hypoxicShell).toBeGreaterThan(0);
  });

  it("Invasive vs Intact: r90 is the shape contrast; roughness is not", () => {
    const hours = 160;
    const inv = measure(
      replayTo({ seed: PRESETS.invasive.seed, env: PRESETS.invasive.env, rules: PRESETS.invasive.rules }, hours)
        .cells,
    );
    const intact = measure(
      replayTo({ seed: PRESETS.intact.seed, env: PRESETS.intact.env, rules: PRESETS.intact.rules }, hours).cells,
    );
    expect(inv.r90).toBeGreaterThan(intact.r90);
    expect(Math.abs(inv.roughness - intact.roughness)).toBeLessThan(0.02);
    expect(intact.asphericity).toBeGreaterThan(inv.asphericity);
  });
});
