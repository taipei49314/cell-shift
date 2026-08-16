import type { ReactNode } from "react";
import { GENES, HORIZON_HOURS } from "./sim/types";
import { CloneSeries } from "./ui/CloneSeries";
import { cloneHue, fmt, mutationLine, signedPct } from "./ui/format";
import { RadialProfile } from "./ui/RadialProfile";
import { TissueChamber } from "./ui/TissueChamber";
import { useSimulation } from "./ui/useSimulation";

function SliderRow(props: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  numeric: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-[11px] tracking-wide">
      <span className="text-mute">{props.label}</span>
      <span className="text-live text-right">{props.value}</span>
      <input
        className="col-span-2"
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.numeric}
        onChange={(e) => props.onChange(Number(e.target.value))}
      />
    </label>
  );
}

export function App() {
  const sim = useSimulation();
  const { view } = sim;
  const cell = view.selected;
  const hours = view.stats.hours;

  return (
    <div className="flex h-full flex-col text-[12px]">
      <header className="panel flex items-center justify-between px-4 py-2">
        <div className="text-[15px] font-medium tracking-[0.28em]">
          CELL<span className="text-live">//</span>SHIFT
        </div>
        <div className="flex items-center gap-2">
          <button className="btn" data-on={sim.running} onClick={sim.run} type="button">
            RUN
          </button>
          <button className="btn" data-on={!sim.running} onClick={sim.pause} type="button">
            PAUSE
          </button>
          <button className="btn" onClick={() => sim.reset()} type="button">
            RESET
          </button>
          <label className="ml-3 flex items-center gap-2 text-mute">
            Seed
            <input
              className="w-20 border border-line bg-void px-2 py-1 text-ink outline-none"
              type="number"
              value={sim.seed}
              onChange={(e) => sim.setSeed(Number(e.target.value) || 0)}
            />
          </label>
          <span className="ml-3 text-[10px] tracking-wide text-mute">
            exp {view.hash}
          </span>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[240px_minmax(0,1fr)_260px]">
        <aside className="panel flex flex-col gap-6 overflow-auto p-4">
          <section className="space-y-2">
            <h2 className="text-[11px] tracking-[0.22em] text-mute">PROTOCOL</h2>
            <div className="flex flex-col gap-1">
              {Object.entries(sim.presets).map(([id, spec]) => (
                <button className="btn text-left" key={id} onClick={() => sim.loadPreset(spec)} type="button">
                  {spec.name}
                </button>
              ))}
            </div>
          </section>
          <section className="space-y-4">
            <h2 className="text-[11px] tracking-[0.22em] text-mute">ENVIRONMENT</h2>
            <SliderRow
              label="Oxygen"
              value={`${Math.round(sim.env.oxygen * 100)}%`}
              min={10}
              max={100}
              step={1}
              numeric={sim.env.oxygen * 100}
              onChange={(n) => sim.setEnv({ ...sim.env, oxygen: n / 100 })}
            />
            <SliderRow
              label="Nutrient"
              value={`${Math.round(sim.env.nutrient * 100)}%`}
              min={10}
              max={100}
              step={1}
              numeric={sim.env.nutrient * 100}
              onChange={(n) => sim.setEnv({ ...sim.env, nutrient: n / 100 })}
            />
            <SliderRow
              label="Mutation"
              value={`${(sim.env.mutationRate * 100).toFixed(1)}%`}
              min={0}
              max={5}
              step={0.1}
              numeric={sim.env.mutationRate * 100}
              onChange={(n) => sim.setEnv({ ...sim.env, mutationRate: n / 100 })}
            />
          </section>
          <section className="space-y-4">
            <h2 className="text-[11px] tracking-[0.22em] text-mute">CELL RULES</h2>
            <SliderRow
              label="Cycle"
              value={`${sim.rules.cycleHours}h`}
              min={8}
              max={48}
              step={1}
              numeric={sim.rules.cycleHours}
              onChange={(n) => sim.setRules({ ...sim.rules, cycleHours: n })}
            />
            <SliderRow
              label="Death"
              value={fmt(sim.rules.deathRate, 2)}
              min={0.01}
              max={0.4}
              step={0.01}
              numeric={sim.rules.deathRate}
              onChange={(n) => sim.setRules({ ...sim.rules, deathRate: n })}
            />
            <SliderRow
              label="Adhesion"
              value={fmt(sim.rules.adhesion, 2)}
              min={0.1}
              max={1.2}
              step={0.05}
              numeric={sim.rules.adhesion}
              onChange={(n) => sim.setRules({ ...sim.rules, adhesion: n })}
            />
            <SliderRow
              label="Motility"
              value={fmt(sim.rules.motility, 2)}
              min={0.01}
              max={0.4}
              step={0.01}
              numeric={sim.rules.motility}
              onChange={(n) => sim.setRules({ ...sim.rules, motility: n })}
            />
          </section>
          <section className="space-y-3">
            <h2 className="text-[11px] tracking-[0.22em] text-mute">SHIFT</h2>
            <label className="grid grid-cols-[1fr_auto] items-center gap-2 text-[11px]">
              <span className="text-mute">Clone</span>
              <input
                className="w-16 border border-line bg-void px-1 py-0.5 text-right text-ink outline-none"
                value={sim.shift.cloneId}
                onChange={(e) => sim.setShift({ ...sim.shift, cloneId: e.target.value.toUpperCase() })}
              />
            </label>
            {cell && (
              <button className="btn w-full" onClick={() => sim.armClone(cell.cloneId)} type="button">
                ARM {cell.cloneId}
              </button>
            )}
            {GENES.map((gene) => (
              <SliderRow
                key={gene}
                label={gene}
                value={signedPct(sim.shift.deltas[gene] ?? 0)}
                min={-40}
                max={40}
                step={1}
                numeric={Math.round((sim.shift.deltas[gene] ?? 0) * 100)}
                onChange={(n) =>
                  sim.setShift({
                    ...sim.shift,
                    deltas: { ...sim.shift.deltas, [gene]: n / 100 },
                  })
                }
              />
            ))}
            <p className="text-[10px] text-mute">
              {sim.armed ? `Armed on ${sim.armed.cloneId}. RESET writes it in.` : "No SHIFT armed. RESET uses wild type."}
            </p>
          </section>
          <section className="space-y-2">
            <h2 className="text-[11px] tracking-[0.22em] text-mute">O₂(r)</h2>
            <RadialProfile bins={view.profile} />
          </section>
          <p className="mt-auto text-[10px] leading-relaxed text-mute">
            Spatial agent toy. Not a biological model. Same seed + same rules =
            same tissue.
          </p>
        </aside>

        <main className="relative min-h-0 bg-void">
          <div className="pointer-events-none absolute left-4 top-4 z-10 text-[10px] tracking-[0.2em] text-mute">
            3D TISSUE
          </div>
          <TissueChamber
            worldRef={sim.worldRef}
            selectedId={sim.selectedId}
            lineageMode={sim.lineageMode}
            lineageSet={sim.lineageSet}
            onSelect={sim.select}
          />
        </main>

        <aside className="panel flex flex-col gap-5 overflow-auto p-4">
          <section>
            <h2 className="mb-3 text-[11px] tracking-[0.22em] text-mute">CELL INSPECTOR</h2>
            {cell ? (
              <div className="space-y-3">
                <div className="text-[15px] tracking-wide">Cell #{cell.id}</div>
                <Row k="State" v={cell.state} />
                <Row
                  k="Clone"
                  v={
                    <span className="inline-flex items-center gap-2">
                      <i
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ background: cloneHue(cell.cloneId) }}
                      />
                      {cell.cloneId}
                    </span>
                  }
                />
                <Row k="Generation" v={String(cell.generation)} />
                <Row k="Parent" v={cell.parentId === null ? "founder" : `#${cell.parentId}`} />
                <div className="my-3 h-px bg-line" />
                <Row k="Cycle time" v={`${fmt((view.effective ?? cell.traits).cycleTime, 1)} h`} />
                <Row k="Oxygen tolerance" v={fmt((view.effective ?? cell.traits).oxygenTolerance)} />
                <Row k="Uptake" v={fmt((view.effective ?? cell.traits).uptake)} />
                <Row k="Adhesion" v={fmt((view.effective ?? cell.traits).adhesion)} />
                <Row k="Motility" v={fmt((view.effective ?? cell.traits).motility)} />
                <div className="pt-2 text-[10px] text-mute">
                  Age {fmt(cell.age, 1)} h · O₂ {fmt(cell.oxygen)}
                </div>
              </div>
            ) : (
              <p className="text-mute">Click a cell in the chamber.</p>
            )}
          </section>

          {cell && (
            <section>
              <h2 className="mb-2 text-[11px] tracking-[0.22em] text-mute">MUTATIONS</h2>
              {cell.mutations.length === 0 ? (
                <p className="text-mute">none — wild type</p>
              ) : (
                <ul className="space-y-1 text-[11px]">
                  {cell.mutations.map((m, i) => (
                    <li key={`${m.gene}-${i}`} className="tree-line">
                      {i === cell.mutations.length - 1 ? "└─" : "├─"} {mutationLine(m)}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section>
            <h2 className="mb-2 text-[11px] tracking-[0.22em] text-mute">LINEAGE</h2>
            <p className="text-[11px]">{view.chain.length ? view.chain.join(" → ") : "—"}</p>
            <div className="mt-3 flex gap-2">
              <button className="btn" disabled={!cell} onClick={sim.traceLineage} type="button">
                TRACE LINEAGE
              </button>
              {sim.lineageMode && (
                <button className="btn" onClick={sim.clearLineage} type="button">
                  CLEAR
                </button>
              )}
            </div>
          </section>
        </aside>
      </div>

      <footer className="panel space-y-2 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="w-8 text-mute">0h</span>
          <input
            className="flex-1"
            type="range"
            min={0}
            max={HORIZON_HOURS}
            step={1}
            value={Math.min(hours, HORIZON_HOURS)}
            onChange={(e) => sim.seekHours(Number(e.target.value))}
          />
          <span className="w-12 text-right text-mute">{HORIZON_HOURS}h</span>
          {([1, 4, 16] as const).map((n) => (
            <button className="btn" data-on={sim.speed === n} key={n} onClick={() => sim.setSpeed(n)} type="button">
              {n}x
            </button>
          ))}
        </div>
        <CloneSeries series={view.series} />
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" disabled={!sim.armed} onClick={() => sim.compare("shift")} type="button">
            VS NO SHIFT
          </button>
          <button className="btn" onClick={() => sim.compare("adhesion")} type="button">
            VS ADHESION
          </button>
          <button
            className="btn"
            onClick={() => {
              const receipt = sim.exportReceipt();
              const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `cell-shift-${receipt.hash}-${receipt.hours}h.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            type="button"
          >
            EXPORT RECEIPT
          </button>
          <label className="btn">
            LOAD
            <input
              accept="application/json"
              className="hidden"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                void file.text().then((text) => sim.loadReceipt(JSON.parse(text)));
              }}
            />
          </label>
          {sim.contrast && (
            <span className="text-[10px] text-mute">
              {sim.contrast.label}: r90 {fmt(sim.contrast.morphology.r90, 2)} · necrotic{" "}
              {fmt(sim.contrast.morphology.necroticFrac * 100, 0)}% · {sim.contrast.morphology.dominantClone}{" "}
              {fmt(sim.contrast.morphology.dominantShare * 100, 0)}%
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-8 gap-y-1 text-[11px] text-mute">
          <span>
            Cells: <em className="not-italic text-ink">{view.stats.cells.toLocaleString()}</em>
          </span>
          <span>
            r90: <em className="not-italic text-ink">{fmt(view.morphology.r90, 2)}</em>
          </span>
          <span>
            Necrotic: <em className="not-italic text-ink">{fmt(view.morphology.necroticFrac * 100, 0)}%</em>
          </span>
          <span>
            Shell: <em className="not-italic text-ink">{fmt(view.morphology.hypoxicShell, 2)}</em>
          </span>
          <span>
            Rough: <em className="not-italic text-ink">{fmt(view.morphology.roughness, 2)}</em>
          </span>
          <span>
            Asph: <em className="not-italic text-ink">{fmt(view.morphology.asphericity, 2)}</em>
          </span>
          <span>
            H: <em className="not-italic text-ink">{fmt(view.morphology.cloneShannon, 2)}</em>
          </span>
          <span>
            O₂ core/rim:{" "}
            <em className="not-italic text-ink">
              {fmt(view.morphology.coreO2)} / {fmt(view.morphology.rimO2)}
            </em>
          </span>
          <span>
            Clone {view.morphology.dominantClone}:{" "}
            <em className="not-italic text-live">{fmt(view.morphology.dominantShare * 100, 0)}%</em>
          </span>
          <span>
            Mutant: <em className="not-italic text-mut">{fmt(view.stats.mutantPct, 0)}%</em>
          </span>
          <span className="ml-auto text-ink">{fmt(hours, 0)}h</span>
        </div>
      </footer>
    </div>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 text-[11px]">
      <span className="text-mute">{k}</span>
      <span className="text-right">{v}</span>
    </div>
  );
}
