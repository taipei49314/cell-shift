import type { Cell, Morphology, RadialBin } from "./types";

function radiusOf(cell: Cell): number {
  return Math.hypot(cell.pos[0], cell.pos[1], cell.pos[2]);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[i]!;
}

export function measure(cells: readonly Cell[]): Morphology {
  const living = cells.filter((c) => !c.dead);
  const radii = living.map(radiusOf).sort((a, b) => a - b);
  const r90 = percentile(radii, 0.9);
  const necrotic = cells.filter((c) => c.state === "NECROTIC").length;
  const hypoxic = living.filter((c) => c.state === "HYPOXIC").length;
  const coreCut = r90 * 0.35;
  const rimCut = r90 * 0.7;
  const core = cells.filter((c) => radiusOf(c) <= coreCut);
  const rim = living.filter((c) => radiusOf(c) >= rimCut);
  const mean = (xs: Cell[]) => (xs.length ? xs.reduce((s, c) => s + c.oxygen, 0) / xs.length : 0);
  const coreO2 = mean(core);
  const rimO2 = mean(rim);
  const counts = new Map<string, number>();
  for (const cell of living) counts.set(cell.cloneId, (counts.get(cell.cloneId) ?? 0) + 1);
  let dominantClone = "C1";
  let dominantN = 0;
  for (const [id, n] of counts) {
    if (n > dominantN) {
      dominantClone = id;
      dominantN = n;
    }
  }
  return {
    r90,
    necroticFrac: cells.length ? necrotic / cells.length : 0,
    hypoxicFrac: living.length ? hypoxic / living.length : 0,
    coreO2,
    rimO2,
    o2Drop: rimO2 - coreO2,
    dominantClone,
    dominantShare: living.length ? dominantN / living.length : 0,
  };
}

export function radialProfile(cells: readonly Cell[], bins = 10): RadialBin[] {
  const living = cells.filter((c) => !c.dead);
  const rMax = Math.max(1e-6, ...cells.map(radiusOf), ...living.map(radiusOf));
  const out: RadialBin[] = [];
  for (let b = 0; b < bins; b++) {
    const lo = (b / bins) * rMax;
    const hi = ((b + 1) / bins) * rMax;
    const here = cells.filter((c) => {
      const r = radiusOf(c);
      return r >= lo && r < hi;
    });
    const n = here.length;
    out.push({
      rMid: (lo + hi) / 2,
      n,
      o2: n ? here.reduce((s, c) => s + c.oxygen, 0) / n : 0,
      necrotic: n ? here.filter((c) => c.state === "NECROTIC").length / n : 0,
      hypoxic: n ? here.filter((c) => c.state === "HYPOXIC").length / n : 0,
      cycling: n ? here.filter((c) => c.state === "CYCLING").length / n : 0,
    });
  }
  return out;
}
