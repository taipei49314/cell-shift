/** Play the chamber the way a user does. Prints what you would see. */
import { PRESETS } from "../src/sim/experiment";
import { issueReceipt, verifyReceipt } from "../src/sim/receipt";
import { lineageIds } from "../src/sim/lineage";
import { livingShares, measure } from "../src/sim/morphology";
import { sliceCells } from "../src/sim/figure";
import { createWorld, replayTo, seekTo, step } from "../src/sim/world";

function ms(t0: number): string {
  return `${(performance.now() - t0).toFixed(0)} ms`;
}

function show(label: string, world: ReturnType<typeof createWorld>): void {
  const m = measure(world.cells, { neighbors: false });
  const shares = livingShares(world.cells);
  console.log(`\n[${label}] t=${world.hours}h cells=${world.cells.length}`);
  console.log(
    `  r90 ${m.r90.toFixed(2)}  necrotic ${(m.necroticFrac * 100).toFixed(0)}%  O2 core/rim ${m.coreO2.toFixed(2)}/${m.rimO2.toFixed(2)}  shell ${m.hypoxicShell.toFixed(2)}`,
  );
  console.log(
    `  clones ${shares.map((s) => `${s.cloneId} ${(s.share * 100).toFixed(0)}%`).join(" · ") || "—"}`,
  );
}

const page = await fetch("http://127.0.0.1:5173/").then((r) => ({ ok: r.ok, status: r.status }));
console.log(`1. Open http://127.0.0.1:5173/ → HTTP ${page.status}`);

let t0 = performance.now();
const boot = PRESETS.hypoxic;
const world = replayTo({ seed: boot.seed, env: boot.env, rules: boot.rules }, 240);
console.log(`2. Boot Hypoxic spheroid 4821 / 240h (what the page does) → ${ms(t0)}`);
show("first paint", world);

const living = world.cells.filter((c) => !c.dead);
const pick = living[Math.floor(living.length / 2)] ?? world.cells[0]!;
console.log(`\n3. Click cell #${pick.id}`);
console.log(`   State ${pick.state}  Clone ${pick.cloneId}  Gen ${pick.generation}  Parent ${pick.parentId ?? "founder"}`);
console.log(`   Cycle ${pick.traits.cycleTime.toFixed(1)}h  O2 ${pick.oxygen.toFixed(2)}  Age ${pick.age.toFixed(1)}h`);

const fam = lineageIds(world.cells, pick.id);
console.log(`4. TRACE LINEAGE → ${fam.size} cells lit (ancestors + descendants)`);

const slice = sliceCells(world.cells, 0);
const core = slice.filter((c) => c.state === "NECROTIC").length;
const rim = slice.filter((c) => c.state === "HYPOXIC" || c.state === "CYCLING").length;
console.log(`5. Color STATE, clip z=0 → slice ${slice.length} cells, necrotic ${core}, rim-like ${rim}`);
if (core === 0 || rim === 0) console.log("   PROBLEM: midplane does not show both core and rim.");

t0 = performance.now();
seekTo(world, 180);
console.log(`6. Drag timeline to 180h → ${ms(t0)} now t=${world.hours}h cells=${world.cells.length}`);

t0 = performance.now();
const reset = createWorld({ seed: boot.seed, env: boot.env, rules: boot.rules });
console.log(`7. RESET → ${ms(t0)} now t=${reset.hours}h cells=${reset.cells.length} (mass gone, founders only)`);

t0 = performance.now();
for (let i = 0; i < 16; i++) step(reset);
console.log(`8. RUN 16x one frame (16 steps) from t=0 → ${ms(t0)} now t=${reset.hours}h cells=${reset.cells.length}`);

t0 = performance.now();
for (let i = 0; i < 60; i++) step(reset);
console.log(`   then 60 more steps (~1s at 1x) → ${ms(t0)} now t=${reset.hours}h cells=${reset.cells.length}`);

const grown = replayTo({ seed: boot.seed, env: boot.env, rules: boot.rules }, 240);
const receipt = issueReceipt(grown, boot);
const check = verifyReceipt(receipt);
console.log(`9. EXPORT RECEIPT hash=${receipt.hash} verify=${check.ok ? "PASS" : "FAIL"}`);

const armed = replayTo(
  { seed: boot.seed, env: boot.env, rules: boot.rules, shift: { cloneId: "C1", deltas: { cycle_rate: 0.3 } } },
  80,
);
show("10. ARM C1 cycle_rate +30% then RESET+RUN to 80h", armed);
