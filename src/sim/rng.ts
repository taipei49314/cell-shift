/** mulberry32 — enough entropy for a toy chamber, fully seed-reproducible. */
export class Rng {
  private s: number;

  constructor(seed: number) {
    this.s = seed >>> 0;
    if (this.s === 0) this.s = 0x9e3779b9;
  }

  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  float(min = 0, max = 1): number {
    return min + (max - min) * this.next();
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(xs: readonly T[]): T {
    return xs[Math.floor(this.next() * xs.length)]!;
  }

  unitSphere(): [number, number, number] {
    const u = this.next() * 2 - 1;
    const phi = this.next() * Math.PI * 2;
    const r = Math.sqrt(Math.max(0, 1 - u * u));
    return [r * Math.cos(phi), u, r * Math.sin(phi)];
  }

  state(): number {
    return this.s;
  }

  setState(s: number): void {
    this.s = s >>> 0;
    if (this.s === 0) this.s = 0x9e3779b9;
  }
}
