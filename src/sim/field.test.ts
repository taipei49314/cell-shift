import { describe, expect, it } from "vitest";
import { experimentHash, PRESETS } from "./experiment";
import { createField, sampleField, stepField } from "./field";
import { measure, radialProfile } from "./morphology";
import { replayTo } from "./world";

describe("substrate field", () => {
  it("keeps an empty chamber at the supply value", () => {
    const field = createField(18, 0.7);
    stepField(field, [], { oxygen: 0.7, nutrient: 1, mutationRate: 0 }, 1);
    expect(sampleField(field, 0, 0, 0)).toBeCloseTo(0.7, 3);
  });

  it("a consuming cluster lowers oxygen at the origin vs the rim", () => {
    const field = createField(18, 0.7);
    const cluster = Array.from({ length: 80 }, (_, i) => ({
      id: i + 1,
      parentId: null,
      cloneId: "C1",
      generation: 0,
      bornAt: 0,
      age: 0,
      state: "CYCLING" as const,
      pos: [((i % 5) - 2) * 0.5, (((i / 5) | 0) % 5 - 2) * 0.5, (((i / 25) | 0) - 1) * 0.5] as [
        number,
        number,
        number,
      ],
      cycleProgress: 0,
      traits: {
        cycleTime: 24,
        oxygenTolerance: 0.28,
        uptake: 1,
        adhesion: 0.7,
        motility: 0.06,
        apoptosisThreshold: 0.1,
      },
      mutations: [],
      oxygen: 0.7,
      dead: false,
    }));
    for (let t = 0; t < 20; t++) stepField(field, cluster, { oxygen: 0.7, nutrient: 1, mutationRate: 0 }, 1);
    const core = sampleField(field, 0, 0, 0);
    const rim = sampleField(field, 0, 0, 16);
    expect(rim).toBeGreaterThan(core);
    expect(core).toBeLessThan(0.7);
  });
});

describe("experiment hash", () => {
  it("is stable for the same spec and changes when a rule changes", () => {
    const a = experimentHash(PRESETS.hypoxic);
    const b = experimentHash({ ...PRESETS.hypoxic });
    const c = experimentHash({
      ...PRESETS.hypoxic,
      rules: { ...PRESETS.hypoxic.rules, adhesion: 0.2 },
    });
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe("morphology protocols", () => {
  it("Hypoxic spheroid (seed 4821, 240h): core O₂ below rim, necrotic core present", () => {
    const p = PRESETS.hypoxic;
    const world = replayTo({ seed: p.seed, env: p.env, rules: p.rules }, 240);
    const m = measure(world.cells);
    expect(world.cells.length).toBeGreaterThan(40);
    expect(m.rimO2).toBeGreaterThan(m.coreO2);
    expect(m.necroticFrac).toBeGreaterThan(0);
    const profile = radialProfile(world.cells);
    expect(profile.some((b) => b.n > 0 && b.o2 < p.env.oxygen)).toBe(true);
  });

  it("same seed: low adhesion has larger r90 than high adhesion", () => {
    const seed = 4821;
    const env = { oxygen: 0.85, nutrient: 0.85, mutationRate: 0 };
    const base = { cycleHours: 14, deathRate: 0.03, motility: 0.08 };
    const tight = replayTo({ seed, env, rules: { ...base, adhesion: 1.1 } }, 160);
    const loose = replayTo({ seed, env, rules: { ...base, adhesion: 0.15 } }, 160);
    const rTight = measure(tight.cells).r90;
    const rLoose = measure(loose.cells).r90;
    expect(rLoose).toBeGreaterThan(rTight);
  });

  it("same seed: high motility has larger r90 than low motility", () => {
    const seed = 4821;
    const env = { oxygen: 0.85, nutrient: 0.85, mutationRate: 0 };
    const base = { cycleHours: 14, deathRate: 0.03, adhesion: 0.7 };
    const slow = replayTo({ seed, env, rules: { ...base, motility: 0.03 } }, 160);
    const fast = replayTo({ seed, env, rules: { ...base, motility: 0.22 } }, 160);
    const rSlow = measure(slow.cells).r90;
    const rFast = measure(fast.cells).r90;
    expect(rFast).toBeGreaterThan(rSlow);
  });
});
