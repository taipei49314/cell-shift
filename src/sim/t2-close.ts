import { HYPOXIC_MULTI_SEEDS } from "./campaign";
import { PRESETS } from "./experiment";
import { measure } from "./morphology";
import { autopsy99, autopsy2026 } from "./t2-autopsy";
import { scoreHcap, scoreHoxMid, type Verdict } from "./t2-hypotheses";
import { replayTo } from "./world";

export function oxygenGrid(seed = 4821) {
  const os = [0.35, 0.45, 0.55, 0.7, 0.9];
  const hours = [80, 160, 240];
  const proto = PRESETS.hypoxic;
  const cells: { oxygen: number; hours: number; o2Drop: number; necroticFrac: number }[] = [];
  for (const oxygen of os) {
    for (const h of hours) {
      const world = replayTo({ seed, env: { ...proto.env, oxygen }, rules: proto.rules }, h);
      const m = measure(world.cells, { neighbors: false });
      cells.push({ oxygen, hours: h, o2Drop: m.o2Drop, necroticFrac: m.necroticFrac });
    }
  }
  const at160 = cells.filter((c) => c.hours === 160);
  return { seed, cells, verdict: { "Hox-mid": scoreHoxMid(at160) } };
}

export function ceiling(seeds: readonly number[] = HYPOXIC_MULTI_SEEDS, hours = 160) {
  const proto = PRESETS.intact;
  const rows = seeds.map((seed) => {
    const tight = replayTo(
      { seed, env: proto.env, rules: proto.rules, contactLimit: 14, founders: 12 },
      hours,
    );
    const loose = replayTo(
      { seed, env: proto.env, rules: proto.rules, contactLimit: 26, founders: 12 },
      hours,
    );
    return {
      seed,
      live14: tight.cells.filter((c) => !c.dead).length,
      live26: loose.cells.filter((c) => !c.dead).length,
      cells14: tight.cells.length,
      cells26: loose.cells.length,
    };
  });
  return {
    hours,
    rows,
    verdict: { Hcap: scoreHcap(rows.map((r) => ({ seed: r.seed, live: r.live14 }))) },
  };
}

export function closeT2() {
  const a99 = autopsy99();
  const a2026 = autopsy2026();
  const ox = oxygenGrid();
  const cap = ceiling();
  const verdicts: Record<string, Verdict> = {
    ...a99.verdicts,
    ...a2026.verdicts,
    ...ox.verdict,
    ...cap.verdict,
  };
  return { autopsy99: a99, autopsy2026: a2026, oxygen: ox, ceiling: cap, verdicts };
}
