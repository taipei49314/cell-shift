import { describe, expect, it } from "vitest";
import { adhesionSweep } from "./campaign";
import { PRESETS } from "./experiment";
import { HYPOTHESES, runHypothesis } from "./hypotheses";
import { issueReceipt, parseReceipt, replayReceipt, verifyReceipt } from "./receipt";
import { replayTo } from "./world";

describe("receipts", () => {
  it("round-trips Hypoxic spheroid 240 h", () => {
    const spec = PRESETS.hypoxic;
    const world = replayTo({ seed: spec.seed, env: spec.env, rules: spec.rules }, 240);
    const receipt = issueReceipt(world, spec);
    expect(receipt.hash).toMatch(/^[0-9a-f]{8}$/);
    const again = replayReceipt(receipt);
    const report = verifyReceipt(receipt, again);
    expect(report.hashMatch).toBe(true);
    expect(report.ok).toBe(true);
    const parsed = parseReceipt(JSON.parse(JSON.stringify(receipt)));
    expect(parsed.hash).toBe(receipt.hash);
  });
});

describe("hypothesis ledger", () => {
  it("scores the three pre-registered items", () => {
    const runs = HYPOTHESES.map(runHypothesis);
    expect(runs).toHaveLength(3);
    expect(runs.every((r) => r.verdict === "PASS")).toBe(true);
  });
});

describe("campaigns", () => {
  it("adhesion sweep is monotone in r90", () => {
    const camp = adhesionSweep(4821, 80);
    expect(camp.rows).toHaveLength(4);
    const r90 = camp.rows.map((r) => r.morphology.r90);
    expect(r90[0]!).toBeGreaterThan(r90[r90.length - 1]!);
  });
});
