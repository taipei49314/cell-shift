# CELL//SHIFT

Change the rules a cell lives by. Run the chamber. Watch a tumor-like mass form
from geometry, not from a story.

```
change cell rules → execute simulation → inspect the structure
```

Open the site. The center is a 3D tissue chamber. Click a cell to read its
state, clone, and mutations. **Trace lineage** lights only its ancestors and
descendants.

This is not a biological model. See [CLAIMS.md](CLAIMS.md).
Personal research questions and locked protocols: [RESEARCH.md](RESEARCH.md).
v1.0 landing contract: [LANDING.md](LANDING.md).

## Run

```bash
npm install
npm test
npm run dev
```

Then open the URL Vite prints (default `http://localhost:5173`).

## Loop

1. Set **Environment** (oxygen, nutrient, mutation rate) and **Cell rules**
   (cycle time, death, adhesion).
2. **RUN**. The seeded world steps in hours, up to 720 h.
3. Click a cell. Read the inspector. Trace the clone's family.

The seed in the header is the whole experiment. Reset with the same seed and
the same sliders and you get the same tissue.

## What the engine actually does

Each cell is an agent with a parent, a clone id, a 3D position, and a small
trait vector (cycle time, oxygen tolerance, uptake, adhesion, motility).

- Oxygen lives on a 24³ reaction–diffusion grid (boundary supply, cell
  consumption). A packed mass can form a hypoxic / necrotic core. That is a
  measured chamber protocol, not a biological calibration.
- Division copies traits. With the mutation rate, a daughter shifts one trait
  and becomes a new clone (`C1 → C2 → C3`).
- Fitter clones (faster cycle, lower apoptosis, higher hypoxia tolerance)
  take space. That is the only "oncogene" here: a number.

Deterministic PRNG: mulberry32. Replay from `t = 0` when you scrub backward.

## Name

Display name is **CELL//SHIFT**. The GitHub repo is `cell-shift` because
`//` is not a legal repository name.

## License

MIT. Simulation, not medicine.
