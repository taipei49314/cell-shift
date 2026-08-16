# Claims

CELL//SHIFT is a **spatial agent toy**. It is not a model of any named cancer,
not calibrated to wet-lab or clinical data, and not a medical device.

| Claim | Status |
| --- | --- |
| Same seed + same rules produce the same trajectory | Measured by `npm test` |
| Protocol **Hypoxic spheroid** (seed 4821, 240 h): mean core O₂ < mean rim O₂, necrotic fraction > 0 | Measured by `npm test` — chamber geometry, not histopathology |
| Protocol **Hypoxic spheroid** (seeds 4821, 7, 21, 99, 2026, 240 h): mean core O₂ < mean rim O₂ on every listed seed | Measured by `npm test` — fail-closed; chamber geometry, not histopathology |
| Same seed, lower adhesion → larger r90 | Measured by `npm test` |
| Same adhesion contrast (0.15 vs 1.1, 160 h) on seeds 4821, 7, 21, 99, 2026: low r90 > high r90 on 4/5; seed 99 fails | Measured by `npm test` — table fail-closed; do not drop a failing seed |
| Same seed, higher motility → larger r90 | Measured by `npm test` |
| Same motility contrast (0.22 vs 0.03, 160 h) on seeds 4821, 7, 21, 99, 2026: high r90 > low r90 on 4/5; seed 2026 fails | Measured by `npm test` — table fail-closed; do not drop a failing seed |
| Protocol **Invasive** vs **Intact** (seeds 4821, 7, 21, 99, 2026, 160 h): Invasive r90 > Intact r90 on every listed seed | Measured by `npm test` — fail-closed; chamber geometry, not invasion biology |
| Same seed 4821, hypoxic rules, env O₂ 0.4 vs 0.9 (160 h): necrotic fraction is larger at 0.4 | Measured by `npm test` — one-factor chamber geometry |
| Same oxygen contrast (env O₂ 0.4 vs 0.9, hypoxic rules, 160 h) on seeds 4821, 7, 21, 99, 2026: necrotic fraction is larger at 0.4 on every listed seed | Measured by `npm test` — fail-closed; one-factor chamber geometry |
| Experiment hash is a function of seed + env + rules + SHIFT | Measured by `npm test` |
| Same seed + same SHIFT produce the same tissue | Measured by `npm test` |
| SHIFT on C1 does not write into a new mutant clone's traits | Measured by `npm test` |
| Faster C1 cycle raises C1 share vs unshifted C2 (same seed) | Measured by `npm test` |
| Timeline seek restores a recorded 6 h frame; does not replay from t=0 | Measured by `npm test` |
| A receipt of seed+spec+hours replays to the same r90 / core O₂ / necrotic fraction | Measured by `npm test` |
| Pre-registered hypotheses H-core, H-adhesion, H-intact-no-core currently PASS | Measured by `npm test` — chamber geometry only |
| 16³ cannot resolve Hypoxic core < rim at 80 h; 24³ and 32³ can; 24 vs 32 r90 relative gap < 35% | Measured by `npm test` — 24³ is the default, not a continuum limit |
| cycle_rate-only mutants are born from a parent and have a shorter cycle than C1 | Measured by `npm test` — division-born clones, not relabeled founders |
| Morphology includes r10/r50/r90, hypoxic shell, asphericity, roughness; Hypoxic shell > 0; Invasive r90 > Intact while roughness does not separate them (seed 4821, 160 h) | Measured by `npm test` |
| Hypoxic spheroid 4821 / 240 h midplane SVG contains necrotic core and rim state colors | Measured by `npm test` + `npm run figure` — chamber figure, not histopathology |
| Mutant clones can expand if trait deltas confer a fitness advantage in this chamber | Observable; not a claim about any real driver gene |
| This represents a specific cancer, patient, therapy, or PhysiCell result | **Not claimed** |
| Parameters are physiologically accurate | **Not claimed** |

`UNKNOWN` is preferred to a false scientific sentence.

If a UI label says "tumor-like", it means: clonal expansion, a crowded core,
oxygen falling inward, debris where supply collapses. That is geometry under
rules. It is not histopathology.
