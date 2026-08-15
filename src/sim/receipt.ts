import { experimentHash, type ExperimentSpec } from "./experiment";
import { livingShares, measure, radialProfile, type CloneShare } from "./morphology";
import { shiftActive } from "./shift";
import type { CloneShift, EnvParams, Morphology, RadialBin, RuleParams } from "./types";
import { replayTo, type World } from "./world";

export const RECEIPT_NAME = "CELL//SHIFT";
export const RECEIPT_VERSION = "1.0";

export type Receipt = {
  name: typeof RECEIPT_NAME;
  version: typeof RECEIPT_VERSION;
  hash: string;
  seed: number;
  hours: number;
  env: EnvParams;
  rules: RuleParams;
  shift: CloneShift | null;
  morphology: Morphology;
  profile: RadialBin[];
  cloneShares: CloneShare[];
};

export type VerifyReport = {
  ok: boolean;
  hashMatch: boolean;
  r90: number;
  coreO2: number;
  necroticFrac: number;
};

const ABS = 1e-6;
const REL = 1e-5;

function close(a: number, b: number): boolean {
  const d = Math.abs(a - b);
  return d <= ABS || d <= REL * Math.max(1, Math.abs(a), Math.abs(b));
}

export function specFromReceipt(receipt: Receipt): ExperimentSpec {
  return {
    name: "receipt",
    seed: receipt.seed,
    env: receipt.env,
    rules: receipt.rules,
    shift: receipt.shift,
  };
}

export function issueReceipt(world: World, spec: ExperimentSpec): Receipt {
  const shift = shiftActive(spec.shift) ? spec.shift : null;
  return {
    name: RECEIPT_NAME,
    version: RECEIPT_VERSION,
    hash: experimentHash({ ...spec, shift }),
    seed: spec.seed,
    hours: world.hours,
    env: { ...spec.env },
    rules: { ...spec.rules },
    shift,
    morphology: measure(world.cells),
    profile: radialProfile(world.cells),
    cloneShares: livingShares(world.cells),
  };
}

export function replayReceipt(receipt: Receipt): World {
  return replayTo(
    {
      seed: receipt.seed,
      env: receipt.env,
      rules: receipt.rules,
      shift: receipt.shift,
    },
    receipt.hours,
  );
}

export function verifyReceipt(receipt: Receipt, world: World = replayReceipt(receipt)): VerifyReport {
  const got = measure(world.cells);
  const hash = experimentHash(specFromReceipt(receipt));
  const report: VerifyReport = {
    ok: false,
    hashMatch: hash === receipt.hash,
    r90: got.r90 - receipt.morphology.r90,
    coreO2: got.coreO2 - receipt.morphology.coreO2,
    necroticFrac: got.necroticFrac - receipt.morphology.necroticFrac,
  };
  report.ok =
    report.hashMatch &&
    close(got.r90, receipt.morphology.r90) &&
    close(got.coreO2, receipt.morphology.coreO2) &&
    close(got.necroticFrac, receipt.morphology.necroticFrac);
  return report;
}

export function parseReceipt(raw: unknown): Receipt {
  if (!raw || typeof raw !== "object") throw new Error("receipt is not an object");
  const r = raw as Receipt;
  if (r.name !== RECEIPT_NAME) throw new Error("not a CELL//SHIFT receipt");
  if (typeof r.hash !== "string" || typeof r.seed !== "number" || typeof r.hours !== "number") {
    throw new Error("receipt missing hash/seed/hours");
  }
  return r;
}
