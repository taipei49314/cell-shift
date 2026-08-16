import type { CloneShare } from "../sim/morphology";
import { cloneHue, fmt } from "./format";

export function CloneLegend({ shares }: { shares: CloneShare[] }) {
  if (!shares.length) return null;
  return (
    <ul className="space-y-1 text-[10px]">
      {shares.slice(0, 8).map((s) => (
        <li className="flex items-center justify-between gap-3" key={s.cloneId}>
          <span className="inline-flex items-center gap-2">
            <i className="inline-block h-2 w-2 rounded-full" style={{ background: cloneHue(s.cloneId) }} />
            {s.cloneId}
          </span>
          <span className="text-mute">
            {s.n} · {fmt(s.share * 100, 0)}%
          </span>
        </li>
      ))}
    </ul>
  );
}
