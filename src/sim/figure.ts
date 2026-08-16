import { livingShares, measure } from "./morphology";
import type { Cell } from "./types";
import { DEFAULT_CONFIG } from "./types";
import { cellHex, STATE_HEX, type ColorMode } from "../ui/palette";

export type FigureSpec = {
  title: string;
  protocol: string;
  seed: number;
  hours: number;
  clip: number;
  mode: ColorMode;
  width?: number;
  height?: number;
};

const SLICE = DEFAULT_CONFIG.cellRadius * 1.35;

export function sliceCells(cells: readonly Cell[], clip: number): Cell[] {
  return cells.filter((c) => Math.abs(c.pos[2] - clip) <= SLICE);
}

export function renderSectionSvg(cells: readonly Cell[], spec: FigureSpec): string {
  const w = spec.width ?? 720;
  const h = spec.height ?? 560;
  const pad = 56;
  const slice = sliceCells(cells, spec.clip);
  const m = measure(cells);
  const shares = livingShares(cells);
  const xs = slice.map((c) => c.pos[0]);
  const ys = slice.map((c) => c.pos[1]);
  const minX = Math.min(-1, ...xs);
  const maxX = Math.max(1, ...xs);
  const minY = Math.min(-1, ...ys);
  const maxY = Math.max(1, ...ys);
  const span = Math.max(maxX - minX, maxY - minY, 1);
  const scale = (Math.min(w, h) - pad * 2) / span;
  const cx = w / 2;
  const cy = h / 2 + 8;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  const rPx = DEFAULT_CONFIG.cellRadius * scale;
  const empty = new Set<number>();
  const dots = slice
    .map((cell) => {
      const x = cx + (cell.pos[0] - midX) * scale;
      const y = cy - (cell.pos[1] - midY) * scale;
      const fill = cellHex(cell, spec.mode, empty, null);
      const rr = rPx * (cell.state === "NECROTIC" || cell.dead ? 0.62 : 1);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(2)}" fill="${fill}" />`;
    })
    .join("\n");
  const legend =
    spec.mode === "state"
      ? (
          [
            ["NECROTIC", "core"],
            ["HYPOXIC", "shell"],
            ["CYCLING", "rim"],
          ] as const
        )
          .map(([st, label], i) => {
            const x = pad;
            const y = h - 28 - (2 - i) * 16;
            return `<rect x="${x}" y="${y - 8}" width="10" height="10" fill="${STATE_HEX[st]}" /><text x="${x + 16}" y="${y + 1}" fill="#c8d6d1" font-size="11">${st} · ${label}</text>`;
          })
          .join("")
      : shares
          .slice(0, 4)
          .map((s, i) => {
            const y = h - 28 - i * 16;
            return `<text x="${pad}" y="${y}" fill="#c8d6d1" font-size="11">${s.cloneId} ${(s.share * 100).toFixed(0)}%</text>`;
          })
          .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="#07090b"/>
  <text x="${pad}" y="28" fill="#c8d6d1" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="14" letter-spacing="2">CELL//SHIFT</text>
  <text x="${pad}" y="48" fill="#6d7f79" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="11">${spec.protocol} · seed ${spec.seed} · ${spec.hours}h · clip z=${spec.clip} · ${spec.mode}</text>
  <text x="${w - pad}" y="28" text-anchor="end" fill="#7dffc3" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="12">RIM</text>
  <text x="${cx}" y="${cy}" text-anchor="middle" fill="#6d7f79" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="11">CORE</text>
  <g font-family="IBM Plex Mono, ui-monospace, monospace">${dots}</g>
  <g font-family="IBM Plex Mono, ui-monospace, monospace">${legend}</g>
  <text x="${w - pad}" y="${h - 16}" text-anchor="end" fill="#6d7f79" font-family="IBM Plex Mono, ui-monospace, monospace" font-size="10">core O₂ ${m.coreO2.toFixed(2)} · rim O₂ ${m.rimO2.toFixed(2)} · necrotic ${(m.necroticFrac * 100).toFixed(0)}% · not a biological model</text>
</svg>
`;
}
