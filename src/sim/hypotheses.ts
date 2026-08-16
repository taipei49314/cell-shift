import { experimentHash, PRESETS, type ExperimentSpec } from "./experiment";
import { measure } from "./morphology";
import { replayTo } from "./world";

export type Verdict = "PASS" | "FAIL" | "UNKNOWN";

export type Hypothesis = {
  id: string;
  question: "structure" | "selection" | "shape";
  statement: string;
  hours: number;
  build: () => { treatment: ExperimentSpec; control?: ExperimentSpec };
  score: (treatment: ReturnType<typeof measure>, control?: ReturnType<typeof measure>) => Verdict;
};

export type HypothesisRun = {
  id: string;
  verdict: Verdict;
  hours: number;
  treatmentHash: string;
  notes: string;
};

export const HYPOTHESES: Hypothesis[] = [
  {
    id: "H-core",
    question: "structure",
    statement: "Hypoxic spheroid · 4821 · 240 h forms an inward O₂ drop and a necrotic core.",
    hours: 240,
    build: () => ({ treatment: PRESETS.hypoxic }),
    score: (t) => (t.coreO2 < t.rimO2 && t.necroticFrac > 0 ? "PASS" : "FAIL"),
  },
  {
    id: "H-adhesion",
    question: "shape",
    statement: "Same seed, lower adhesion produces a larger r90 than high adhesion.",
    hours: 160,
    build: () => {
      const env = { oxygen: 0.85, nutrient: 0.85, mutationRate: 0 };
      const base = { cycleHours: 14, deathRate: 0.03, motility: 0.08 };
      return {
        treatment: { name: "low-adhesion", seed: 4821, env, rules: { ...base, adhesion: 0.15 } },
        control: { name: "high-adhesion", seed: 4821, env, rules: { ...base, adhesion: 1.1 } },
      };
    },
    score: (t, c) => {
      if (!c) return "UNKNOWN";
      return t.r90 > c.r90 ? "PASS" : "FAIL";
    },
  },
  {
    id: "H-intact-no-core",
    question: "structure",
    statement: "Intact protocol at 240 h has a smaller necrotic fraction than Hypoxic spheroid.",
    hours: 240,
    build: () => ({ treatment: PRESETS.intact, control: PRESETS.hypoxic }),
    score: (t, c) => {
      if (!c) return "UNKNOWN";
      return t.necroticFrac < c.necroticFrac ? "PASS" : "FAIL";
    },
  },
];

export function runHypothesis(h: Hypothesis): HypothesisRun {
  const { treatment, control } = h.build();
  const tw = replayTo(
    {
      seed: treatment.seed,
      env: treatment.env,
      rules: treatment.rules,
      shift: treatment.shift,
      fieldN: treatment.fieldN,
      mutationPool: treatment.mutationPool,
    },
    h.hours,
  );
  const cw = control
    ? replayTo(
        {
          seed: control.seed,
          env: control.env,
          rules: control.rules,
          shift: control.shift,
          fieldN: control.fieldN,
          mutationPool: control.mutationPool,
        },
        h.hours,
      )
    : undefined;
  const verdict = h.score(measure(tw.cells), cw ? measure(cw.cells) : undefined);
  return {
    id: h.id,
    verdict,
    hours: h.hours,
    treatmentHash: experimentHash(treatment),
    notes: h.statement,
  };
}
