import { cloneHue } from "./format";

type Point = { hours: number; shares: { cloneId: string; share: number }[] };

export function CloneSeries({ series }: { series: Point[] }) {
  const w = 280;
  const h = 36;
  if (series.length < 2) {
    return <p className="text-[10px] text-mute">clone share appears after the first snapshots</p>;
  }
  const clones = [...new Set(series.flatMap((p) => p.shares.map((s) => s.cloneId)))].slice(0, 6);
  const maxH = Math.max(1, ...series.map((p) => p.hours));
  return (
    <svg width={w} height={h} className="block">
      {clones.map((id) => {
        const pts = series
          .map((p) => {
            const share = p.shares.find((s) => s.cloneId === id)?.share ?? 0;
            const x = (p.hours / maxH) * (w - 2) + 1;
            const y = h - 1 - share * (h - 2);
            return `${x.toFixed(1)},${y.toFixed(1)}`;
          })
          .join(" ");
        return <polyline key={id} fill="none" stroke={cloneHue(id)} strokeWidth="1.3" points={pts} />;
      })}
    </svg>
  );
}
