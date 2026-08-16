/**
 * Headless chamber. Receipts only. Not a biological model.
 *
 *   npx vite-node scripts/chamber.ts run hypoxic 240
 *   npx vite-node scripts/chamber.ts campaign adhesion
 *   npx vite-node scripts/chamber.ts campaign hypoxic-seeds
 *   npx vite-node scripts/chamber.ts campaign adhesion-seeds
 *   npx vite-node scripts/chamber.ts campaign invasive-intact
 *   npx vite-node scripts/chamber.ts campaign oxygen
 *   npx vite-node scripts/chamber.ts campaign oxygen-seeds
 *   npx vite-node scripts/chamber.ts campaign motility-seeds
 *   npx vite-node scripts/chamber.ts campaign shift-seeds
 *   npx vite-node scripts/chamber.ts ledger
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import {
  adhesionMultiseed,
  adhesionSweep,
  hypoxicMultiseed,
  invasiveVsIntact,
  motilityMultiseed,
  oxygenEndpointsMultiseed,
  oxygenSweep,
  shiftCycleMultiseed,
} from "../src/sim/campaign";
import { PRESETS, specConfig } from "../src/sim/experiment";
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
  const hours = Number(b) || spec.viewHours || 240;
  const world = replayTo(specConfig(spec), hours);
  const receipt = issueReceipt(world, spec);
  const path = write(`artifacts/receipts/${a}-${hours}h-${receipt.hash}.json`, receipt);
  console.log(path);
  console.log(JSON.stringify({ hash: receipt.hash, hours: receipt.hours, morphology: receipt.morphology }, null, 2));
} else if (cmd === "campaign") {
  if (a === "hypoxic-seeds" || a === "hypoxic-multiseed") {
    const camp = hypoxicMultiseed(240);
    const path = write("artifacts/campaigns/hypoxic-multiseed.json", camp);
    console.log(path);
    for (const row of camp.rows) {
      const m = row.morphology;
      const hold = m.coreO2 < m.rimO2;
      console.log(
        row.label,
        "coreO2",
        m.coreO2,
        "rimO2",
        m.rimO2,
        "necrotic",
        m.necroticFrac,
        hold ? "HOLD" : "FAIL",
      );
    }
  } else if (a === "adhesion-seeds" || a === "adhesion-multiseed") {
    const camp = adhesionMultiseed(160);
    const path = write("artifacts/campaigns/adhesion-multiseed.json", camp);
    console.log(path);
    console.log(`held ${camp.held}/${camp.rows.length}`);
    for (const row of camp.rows) {
      console.log(row.seed, "low", row.treatmentScore, "high", row.controlScore, row.hold ? "HOLD" : "FAIL");
    }
  } else if (a === "motility-seeds" || a === "motility-multiseed") {
    const camp = motilityMultiseed(160);
    const path = write("artifacts/campaigns/motility-multiseed.json", camp);
    console.log(path);
    console.log(`held ${camp.held}/${camp.rows.length}`);
    for (const row of camp.rows) {
      console.log(row.seed, "high", row.treatmentScore, "low", row.controlScore, row.hold ? "HOLD" : "FAIL");
    }
  } else if (a === "invasive-intact") {
    const camp = invasiveVsIntact(160);
    const path = write("artifacts/campaigns/invasive-intact.json", camp);
    console.log(path);
    console.log(`held ${camp.held}/${camp.rows.length}`);
    for (const row of camp.rows) {
      console.log(row.seed, "invasive", row.treatmentScore, "intact", row.controlScore, row.hold ? "HOLD" : "FAIL");
    }
  } else if (a === "oxygen") {
    const camp = oxygenSweep(4821, 160);
    const path = write("artifacts/campaigns/oxygen-sweep.json", camp);
    console.log(path);
    for (const row of camp.rows) {
      console.log(row.label, "necrotic", row.morphology.necroticFrac, "o2Drop", row.morphology.o2Drop);
    }
  } else if (a === "oxygen-seeds" || a === "oxygen-endpoints") {
    const camp = oxygenEndpointsMultiseed(160);
    const path = write("artifacts/campaigns/oxygen-endpoints-multiseed.json", camp);
    console.log(path);
    console.log(`held ${camp.held}/${camp.rows.length}`);
    for (const row of camp.rows) {
      console.log(row.seed, "o2=0.4", row.treatmentScore, "o2=0.9", row.controlScore, row.hold ? "HOLD" : "FAIL");
    }
  } else if (a === "shift-seeds" || a === "shift-cycle") {
    const camp = shiftCycleMultiseed(90);
    const path = write("artifacts/campaigns/shift-cycle-multiseed.json", camp);
    console.log(path);
    console.log(`held ${camp.held}/${camp.rows.length}`);
    for (const row of camp.rows) {
      console.log(row.seed, "shifted", row.treatmentScore, "plain", row.controlScore, row.hold ? "HOLD" : "FAIL");
    }
  } else {
    const camp = adhesionSweep(4821, 120);
    const path = write("artifacts/campaigns/adhesion-sweep.json", camp);
    console.log(path);
  }
} else if (cmd === "t2-atlas") {
  const { atlasSummary, buildT2Atlas } = await import("../src/sim/t2");
  const atlas = buildT2Atlas();
  const path = write("artifacts/t2/atlas-32.json", atlas);
  console.log(path);
  console.log(JSON.stringify(atlasSummary(atlas), null, 2));
} else if (cmd === "t2-close") {
  const { closeT2 } = await import("../src/sim/t2-close");
  const out = closeT2();
  write("artifacts/t2/seed-99.json", out.autopsy99);
  write("artifacts/t2/seed-2026.json", out.autopsy2026);
  write("artifacts/t2/oxygen-grid.json", out.oxygen);
  write("artifacts/t2/ceiling.json", out.ceiling);
  const vpath = write("artifacts/t2/verdicts.json", out.verdicts);
  console.log(vpath);
  console.log(JSON.stringify(out.verdicts, null, 2));
} else if (cmd === "ledger") {
  const runs = HYPOTHESES.map(runHypothesis);
  const path = write("artifacts/ledger/hypotheses.json", runs);
  console.log(path);
  for (const r of runs) console.log(r.id, r.verdict);
  if (runs.some((r) => r.verdict !== "PASS")) process.exit(2);
} else {
  console.log("chamber run <intact|hypoxic|invasive> <hours>");
  console.log(
    "chamber campaign adhesion|hypoxic-seeds|adhesion-seeds|invasive-intact|oxygen|oxygen-seeds|motility-seeds|shift-seeds",
  );
  console.log("chamber ledger");
  console.log("chamber t2-atlas");
  console.log("chamber t2-close");
}
