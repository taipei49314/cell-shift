import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PRESETS } from "../src/sim/experiment";
import { renderSectionSvg } from "../src/sim/figure";
import { replayTo } from "../src/sim/world";

const spec = PRESETS.hypoxic;
const hours = 240;
const world = replayTo({ seed: spec.seed, env: spec.env, rules: spec.rules }, hours);
const svg = renderSectionSvg(world.cells, {
  title: "CELL//SHIFT",
  protocol: spec.name,
  seed: spec.seed,
  hours,
  clip: 0,
  mode: "state",
});
const out = resolve("docs/figures/hypoxic-4821-240h-state.svg");
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg);
console.log(out);
