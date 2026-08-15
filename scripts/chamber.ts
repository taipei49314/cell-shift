/**
 * Headless chamber. Receipts only. Not a biological model.
 *
 *   npx vite-node scripts/chamber.ts run hypoxic 240
 *   npx vite-node scripts/chamber.ts campaign adhesion
 *   npx vite-node scripts/chamber.ts ledger
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { adhesionSweep } from "../src/sim/campaign";
import { PRESETS } from "../src/sim/experiment";
import { HYPOTHESES, runHypothesis } from "../src/sim/hypotheses";
import { issueReceipt } from "../src/sim/receipt";
import { replayTo } from "../src/sim/world";

const [, , cmd = "help", a = "hypoxic", b = "240"] = process.argv;

function write(path: string, value: unknown): string {
  const abs = resolve(path);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, JSON.stringify(value, null, 2) + "\n");
  return abs;
}

if (cmd === "run") {
  const spec = PRESETS[a];
  if (!spec) {
    console.error("unknown protocol:", a, "wanted", Object.keys(PRESETS).join("|"));
    process.exit(1);
  }
  const hours = Number(b) || 240;
  const world = replayTo({ seed: spec.seed, env: spec.env, rules: spec.rules, shift: spec.shift }, hours);
  const receipt = issueReceipt(world, spec);
  const path = write(`artifacts/receipts/${a}-${hours}h-${receipt.hash}.json`, receipt);
  console.log(path);
  console.log(JSON.stringify({ hash: receipt.hash, hours: receipt.hours, morphology: receipt.morphology }, null, 2));
} else if (cmd === "campaign") {
  const camp = adhesionSweep(4821, 120);
  const path = write("artifacts/campaigns/adhesion-sweep.json", camp);
  console.log(path);
} else if (cmd === "ledger") {
  const runs = HYPOTHESES.map(runHypothesis);
  const path = write("artifacts/ledger/hypotheses.json", runs);
  console.log(path);
  for (const r of runs) console.log(r.id, r.verdict);
  if (runs.some((r) => r.verdict !== "PASS")) process.exit(2);
} else {
  console.log("chamber run <intact|hypoxic|invasive> <hours>");
  console.log("chamber campaign adhesion");
  console.log("chamber ledger");
}
