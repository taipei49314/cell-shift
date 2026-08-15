import { DEFAULT_ENV, DEFAULT_RULES, type EnvParams, type RuleParams } from "./types";

export type ExperimentSpec = {
  name: string;
  seed: number;
  env: EnvParams;
  rules: RuleParams;
};

function round(n: number, digits: number): number {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

export function experimentPayload(spec: Pick<ExperimentSpec, "seed" | "env" | "rules">): string {
  return JSON.stringify({
    seed: spec.seed,
    env: {
      oxygen: round(spec.env.oxygen, 4),
      nutrient: round(spec.env.nutrient, 4),
      mutationRate: round(spec.env.mutationRate, 6),
    },
    rules: {
      cycleHours: spec.rules.cycleHours,
      deathRate: round(spec.rules.deathRate, 4),
      adhesion: round(spec.rules.adhesion, 4),
      motility: round(spec.rules.motility, 4),
    },
  });
}

export function experimentHash(spec: Pick<ExperimentSpec, "seed" | "env" | "rules">): string {
  const s = experimentPayload(spec);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export const PRESETS: Record<string, ExperimentSpec> = {
  intact: {
    name: "Intact",
    seed: 4821,
    env: { oxygen: 0.9, nutrient: 0.85, mutationRate: 0 },
    rules: { cycleHours: 24, deathRate: 0.06, adhesion: 0.95, motility: 0.03 },
  },
  hypoxic: {
    name: "Hypoxic spheroid",
    seed: 4821,
    env: { oxygen: 0.52, nutrient: 0.72, mutationRate: 0 },
    rules: { cycleHours: 14, deathRate: 0.035, adhesion: 0.92, motility: 0.035 },
  },
  invasive: {
    name: "Invasive",
    seed: 4821,
    env: { oxygen: 0.8, nutrient: 0.8, mutationRate: 0.002 },
    rules: { cycleHours: 18, deathRate: 0.06, adhesion: 0.18, motility: 0.22 },
  },
};

export const DEFAULT_EXPERIMENT: ExperimentSpec = {
  name: "default",
  seed: 4821,
  env: DEFAULT_ENV,
  rules: DEFAULT_RULES,
};
