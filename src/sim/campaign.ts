import { experimentHash, PRESETS, type ExperimentSpec } from "./experiment";
import { livingShares, measure } from "./morphology";
import type { Morphology } from "./types";
import { createWorld, replayTo, step } from "./world";

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

export type SeedHoldRow = {
  seed: number;
  hold: boolean;
  treatmentScore: number;
  controlScore: number;
  treatment: CampaignRow;
  control: CampaignRow;
};

export type SeedHoldCampaign = {
  name: string;
  question: "structure" | "selection" | "shape";
  criterion: string;
  hours: number;
  seeds: number[];
  held: number;
  rows: SeedHoldRow[];
};

function seedHoldCampaign(
  name: string,
  question: SeedHoldCampaign["question"],
  criterion: string,
  hours: number,
  seeds: readonly number[],
  run: (seed: number) => {
    hold: boolean;
    treatmentScore: number;
    controlScore: number;
    treatment: CampaignRow;
    control: CampaignRow;
  },
): SeedHoldCampaign {
  const rows: SeedHoldRow[] = seeds.map((seed) => {
    const got = run(seed);
    return { seed, ...got };
  });
  return {
    name,
    question,
    criterion,
    hours,
    seeds: [...seeds],
    held: rows.filter((r) => r.hold).length,
    rows,
  };
}

function rowFromSpec(spec: ExperimentSpec, hours: number): CampaignRow {
  const world = replayTo(
    { seed: spec.seed, env: spec.env, rules: spec.rules, shift: spec.shift },
    hours,
  );
  return {
    label: spec.name,
    hash: experimentHash(spec),
    hours: world.hours,
    morphology: measure(world.cells),
  };
}

const ADHESION_ENV = { oxygen: 0.85, nutrient: 0.85, mutationRate: 0 };
const ADHESION_BASE = { cycleHours: 14, deathRate: 0.03, motility: 0.08 };

/** Same adhesion contrast as H-adhesion. Report holds; do not drop a failing seed. */
export function adhesionMultiseed(
  hours = 160,
  seeds: readonly number[] = HYPOXIC_MULTI_SEEDS,
): SeedHoldCampaign {
  return seedHoldCampaign(
    "adhesion-multiseed",
    "shape",
    "low adhesion r90 > high adhesion r90",
    hours,
    seeds,
    (seed) => {
      const treatment = rowFromSpec(
        {
          name: "low-adhesion",
          seed,
          env: ADHESION_ENV,
          rules: { ...ADHESION_BASE, adhesion: 0.15 },
        },
        hours,
      );
      const control = rowFromSpec(
        {
          name: "high-adhesion",
          seed,
          env: ADHESION_ENV,
          rules: { ...ADHESION_BASE, adhesion: 1.1 },
        },
        hours,
      );
      return {
        hold: treatment.morphology.r90 > control.morphology.r90,
        treatmentScore: treatment.morphology.r90,
        controlScore: control.morphology.r90,
        treatment,
        control,
      };
    },
  );
}

/** Invasive vs Intact r90 on the locked seed set. Shape class; two named protocols. */
export function invasiveVsIntact(
  hours = 160,
  seeds: readonly number[] = HYPOXIC_MULTI_SEEDS,
): SeedHoldCampaign {
  return seedHoldCampaign(
    "invasive-intact",
    "shape",
    "Invasive r90 > Intact r90",
    hours,
    seeds,
    (seed) => {
      const treatment = rowFromSpec({ ...PRESETS.invasive, seed }, hours);
      const control = rowFromSpec({ ...PRESETS.intact, seed }, hours);
      return {
        hold: treatment.morphology.r90 > control.morphology.r90,
        treatmentScore: treatment.morphology.r90,
        controlScore: control.morphology.r90,
        treatment,
        control,
      };
    },
  );
}

export function oxygenSweep(seed = 4821, hours = 160): Campaign {
  const proto = PRESETS.hypoxic;
  const values = [0.4, 0.52, 0.7, 0.9];
  return runCampaign(
    "oxygen-sweep",
    "env.oxygen",
    hours,
    values.map((oxygen) => ({
      label: `oxygen=${oxygen}`,
      spec: { ...proto, seed, env: { ...proto.env, oxygen } },
    })),
  );
}

const SHIFT_ENV = { oxygen: 0.9, nutrient: 0.95, mutationRate: 0 };
const SHIFT_RULES = { cycleHours: 12, deathRate: 0.02, adhesion: 0.65, motility: 0.04 };

function c1ShareWorld(seed: number, hours: number, delta: number): { row: CampaignRow; c1Share: number } {
  const shift = delta ? { cloneId: "C1" as const, deltas: { cycle_rate: delta } } : null;
  const world = createWorld({ seed, founders: 12, env: SHIFT_ENV, rules: SHIFT_RULES, shift });
  for (let i = 6; i < world.cells.length; i++) world.cells[i]!.cloneId = "C2";
  for (let t = 0; t < hours; t++) step(world);
  return {
    row: {
      label: delta ? `shift cycle_rate=${delta}` : "unshifted",
      hash: experimentHash({
        seed,
        env: SHIFT_ENV,
        rules: SHIFT_RULES,
        shift,
      }),
      hours: world.hours,
      morphology: measure(world.cells),
    },
    c1Share: livingShares(world.cells).find((s) => s.cloneId === "C1")?.share ?? 0,
  };
}

/** C1 cycle_rate SHIFT vs unshifted C2. Report holds; do not drop a failing seed. */
export function shiftCycleMultiseed(
  hours = 90,
  seeds: readonly number[] = HYPOXIC_MULTI_SEEDS,
): SeedHoldCampaign {
  return seedHoldCampaign(
    "shift-cycle-multiseed",
    "selection",
    "shifted C1 share > unshifted C1 share",
    hours,
    seeds,
    (seed) => {
      const treatment = c1ShareWorld(seed, hours, 0.45);
      const control = c1ShareWorld(seed, hours, 0);
      return {
        hold: treatment.c1Share > control.c1Share,
        treatmentScore: treatment.c1Share,
        controlScore: control.c1Share,
        treatment: treatment.row,
        control: control.row,
      };
    },
  );
}
