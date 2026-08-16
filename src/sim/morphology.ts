import type { Cell, Morphology, RadialBin } from "./types";

export type CloneShare = {
  cloneId: string;
  n: number;
  share: number;
};

export function livingShares(cells: readonly Cell[]): CloneShare[] {
  const living = cells.filter((c) => !c.dead);
  const counts = new Map<string, number>();
  for (const cell of living) counts.set(cell.cloneId, (counts.get(cell.cloneId) ?? 0) + 1);
  const total = Math.max(1, living.length);
  return [...counts.entries()]
    .map(([cloneId, n]) => ({ cloneId, n, share: n / total }))
    .sort((a, b) => b.n - a.n);
}

function radiusOf(cell: Cell): number {
  return Math.hypot(cell.pos[0], cell.pos[1], cell.pos[2]);
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil(p * sorted.length) - 1));
  return sorted[i]!;
}

function sameCloneNN(living: readonly Cell[]): number {
  if (living.length < 2) return 1;
  let same = 0;
  for (let i = 0; i < living.length; i++) {
    const a = living[i]!;
    let best = Infinity;
    let clone = a.cloneId;
    for (let j = 0; j < living.length; j++) {
      if (i === j) continue;
      const b = living[j]!;
      const dx = a.pos[0] - b.pos[0];
      const dy = a.pos[1] - b.pos[1];
      const dz = a.pos[2] - b.pos[2];
      const d = dx * dx + dy * dy + dz * dz;
      if (d < best) {
        best = d;
        clone = b.cloneId;
      }
    }
    if (clone === a.cloneId) same++;
  }
  return same / living.length;
}

export function measure(cells: readonly Cell[]): Morphology {
  const living = cells.filter((c) => !c.dead);
  const radii = living.map(radiusOf).sort((a, b) => a - b);
  const r10 = percentile(radii, 0.1);
  const r50 = percentile(radii, 0.5);
  const r90 = percentile(radii, 0.9);
  const necrotic = cells.filter((c) => c.state === "NECROTIC").length;
  const hypoxic = living.filter((c) => c.state === "HYPOXIC").length;
  const coreCut = r90 * 0.35;
  const rimCut = r90 * 0.7;
  const core = cells.filter((c) => radiusOf(c) <= coreCut);
  const rim = living.filter((c) => radiusOf(c) >= rimCut);
  const shell = living.filter((c) => {
    const r = radiusOf(c);
    return r > coreCut && r < rimCut;
  });
  const meanO2 = (xs: Cell[]) => (xs.length ? xs.reduce((s, c) => s + c.oxygen, 0) / xs.length : 0);
  const coreO2 = meanO2(core);
  const rimO2 = meanO2(rim);
  const meanR = radii.length ? radii.reduce((s, r) => s + r, 0) / radii.length : 0;
  const varR = radii.length ? radii.reduce((s, r) => s + (r - meanR) ** 2, 0) / radii.length : 0;
  const counts = new Map<string, number>();
  for (const cell of living) counts.set(cell.cloneId, (counts.get(cell.cloneId) ?? 0) + 1);
  let dominantClone = "C1";
  let dominantN = 0;
  let shannon = 0;
  const total = Math.max(1, living.length);
  for (const [id, n] of counts) {
    if (n > dominantN) {
      dominantClone = id;
      dominantN = n;
    }
    const p = n / total;
    if (p > 0) shannon -= p * Math.log(p);
  }
  return {
    r90,
    r10,
    r50,
    necroticFrac: cells.length ? necrotic / cells.length : 0,
    hypoxicFrac: living.length ? hypoxic / living.length : 0,
    hypoxicShell: shell.length ? shell.filter((c) => c.state === "HYPOXIC").length / shell.length : 0,
    coreO2,
    rimO2,
    o2Drop: rimO2 - coreO2,
    asphericity: meanR > 0 ? Math.sqrt(varR) / meanR : 0,
    roughness: r90 > 0 ? (r90 - r10) / r90 : 0,
    cloneShannon: shannon,
    sameCloneNN: sameCloneNN(living),
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
