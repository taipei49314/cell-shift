import type { Cell, EnvParams } from "./types";

/** Coarse substrate grid. Method-class: reaction–diffusion on a Cartesian mesh. Not BioFVM. */
export const FIELD_RES = 24;

export const FIELD = {
  diffusion: 0.42,
  consume: 0.16,
  jacobi: 5,
} as const;

export type SubstrateField = {
  n: number;
  half: number;
  h: number;
  oxygen: Float64Array;
  scratch: Float64Array;
  consume: Float64Array;
};

function idx(i: number, j: number, k: number, n: number): number {
  return i + n * (j + n * k);
}

export function createField(chamberRadius: number, supply: number): SubstrateField {
  const n = FIELD_RES;
  const half = chamberRadius;
  const h = (2 * half) / n;
  const count = n * n * n;
  const oxygen = new Float64Array(count);
  oxygen.fill(supply);
  return {
    n,
    half,
    h,
    oxygen,
    scratch: new Float64Array(count),
    consume: new Float64Array(count),
  };
}

function voxelAt(field: SubstrateField, x: number, y: number, z: number): [number, number, number] {
  const { n, half, h } = field;
  const i = Math.min(n - 1, Math.max(0, Math.floor((x + half) / h)));
  const j = Math.min(n - 1, Math.max(0, Math.floor((y + half) / h)));
  const k = Math.min(n - 1, Math.max(0, Math.floor((z + half) / h)));
  return [i, j, k];
}

function isSupplyVoxel(field: SubstrateField, i: number, j: number, k: number): boolean {
  const { n, half, h } = field;
  if (i === 0 || j === 0 || k === 0 || i === n - 1 || j === n - 1 || k === n - 1) return true;
  const cx = -half + (i + 0.5) * h;
  const cy = -half + (j + 0.5) * h;
  const cz = -half + (k + 0.5) * h;
  return Math.hypot(cx, cy, cz) > half - h;
}

function neighbor(
  field: SubstrateField,
  i: number,
  j: number,
  k: number,
  supply: number,
): number {
  const { n, oxygen } = field;
  if (i < 0 || j < 0 || k < 0 || i >= n || j >= n || k >= n) return supply;
  return oxygen[idx(i, j, k, n)]!;
}

export function sampleField(field: SubstrateField, x: number, y: number, z: number): number {
  const { n, half, h, oxygen } = field;
  const fx = (x + half) / h - 0.5;
  const fy = (y + half) / h - 0.5;
  const fz = (z + half) / h - 0.5;
  const i0 = Math.min(n - 2, Math.max(0, Math.floor(fx)));
  const j0 = Math.min(n - 2, Math.max(0, Math.floor(fy)));
  const k0 = Math.min(n - 2, Math.max(0, Math.floor(fz)));
  const tx = Math.min(1, Math.max(0, fx - i0));
  const ty = Math.min(1, Math.max(0, fy - j0));
  const tz = Math.min(1, Math.max(0, fz - k0));
  const c000 = oxygen[idx(i0, j0, k0, n)]!;
  const c100 = oxygen[idx(i0 + 1, j0, k0, n)]!;
  const c010 = oxygen[idx(i0, j0 + 1, k0, n)]!;
  const c110 = oxygen[idx(i0 + 1, j0 + 1, k0, n)]!;
  const c001 = oxygen[idx(i0, j0, k0 + 1, n)]!;
  const c101 = oxygen[idx(i0 + 1, j0, k0 + 1, n)]!;
  const c011 = oxygen[idx(i0, j0 + 1, k0 + 1, n)]!;
  const c111 = oxygen[idx(i0 + 1, j0 + 1, k0 + 1, n)]!;
  const c00 = c000 * (1 - tx) + c100 * tx;
  const c10 = c010 * (1 - tx) + c110 * tx;
  const c01 = c001 * (1 - tx) + c101 * tx;
  const c11 = c011 * (1 - tx) + c111 * tx;
  const c0 = c00 * (1 - ty) + c10 * ty;
  const c1 = c01 * (1 - ty) + c11 * ty;
  return Math.min(1, Math.max(0, c0 * (1 - tz) + c1 * tz));
}

export function stepField(
  field: SubstrateField,
  cells: readonly Cell[],
  env: EnvParams,
  dt: number,
  uptakeOf: (cell: Cell) => number = (cell) => cell.traits.uptake,
): void {
  const { n, oxygen, scratch, consume } = field;
  consume.fill(0);
  for (const cell of cells) {
    if (cell.dead) continue;
    const [i, j, k] = voxelAt(field, cell.pos[0], cell.pos[1], cell.pos[2]);
    consume[idx(i, j, k, n)]! += uptakeOf(cell) * FIELD.consume;
  }

  const supply = env.oxygen;
  const alpha = (FIELD.diffusion * dt) / (field.h * field.h);
  const stable = Math.min(alpha, 0.14);

  for (let pass = 0; pass < FIELD.jacobi; pass++) {
    for (let k = 0; k < n; k++) {
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const id = idx(i, j, k, n);
          if (isSupplyVoxel(field, i, j, k)) {
            scratch[id] = supply;
            continue;
          }
          const lap =
            neighbor(field, i + 1, j, k, supply) +
            neighbor(field, i - 1, j, k, supply) +
            neighbor(field, i, j + 1, k, supply) +
            neighbor(field, i, j - 1, k, supply) +
            neighbor(field, i, j, k + 1, supply) +
            neighbor(field, i, j, k - 1, supply) -
            6 * oxygen[id]!;
          const next = oxygen[id]! + stable * lap - consume[id]! * dt;
          scratch[id] = Math.min(supply, Math.max(0, next));
        }
      }
    }
    oxygen.set(scratch);
  }
}
