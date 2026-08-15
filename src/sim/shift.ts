import type { Cell, CloneShift, MutationGene, Traits } from "./types";

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function applyGene(traits: Traits, gene: MutationGene, delta: number): Traits {
  const next = { ...traits };
  switch (gene) {
    case "cycle_rate":
      next.cycleTime = clamp(next.cycleTime * (1 - delta), 8, 48);
      break;
    case "apoptosis_threshold":
      next.apoptosisThreshold = clamp(next.apoptosisThreshold * (1 + delta), 0.01, 0.6);
      break;
    case "hypoxia_tolerance":
      next.oxygenTolerance = clamp(next.oxygenTolerance * (1 - delta), 0.04, 0.6);
      break;
    case "adhesion":
      next.adhesion = clamp(next.adhesion * (1 + delta), 0.05, 1.4);
      break;
    case "motility":
      next.motility = clamp(next.motility * (1 + delta), 0.01, 0.5);
      break;
    case "uptake":
      next.uptake = clamp(next.uptake * (1 + delta), 0.3, 2.4);
      break;
  }
  return next;
}

export function shiftActive(shift: CloneShift | null | undefined): shift is CloneShift {
  if (!shift || !shift.cloneId) return false;
  return Object.values(shift.deltas).some((d) => d !== undefined && d !== 0);
}

export function effectiveTraits(cell: Cell, shift: CloneShift | null | undefined): Traits {
  if (!shiftActive(shift) || cell.cloneId !== shift.cloneId) return cell.traits;
  let traits = cell.traits;
  for (const [gene, delta] of Object.entries(shift.deltas) as [MutationGene, number | undefined][]) {
    if (delta) traits = applyGene(traits, gene, delta);
  }
  return traits;
}

export function emptyShift(cloneId = "C1"): CloneShift {
  return { cloneId, deltas: {} };
}
