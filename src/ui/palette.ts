import type { Cell, CellState } from "../sim/types";
import { cloneHue } from "./format";

export type ColorMode = "clone" | "state" | "oxygen" | "lineage";

export const STATE_HEX: Record<CellState, string> = {
  CYCLING: "#e8a0b4",
  QUIESCENT: "#c4b8a8",
  HYPOXIC: "#7a5ea8",
  NECROTIC: "#2a2428",
  APOPTOTIC: "#6a4038",
  DEAD: "#161616",
};

export function oxygenHex(o2: number): string {
  const t = Math.min(1, Math.max(0, o2));
  const r = Math.round(26 + (125 - 26) * t);
  const g = Math.round(10 + (255 - 10) * t);
  const b = Math.round(32 + (195 - 32) * t);
  return `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}

export function cellHex(
  cell: Cell,
  mode: ColorMode,
  lineageSet: Set<number>,
  selectedId: number | null,
): string {
  if (selectedId === cell.id) return "#f4fff8";
  if (mode === "lineage") {
    if (lineageSet.size === 0) return "#1a2220";
    return lineageSet.has(cell.id) ? cloneHue(cell.cloneId) : "#0e1614";
  }
  if (mode === "state") return STATE_HEX[cell.state];
  if (mode === "oxygen") return oxygenHex(cell.oxygen);
  return cloneHue(cell.cloneId);
}
