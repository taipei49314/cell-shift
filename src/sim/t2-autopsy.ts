import { adhesionMultiseed } from "./campaign";
import { measure } from "./morphology";
import {
  scoreH99Early,
  scoreH99Smalln,
  scoreH2026Pack,
  type SeriesPoint,
} from "./t2-hypotheses";
import { replayTo } from "./world";

const ADH_ENV = { oxygen: 0.85, nutrient: 0.85, mutationRate: 0 };
const ADH_BASE = { cycleHours: 14, deathRate: 0.03, motility: 0.08 };
const MOT_ENV = { oxygen: 0.85, nutrient: 0.85, mutationRate: 0 };
const MOT_BASE = { cycleHours: 14, deathRate: 0.03, adhesion: 0.7 };

function liveOf(cells: { dead: boolean }[]): number {
  return cells.filter((c) => !c.dead).length;
}

export function adhesionSeries(seed: number, hours = [20, 40, 60, 80, 100, 120, 140, 160]): SeriesPoint[] {
  return hours.map((h) => {
    const treat = replayTo(
      { seed, env: ADH_ENV, rules: { ...ADH_BASE, adhesion: 0.15 } },
      h,
    );
    const ctrl = replayTo(
      { seed, env: ADH_ENV, rules: { ...ADH_BASE, adhesion: 1.1 } },
      h,
    );
    const tm = measure(treat.cells, { neighbors: false });
    const cm = measure(ctrl.cells, { neighbors: false });
    return {
      hours: h,
      live: liveOf(treat.cells),
      r90Treat: tm.r90,
      r90Ctrl: cm.r90,
      necTreat: tm.necroticFrac,
      necCtrl: cm.necroticFrac,
      hold: tm.r90 > cm.r90,
    };
  });
}

export function motilityPair(seed: number, hours = 160) {
  const high = replayTo({ seed, env: MOT_ENV, rules: { ...MOT_BASE, motility: 0.22 } }, hours);
  const low = replayTo({ seed, env: MOT_ENV, rules: { ...MOT_BASE, motility: 0.03 } }, hours);
  return {
    high: measure(high.cells, { neighbors: false }),
    low: measure(low.cells, { neighbors: false }),
    liveHigh: liveOf(high.cells),
    liveLow: liveOf(low.cells),
  };
}

export function autopsy99() {
  const series = adhesionSeries(99);
  const at80 = series.find((p) => p.hours === 80)!;
  const at160 = series.find((p) => p.hours === 160)!;
  const control = adhesionMultiseed(160, [4821]).rows[0]!;
  return {
    seed: 99,
    series,
    holdSeed4821: control.hold,
    verdicts: {
      "H99-smalln": scoreH99Smalln({ live: at160.live, hold: at160.hold }),
      "H99-early": scoreH99Early(at80, at160),
    },
  };
}

export function autopsy2026() {
  const pair = motilityPair(2026, 160);
  return {
    seed: 2026,
    pair,
    verdicts: {
      "H2026-pack": scoreH2026Pack(pair.high, pair.low),
    },
  };
}
