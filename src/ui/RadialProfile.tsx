import type { RadialBin } from "../sim/types";
import { fmt } from "./format";

export function RadialProfile({ bins }: { bins: RadialBin[] }) {
  const w = 220;
  const h = 72;
  const pad = 4;
  const maxO2 = Math.max(0.01, ...bins.map((b) => b.o2));
  const maxR = Math.max(0.01, ...bins.map((b) => b.rMid));
  const pts = bins
    .map((b) => {
      const x = pad + (b.rMid / maxR) * (w - pad * 2);
      const y = h - pad - (b.o2 / maxO2) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = bins[bins.length - 1];
  const first = bins[0];
  return (
    <div>
      <svg width={w} height={h} className="block">
        <polyline fill="none" stroke="#7dffc3" strokeWidth="1.4" points={pts} />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-mute">
        <span>core O₂ {fmt(first?.o2 ?? 0)}</span>
        <span>rim O₂ {fmt(last?.o2 ?? 0)}</span>
      </div>
    </div>
  );
}
