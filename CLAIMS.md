# Claims

CELL//SHIFT is a **spatial agent toy**. It is not a model of any named cancer,
not calibrated to wet-lab or clinical data, and not a medical device.

| Claim | Status |
| --- | --- |
| Same seed + same rules produce the same trajectory | Measured by `npm test` |
| Protocol **Hypoxic spheroid** (seed 4821, 240 h): mean core O₂ < mean rim O₂, necrotic fraction > 0 | Measured by `npm test` — chamber geometry, not histopathology |
| Same seed, lower adhesion → larger r90 | Measured by `npm test` |
| Experiment hash is a function of seed + env + rules + SHIFT | Measured by `npm test` |
| Same seed + same SHIFT produce the same tissue | Measured by `npm test` |
| SHIFT on C1 does not write into a new mutant clone's traits | Measured by `npm test` |
| Faster C1 cycle raises C1 share vs unshifted C2 (same seed) | Measured by `npm test` |
| Timeline seek restores a recorded 6 h frame; does not replay from t=0 | Measured by `npm test` |
| A receipt of seed+spec+hours replays to the same r90 / core O₂ / necrotic fraction | Measured by `npm test` |
| Pre-registered hypotheses H-core, H-adhesion, H-intact-no-core currently PASS | Measured by `npm test` — chamber geometry only |
| Mutant clones can expand if trait deltas confer a fitness advantage in this chamber | Observable; not a claim about any real driver gene |
| This represents a specific cancer, patient, therapy, or PhysiCell result | **Not claimed** |
| Parameters are physiologically accurate | **Not claimed** |

`UNKNOWN` is preferred to a false scientific sentence.

If a UI label says "tumor-like", it means: clonal expansion, a crowded core,
oxygen falling inward, debris where supply collapses. That is geometry under
rules. It is not histopathology.
