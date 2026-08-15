import type { Mutation } from "../sim/types";

export function cloneHue(cloneId: string): string {
  const n = Number.parseInt(cloneId.slice(1), 10) || 1;
  if (n === 1) return "#7ec8b8";
  const hues = [352, 18, 38, 200, 280, 320, 8, 55];
  return `hsl(${hues[(n - 2) % hues.length]} 82% 62%)`;
}

export function signedPct(delta: number): string {
  const v = Math.round(delta * 100);
  return `${v > 0 ? "+" : ""}${v}%`;
}

export function mutationLine(m: Mutation): string {
  return `${m.gene} ${signedPct(m.delta)}`;
}

export function fmt(n: number, digits = 2): string {
  return n.toFixed(digits);
}
