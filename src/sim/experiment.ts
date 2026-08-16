import { shiftActive } from "./shift";
import {
  DEFAULT_ENV,
  DEFAULT_RULES,
  GENES,
  type CloneShift,
  type EnvParams,
  type MutationGene,
  type RuleParams,
  type WorldConfig,
} from "./types";
import { createWorld, replayTo, type World } from "./world";

export type ExperimentSpec = {
  name: string;
  seed: number;
  env: EnvParams;
  rules: RuleParams;
  shift?: CloneShift | null;
  fieldN?: number;
  mutationPool?: MutationGene[];
  founders?: number;
  contactLimit?: number;
  viewHours?: number;
};

function round(n: number, digits: number): number {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

function shiftPayload(shift: CloneShift | null | undefined) {
  if (!shiftActive(shift)) return null;
  const deltas: Record<string, number> = {};
  for (const gene of GENES) {
    const d = shift.deltas[gene];
    if (d) deltas[gene] = round(d, 4);
  }
  return { cloneId: shift.cloneId, deltas };
}

export function experimentPayload(
  spec: Pick<ExperimentSpec, "seed" | "env" | "rules" | "shift" | "fieldN" | "mutationPool" | "founders" | "contactLimit">,
): string {
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
    shift: shiftPayload(spec.shift),
    fieldN: spec.fieldN ?? 24,
    mutationPool: [...(spec.mutationPool ?? GENES)].sort(),
    founders: spec.founders ?? 12,
    contactLimit: spec.contactLimit ?? 14,
  });
}

export function experimentHash(spec: Pick<ExperimentSpec, "seed" | "env" | "rules" | "shift">): string {
  const s = experimentPayload(spec);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export const PRESETS: Record<string, ExperimentSpec> = {
  living: {
    name: "Living spheroid",
    seed: 4821,
    env: { oxygen: 0.95, nutrient: 0.92, mutationRate: 0.012 },
    rules: { cycleHours: 8, deathRate: 0.018, adhesion: 0.7, motility: 0.05 },
    founders: 28,
    contactLimit: 26,
    viewHours: 96,
  },
  intact: {
    name: "Intact",
    seed: 4821,
    env: { oxygen: 0.9, nutrient: 0.85, mutationRate: 0 },
    rules: { cycleHours: 24, deathRate: 0.06, adhesion: 0.95, motility: 0.03 },
    viewHours: 160,
  },
  hypoxic: {
    name: "Hypoxic spheroid",
    seed: 4821,
    env: { oxygen: 0.52, nutrient: 0.72, mutationRate: 0 },
    rules: { cycleHours: 14, deathRate: 0.035, adhesion: 0.92, motility: 0.035 },
    viewHours: 240,
  },
  invasive: {
    name: "Invasive",
    seed: 4821,
    env: { oxygen: 0.8, nutrient: 0.8, mutationRate: 0.002 },
    rules: { cycleHours: 18, deathRate: 0.06, adhesion: 0.18, motility: 0.22 },
    viewHours: 160,
  },
};

export const DEFAULT_EXPERIMENT: ExperimentSpec = {
  name: "default",
  seed: 4821,
  env: DEFAULT_ENV,
  rules: DEFAULT_RULES,
};

export function specConfig(spec: ExperimentSpec): Partial<WorldConfig> {
  return {
    seed: spec.seed,
    env: spec.env,
    rules: spec.rules,
    shift: spec.shift ?? null,
    fieldN: spec.fieldN,
    mutationPool: spec.mutationPool,
    founders: spec.founders,
    contactLimit: spec.contactLimit,
  };
}

export function worldFromSpec(spec: ExperimentSpec, hours = spec.viewHours ?? 0): World {
  const cfg = specConfig(spec);
  return hours > 0 ? replayTo(cfg, hours) : createWorld(cfg);
}
