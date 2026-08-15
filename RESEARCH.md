# Research (personal, uncalibrated)

CELL//SHIFT is a chamber for asking **structure questions** about local rules.
It is not a model of any named cancer. See [CLAIMS.md](CLAIMS.md).

Method class: off-lattice agents + a coarse 24³ substrate field.
The scientific standard for this class is [PhysiCell](https://github.com/MathCancer/PhysiCell) / BioFVM.
This repo is not a port and does not share their parameters.

## Questions this chamber can answer

1. **Structure** — under this protocol, does oxygen fall inward? Does a necrotic core appear?
2. **Selection** — which clone holds space? What is its share?
3. **Shape** — does lowering adhesion increase r90 (scatter) on the same seed?

Each answer is a number from the current world, not a biological claim.

## What is measured

| Symbol | Definition |
| --- | --- |
| r90 | 90th percentile radius of living cells |
| necrotic fraction | `NECROTIC` cells / all cells |
| core O₂ | mean cell oxygen at r ≤ 0.35 · r90 |
| rim O₂ | mean cell oxygen at r ≥ 0.70 · r90 |
| O₂(r) | binned radial profile |
| experiment hash | FNV-1a of seed + env + rules + SHIFT |
| SHIFT | Overlay deltas on one clone id; new mutant clones do not inherit it |
| clone share series | Living-clone fractions at each 6 h snapshot |

## Locked protocols (`npm test`)

- **Hypoxic spheroid** · seed 4821 · 240 h · `core O₂ < rim O₂` and necrotic fraction > 0
- **Adhesion** · same seed, only adhesion changes · low adhesion r90 > high adhesion r90
- Same seed + same spec → same tissue
- SHIFT C1 `cycle_rate +` vs unshifted C2 → C1 share rises
- Seek to a recorded hour restores that frame (no replay from t=0)

## Protocols in the UI

| Name | Intent in the chamber |
| --- | --- |
| Intact | Tight, well-supplied mass |
| Hypoxic spheroid | Packed mass, inward O₂ drop, necrotic core |
| Invasive | Low adhesion, higher motility, larger r90 |

## Out of scope

Calibration to wet-lab or PhysiCell numbers. Named cancers. Therapy. Immune or vascular agents.
3D showcase is specified in [LANDING.md](LANDING.md) as L3 and is closed until a human opens it.
Unattended depth: [DEPTH.md](DEPTH.md).
