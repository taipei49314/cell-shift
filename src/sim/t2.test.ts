import { describe, expect, it } from "vitest";
import atlasJson from "../../artifacts/t2/atlas-32.json";
import verdictsJson from "../../artifacts/t2/verdicts.json";
import { T2_ATLAS_SEEDS, type T2Atlas } from "./t2";
import type { Verdict } from "./hypotheses";
import { T2_HYPOTHESES, type T2HypothesisId } from "./t2-hypotheses";

describe("T2 frozen stems", () => {
  it("registers five hypotheses and does not drop ids", () => {
    expect(T2_HYPOTHESES.map((h) => h.id)).toEqual([
      "H99-smalln",
      "H99-early",
      "H2026-pack",
      "Hox-mid",
      "Hcap",
    ]);
  });
});

describe("T2.1 atlas artifact", () => {
  it("exists and has 32 rows per contrast, including known fail seeds", () => {
    const atlas = atlasJson as T2Atlas;
    expect(atlas.seeds).toEqual(T2_ATLAS_SEEDS);
    for (const key of ["adhesion", "motility", "shiftCycle"] as const) {
      const camp = atlas.contrasts[key];
      expect(camp.rows, key).toHaveLength(32);
      expect(camp.rows.map((r) => r.seed)).toEqual(T2_ATLAS_SEEDS);
      const fails = camp.rows.filter((r) => !r.hold);
      expect(camp.held + fails.length).toBe(32);
    }
    const adhesionFails = atlas.contrasts.adhesion.rows.filter((r) => !r.hold).map((r) => r.seed);
    const shiftFails = atlas.contrasts.shiftCycle.rows.filter((r) => !r.hold).map((r) => r.seed);
    const motFails = atlas.contrasts.motility.rows.filter((r) => !r.hold).map((r) => r.seed);
    expect(adhesionFails.length).toBeGreaterThan(0);
    expect(shiftFails.length).toBeGreaterThan(0);
    expect(motFails.length).toBeGreaterThan(0);
    expect(atlas.contrasts.adhesion.held).toBe(32 - adhesionFails.length);
  });
});

describe("T2 verdicts", () => {
  it("has a PASS/FAIL/UNKNOWN for every frozen stem", () => {
    const verdicts = verdictsJson as Record<T2HypothesisId, Verdict>;
    for (const id of T2_HYPOTHESES.map((h) => h.id)) {
      expect(["PASS", "FAIL", "UNKNOWN"]).toContain(verdicts[id]);
    }
    expect(Object.keys(verdicts).sort()).toEqual([...T2_HYPOTHESES.map((h) => h.id)].sort());
  });
});
