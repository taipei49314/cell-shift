import { experimentHash, PRESETS, type ExperimentSpec } from "./experiment";
import { measure } from "./morphology";
import type { Morphology } from "./types";
import { replayTo } from "./world";

/** Locked multi-seed set. Do not drop a failing seed to make a test green. */
export const HYPOXIC_MULTI_SEEDS = [4821, 7, 21, 99, 2026] as const;

export type CampaignRow = {
  label: string;
  hash: string;
  hours: number;
  morphology: Morphology;
};

export type Campaign = {
  name: string;
  factor: string;
  hours: number;
  rows: CampaignRow[];
};

export function runCampaign(
  name: string,
  factor: string,
  hours: number,
  specs: { label: string; spec: ExperimentSpec }[],
): Campaign {
  const rows: CampaignRow[] = [];
  for (const item of specs) {
    const world = replayTo(
      { seed: item.spec.seed, env: item.spec.env, rules: item.spec.rules, shift: item.spec.shift },
      hours,
    );
    rows.push({
      label: item.label,
      hash: experimentHash(item.spec),
      hours: world.hours,
      morphology: measure(world.cells),
    });
  }
  return { name, factor, hours, rows };
}

export function adhesionSweep(seed = 4821, hours = 120): Campaign {
  const env = { oxygen: 0.85, nutrient: 0.85, mutationRate: 0 };
  const values = [0.15, 0.4, 0.7, 1.1];
  return runCampaign(
    "adhesion-sweep",
    "rules.adhesion",
    hours,
    values.map((adhesion) => ({
      label: `adhesion=${adhesion}`,
      spec: {
        name: "adhesion-sweep",
        seed,
        env,
        rules: { cycleHours: 14, deathRate: 0.03, adhesion, motility: 0.08 },
      },
    })),
  );
}

export function hypoxicMultiseed(
  hours = 240,
  seeds: readonly number[] = HYPOXIC_MULTI_SEEDS,
): Campaign {
  const proto = PRESETS.hypoxic;
  return runCampaign(
    "hypoxic-multiseed",
    "seed",
    hours,
    seeds.map((seed) => ({
      label: `seed=${seed}`,
      spec: { ...proto, seed },
    })),
  );
}
