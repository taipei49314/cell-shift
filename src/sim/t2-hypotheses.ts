/** Frozen before T2 atlas autopsy. Do not edit stems after T2.1 starts. */
import type { Verdict } from "./hypotheses";

export type { Verdict };

export type T2HypothesisId = "H99-smalln" | "H99-early" | "H2026-pack" | "Hox-mid" | "Hcap";

export type T2Hypothesis = {
  id: T2HypothesisId;
  statement: string;
  disconfirm: string;
};

export const T2_HYPOTHESES: T2Hypothesis[] = [
  {
    id: "H99-smalln",
    statement: "seed 99 adhesion contrast fails because live < 8, so r90 is dominated by few cells.",
    disconfirm: "If seed 99 still reverses when live ≥ 15, this FAIL.",
  },
  {
    id: "H99-early",
    statement: "seed 99 adhesion contrast is already reversed by t≤80, not only at 160 h.",
    disconfirm: "If 80 h holds and 160 h reverses, this FAIL.",
  },
  {
    id: "H2026-pack",
    statement: "seed 2026 high-motility r90 is smaller because spread cells go hypoxic and the live body shrinks.",
    disconfirm: "If high-motility necroticFrac is lower than low-motility and r90 is still smaller, this FAIL.",
  },
  {
    id: "Hox-mid",
    statement: "o2Drop in mid oxygen (0.5–0.7) is below both endpoints.",
    disconfirm: "If every mid cell is ≥ the smaller endpoint o2Drop, this FAIL.",
  },
  {
    id: "Hcap",
    statement: "With contactLimit=14, live at 160 h is in [6, 20] on seeds 4821, 7, 21, 99, 2026.",
    disconfirm: "If any of those seeds falls outside [6, 20], this FAIL.",
  },
];

export type SeriesPoint = {
  hours: number;
  live: number;
  r90Treat: number;
  r90Ctrl: number;
  necTreat: number;
  necCtrl: number;
  hold: boolean;
};

export function scoreH99Smalln(at160: { live: number; hold: boolean }): Verdict {
  if (at160.hold) return "UNKNOWN";
  if (at160.live >= 15) return "FAIL";
  if (at160.live < 8) return "PASS";
  return "UNKNOWN";
}

export function scoreH99Early(at80: { hold: boolean }, at160: { hold: boolean }): Verdict {
  if (at80.hold && !at160.hold) return "FAIL";
  if (!at80.hold) return "PASS";
  if (at80.hold && at160.hold) return "UNKNOWN";
  return "UNKNOWN";
}

export function scoreH2026Pack(high: { r90: number; necroticFrac: number }, low: { r90: number; necroticFrac: number }): Verdict {
  if (high.r90 >= low.r90) return "UNKNOWN";
  if (high.necroticFrac < low.necroticFrac) return "FAIL";
  return "PASS";
}

export function scoreHoxMid(
  cells: { oxygen: number; o2Drop: number }[],
): Verdict {
  const mid = cells.filter((c) => c.oxygen >= 0.5 && c.oxygen <= 0.7);
  const ends = cells.filter((c) => c.oxygen <= 0.4 || c.oxygen >= 0.85);
  if (!mid.length || !ends.length) return "UNKNOWN";
  const endMin = Math.min(...ends.map((c) => c.o2Drop));
  if (mid.every((c) => c.o2Drop >= endMin)) return "FAIL";
  if (mid.every((c) => c.o2Drop < endMin)) return "PASS";
  return "UNKNOWN";
}

export function scoreHcap(lives: { seed: number; live: number }[]): Verdict {
  if (lives.some((r) => r.live < 6 || r.live > 20)) return "FAIL";
  if (lives.length === 0) return "UNKNOWN";
  return "PASS";
}
