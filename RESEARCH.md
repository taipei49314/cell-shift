# Research (personal, uncalibrated)

CELL//SHIFT is a chamber for asking **structure questions** about local rules.
It is not a model of any named cancer. See [CLAIMS.md](CLAIMS.md).

Method class: off-lattice agents + a coarse 24³ substrate field.
The scientific standard for this class is [PhysiCell](https://github.com/MathCancer/PhysiCell) / BioFVM.
This repo is not a port and does not share their parameters.

## Questions this chamber can answer

1. **Structure** — under this protocol, does oxygen fall inward? Does a necrotic core appear?
2. **Selection** — which clone holds space? What is its share?
3. **Shape** — does lowering adhesion or raising motility increase r90 (scatter) on the same seed?

Each answer is a number from the current world, not a biological claim.

## What is measured

| Symbol | Definition |
| --- | --- |
| r10 / r50 / r90 | living-cell radius percentiles |
| necrotic fraction | `NECROTIC` cells / all cells |
| hypoxic shell | hypoxic / living in 0.35–0.70 · r90 |
| asphericity | std(r) / mean(r) of living cells |
| roughness | (r90 − r10) / r90 |
| clone Shannon | −Σ p ln p over living clones |
| same-clone NN | fraction whose nearest living neighbor is the same clone |
| core O₂ | mean cell oxygen at r ≤ 0.35 · r90 |
| rim O₂ | mean cell oxygen at r ≥ 0.70 · r90 |
| O₂(r) | binned radial profile |
| experiment hash | FNV-1a of seed + env + rules + SHIFT |
| SHIFT | Overlay deltas on one clone id; new mutant clones do not inherit it |
| clone share series | Living-clone fractions at each 6 h snapshot |

## Locked protocols (`npm test`)

- **Hypoxic spheroid** · seed 4821 · 240 h · `core O₂ < rim O₂` and necrotic fraction > 0
- **Hypoxic spheroid multi-seed** · seeds 4821, 7, 21, 99, 2026 · 240 h · every listed seed has `core O₂ < rim O₂` (fail-closed; do not drop a failing seed)
- **Adhesion** · same seed, only adhesion changes · low adhesion r90 > high adhesion r90
- **Adhesion multi-seed** · same contrast · 160 h · 4/5 hold; seed 99 fails (table fail-closed; do not drop)
- **Motility** · same seed, only motility changes · high motility r90 > low motility r90
- **Motility multi-seed** · same contrast · 160 h · 4/5 hold; seed 2026 fails (table fail-closed; do not drop)
- **Invasive vs Intact** · seeds 4821, 7, 21, 99, 2026 · 160 h · every listed seed has Invasive r90 > Intact r90
- **Oxygen endpoints** · hypoxic rules · seed 4821 · 160 h · necrotic fraction at env O₂ 0.4 > at 0.9
- **Oxygen endpoints multi-seed** · same contrast · 160 h · every listed seed has necrotic fraction at env O₂ 0.4 > at 0.9
- **SHIFT cycle multi-seed** · C1 `cycle_rate +` vs unshifted C2 · 90 h · 4/5 hold; seed 99 fails (table fail-closed; do not drop)
- Same seed + same spec → same tissue
- SHIFT C1 `cycle_rate +` vs unshifted C2 → C1 share rises
- Seek to a recorded hour restores that frame (no replay from t=0)
- 16³ cannot resolve Hypoxic core < rim at 80 h; 24³ and 32³ can; 24 vs 32 r90 gap < 35%
- cycle_rate-only mutants are division-born and faster-cycling than C1
- Invasive r90 > Intact; roughness does not separate them; Intact asphericity is larger (seed 4821, 160 h)

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
