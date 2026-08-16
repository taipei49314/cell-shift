import { describe, expect, it } from "vitest";
import {
  adhesionMultiseed,
  adhesionSweep,
  HYPOXIC_MULTI_SEEDS,
  hypoxicMultiseed,
  invasiveVsIntact,
  motilityMultiseed,
  oxygenEndpointsMultiseed,
  oxygenSweep,
  shiftCycleMultiseed,
} from "./campaign";
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

  it("Hypoxic spheroid multi-seed: every listed seed has coreO2 < rimO2", () => {
    expect([...HYPOXIC_MULTI_SEEDS]).toEqual([4821, 7, 21, 99, 2026]);
    const camp = hypoxicMultiseed(240, HYPOXIC_MULTI_SEEDS);
    expect(camp.rows).toHaveLength(HYPOXIC_MULTI_SEEDS.length);
    const table = camp.rows.map((row, i) => {
      const seed = HYPOXIC_MULTI_SEEDS[i]!;
      expect(row.label).toBe(`seed=${seed}`);
      const { coreO2, rimO2, necroticFrac } = row.morphology;
      return { seed, coreO2, rimO2, necroticFrac, hold: coreO2 < rimO2 };
    });
    const failed = table.filter((row) => !row.hold);
    expect(
      failed,
      `coreO2 < rimO2 failed for seeds: ${failed
        .map((row) => `${row.seed} (coreO2=${row.coreO2} rimO2=${row.rimO2} necrotic=${row.necroticFrac})`)
        .join("; ")}. table=${JSON.stringify(table)}`,
    ).toEqual([]);
  });

  it("adhesion multi-seed reports every listed seed; 4/5 hold; seed 99 stays", () => {
    expect([...HYPOXIC_MULTI_SEEDS]).toEqual([4821, 7, 21, 99, 2026]);
    const camp = adhesionMultiseed(160, HYPOXIC_MULTI_SEEDS);
    expect(camp.seeds).toEqual([...HYPOXIC_MULTI_SEEDS]);
    expect(camp.rows).toHaveLength(HYPOXIC_MULTI_SEEDS.length);
    const table = camp.rows.map((row) => ({
      seed: row.seed,
      low: row.treatmentScore,
      high: row.controlScore,
      hold: row.hold,
    }));
    expect(table.map((r) => r.seed)).toEqual([4821, 7, 21, 99, 2026]);
    expect(
      table.map((r) => r.hold),
      `adhesion r90 table=${JSON.stringify(table)}`,
    ).toEqual([true, true, true, false, true]);
    expect(camp.held).toBe(4);
    expect(table.find((r) => r.seed === 99)?.hold).toBe(false);
  });

  it("motility multi-seed reports every listed seed; 4/5 hold; seed 2026 stays", () => {
    expect([...HYPOXIC_MULTI_SEEDS]).toEqual([4821, 7, 21, 99, 2026]);
    const camp = motilityMultiseed(160, HYPOXIC_MULTI_SEEDS);
    expect(camp.seeds).toEqual([...HYPOXIC_MULTI_SEEDS]);
    expect(camp.rows).toHaveLength(HYPOXIC_MULTI_SEEDS.length);
    const table = camp.rows.map((row) => ({
      seed: row.seed,
      high: row.treatmentScore,
      low: row.controlScore,
      hold: row.hold,
    }));
    expect(table.map((r) => r.seed)).toEqual([4821, 7, 21, 99, 2026]);
    expect(
      table.map((r) => r.hold),
      `motility r90 table=${JSON.stringify(table)}`,
    ).toEqual([true, true, true, true, false]);
    expect(camp.held).toBe(4);
    expect(table.find((r) => r.seed === 2026)?.hold).toBe(false);
  });

  it("Invasive r90 > Intact r90 on every listed seed", () => {
    expect([...HYPOXIC_MULTI_SEEDS]).toEqual([4821, 7, 21, 99, 2026]);
    const camp = invasiveVsIntact(160, HYPOXIC_MULTI_SEEDS);
    expect(camp.rows).toHaveLength(HYPOXIC_MULTI_SEEDS.length);
    const table = camp.rows.map((row) => ({
      seed: row.seed,
      invasive: row.treatmentScore,
      intact: row.controlScore,
      hold: row.hold,
    }));
    const failed = table.filter((row) => !row.hold);
    expect(
      failed,
      `Invasive r90 > Intact r90 failed for seeds: ${failed
        .map((row) => `${row.seed} (invasive=${row.invasive} intact=${row.intact})`)
        .join("; ")}. table=${JSON.stringify(table)}`,
    ).toEqual([]);
  });

  it("oxygen sweep endpoints: 0.4 necroticFrac > 0.9 necroticFrac", () => {
    const camp = oxygenSweep(4821, 160);
    expect(camp.rows).toHaveLength(4);
    expect(camp.rows.map((r) => r.label)).toEqual([
      "oxygen=0.4",
      "oxygen=0.52",
      "oxygen=0.7",
      "oxygen=0.9",
    ]);
    const lo = camp.rows[0]!.morphology.necroticFrac;
    const hi = camp.rows[3]!.morphology.necroticFrac;
    expect(lo, `oxygen 0.4 necrotic=${lo} vs 0.9 necrotic=${hi}`).toBeGreaterThan(hi);
  });

  it("oxygen endpoints multi-seed: necroticFrac at env O₂ 0.4 > 0.9 on every listed seed", () => {
    expect([...HYPOXIC_MULTI_SEEDS]).toEqual([4821, 7, 21, 99, 2026]);
    const camp = oxygenEndpointsMultiseed(160, HYPOXIC_MULTI_SEEDS);
    expect(camp.seeds).toEqual([...HYPOXIC_MULTI_SEEDS]);
    expect(camp.rows).toHaveLength(HYPOXIC_MULTI_SEEDS.length);
    const table = camp.rows.map((row) => ({
      seed: row.seed,
      lo: row.treatmentScore,
      hi: row.controlScore,
      hold: row.hold,
    }));
    expect(table.map((r) => r.seed)).toEqual([4821, 7, 21, 99, 2026]);
    const failed = table.filter((row) => !row.hold);
    expect(
      failed,
      `oxygen 0.4 necrotic > 0.9 necrotic failed for seeds: ${failed
        .map((row) => `${row.seed} (0.4=${row.lo} 0.9=${row.hi})`)
        .join("; ")}. table=${JSON.stringify(table)}`,
    ).toEqual([]);
    expect(camp.held).toBe(5);
  });

  it("SHIFT cycle multi-seed reports every listed seed; 4/5 hold; seed 99 stays", () => {
    expect([...HYPOXIC_MULTI_SEEDS]).toEqual([4821, 7, 21, 99, 2026]);
    const camp = shiftCycleMultiseed(90, HYPOXIC_MULTI_SEEDS);
    expect(camp.seeds).toEqual([...HYPOXIC_MULTI_SEEDS]);
    expect(camp.rows).toHaveLength(HYPOXIC_MULTI_SEEDS.length);
    const table = camp.rows.map((row) => ({
      seed: row.seed,
      shifted: row.treatmentScore,
      plain: row.controlScore,
      hold: row.hold,
    }));
    expect(table.map((r) => r.seed)).toEqual([4821, 7, 21, 99, 2026]);
    expect(
      table.map((r) => r.hold),
      `SHIFT C1 share table=${JSON.stringify(table)}`,
    ).toEqual([true, true, true, false, true]);
    expect(camp.held).toBe(4);
    expect(table.find((r) => r.seed === 99)?.hold).toBe(false);
  });
});
