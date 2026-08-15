import { livingShares, type CloneShare } from "./morphology";
import { SNAPSHOT_EVERY, type Cell } from "./types";

export type SnapHost = {
  hours: number;
  cells: Cell[];
  field: { oxygen: Float64Array };
  rng: { state(): number; setState(s: number): void };
  nextId: number;
  nextClone: number;
  frames: Frame[];
};

export type Frame = {
  hours: number;
  cells: Cell[];
  oxygen: Float64Array;
  rng: number;
  nextId: number;
  nextClone: number;
  shares: CloneShare[];
};

export function cloneCell(cell: Cell): Cell {
  return {
    ...cell,
    pos: [cell.pos[0], cell.pos[1], cell.pos[2]],
    traits: { ...cell.traits },
    mutations: cell.mutations.map((m) => ({ ...m })),
  };
}

export function captureFrame(world: SnapHost): Frame {
  return {
    hours: world.hours,
    cells: world.cells.map(cloneCell),
    oxygen: Float64Array.from(world.field.oxygen),
    rng: world.rng.state(),
    nextId: world.nextId,
    nextClone: world.nextClone,
    shares: livingShares(world.cells),
  };
}

export function applyFrame(world: SnapHost, frame: Frame): void {
  world.hours = frame.hours;
  world.cells = frame.cells.map(cloneCell);
  world.field.oxygen.set(frame.oxygen);
  world.rng.setState(frame.rng);
  world.nextId = frame.nextId;
  world.nextClone = frame.nextClone;
  world.frames = world.frames.filter((f) => f.hours <= frame.hours);
}

export function maybeRecord(world: SnapHost): void {
  if (world.hours % SNAPSHOT_EVERY !== 0) return;
  const last = world.frames[world.frames.length - 1];
  if (last && last.hours === world.hours) world.frames[world.frames.length - 1] = captureFrame(world);
  else world.frames.push(captureFrame(world));
}

export function frameAtOrBefore(world: SnapHost, hours: number): Frame | undefined {
  let best: Frame | undefined;
  for (const frame of world.frames) {
    if (frame.hours <= hours) best = frame;
  }
  return best;
}

/** Restore the latest snapshot at or before `hours`. Does not replay from t=0. */
export function restoreTo(world: SnapHost, hours: number): boolean {
  const frame = frameAtOrBefore(world, hours);
  if (!frame) return false;
  applyFrame(world, frame);
  return true;
}

export function cloneSeries(frames: readonly Frame[]): { hours: number; shares: CloneShare[] }[] {
  return frames.map((f) => ({ hours: f.hours, shares: f.shares }));
}
