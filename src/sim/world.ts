import { lineageChain, lineageIds } from "./lineage";
import { Rng } from "./rng";
import {
  DEFAULT_CONFIG,
  type Cell,
  type Mutation,
  type MutationGene,
  type Traits,
  type WorldConfig,
  type WorldStats,
} from "./types";

export type World = {
  config: WorldConfig;
  spawnRules: WorldConfig["rules"];
  rng: Rng;
  cells: Cell[];
  hours: number;
  nextId: number;
  nextClone: number;
};

const GENES: MutationGene[] = [
  "cycle_rate",
  "apoptosis_threshold",
  "hypoxia_tolerance",
  "adhesion",
  "motility",
  "uptake",
];

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function baseTraits(rules: WorldConfig["rules"]): Traits {
  return {
    cycleTime: rules.cycleHours,
    oxygenTolerance: 0.28,
    uptake: 1,
    adhesion: rules.adhesion,
    motility: 0.06,
    apoptosisThreshold: rules.deathRate,
  };
}

function applyMutation(traits: Traits, gene: MutationGene, delta: number): Traits {
  const next = { ...traits };
  switch (gene) {
    case "cycle_rate":
      next.cycleTime = clamp(next.cycleTime * (1 - delta), 8, 48);
      break;
    case "apoptosis_threshold":
      next.apoptosisThreshold = clamp(next.apoptosisThreshold * (1 + delta), 0.01, 0.6);
      break;
    case "hypoxia_tolerance":
      next.oxygenTolerance = clamp(next.oxygenTolerance * (1 - delta), 0.04, 0.6);
      break;
    case "adhesion":
      next.adhesion = clamp(next.adhesion * (1 + delta), 0.05, 1.4);
      break;
    case "motility":
      next.motility = clamp(next.motility * (1 + delta), 0.01, 0.5);
      break;
    case "uptake":
      next.uptake = clamp(next.uptake * (1 + delta), 0.3, 2.4);
      break;
  }
  return next;
}

function hashKey(x: number, y: number, z: number, size: number): string {
  return `${Math.floor(x / size)},${Math.floor(y / size)},${Math.floor(z / size)}`;
}

function buildGrid(cells: Cell[], size: number): Map<string, number[]> {
  const grid = new Map<string, number[]>();
  for (let i = 0; i < cells.length; i++) {
    const [x, y, z] = cells[i]!.pos;
    const key = hashKey(x, y, z, size);
    const bucket = grid.get(key);
    if (bucket) bucket.push(i);
    else grid.set(key, [i]);
  }
  return grid;
}

function nearby(
  cells: Cell[],
  grid: Map<string, number[]>,
  pos: [number, number, number],
  size: number,
  radius: number,
): number[] {
  const [x, y, z] = pos;
  const r2 = radius * radius;
  const hits: number[] = [];
  const ix = Math.floor(x / size);
  const iy = Math.floor(y / size);
  const iz = Math.floor(z / size);
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        const bucket = grid.get(`${ix + dx},${iy + dy},${iz + dz}`);
        if (!bucket) continue;
        for (const i of bucket) {
          const p = cells[i]!.pos;
          const ddx = p[0] - x;
          const ddy = p[1] - y;
          const ddz = p[2] - z;
          if (ddx * ddx + ddy * ddy + ddz * ddz <= r2) hits.push(i);
        }
      }
    }
  }
  return hits;
}

function sampleOxygen(
  cell: Cell,
  cells: Cell[],
  neighbors: number[],
  env: WorldConfig["env"],
  chamberRadius: number,
): number {
  const r = Math.hypot(cell.pos[0], cell.pos[1], cell.pos[2]);
  const radial = 0.22 + 0.78 * Math.min(1, r / chamberRadius);
  let consume = 0;
  for (const i of neighbors) {
    const other = cells[i]!;
    if (!other.dead) consume += other.traits.uptake;
  }
  return clamp(
    env.oxygen * radial * (0.4 + 0.6 * env.nutrient) - consume * 0.014,
    0,
    1,
  );
}

export function createWorld(partial: Partial<WorldConfig> = {}): World {
  const config: WorldConfig = {
    ...DEFAULT_CONFIG,
    ...partial,
    env: { ...DEFAULT_CONFIG.env, ...partial.env },
    rules: { ...DEFAULT_CONFIG.rules, ...partial.rules },
  };
  const rng = new Rng(config.seed);
  const cells: Cell[] = [];
  const traits = baseTraits(config.rules);

  for (let i = 0; i < config.founders; i++) {
    const dir = rng.unitSphere();
    const spread = 1.1 + rng.float(0, 0.6);
    cells.push({
      id: i + 1,
      parentId: null,
      cloneId: "C1",
      generation: 0,
      bornAt: 0,
      age: rng.float(0, 6),
      state: "CYCLING",
      pos: [dir[0] * spread, dir[1] * spread, dir[2] * spread],
      cycleProgress: rng.float(0, 0.45),
      traits: { ...traits },
      mutations: [],
      oxygen: config.env.oxygen,
      dead: false,
    });
  }

  return {
    config,
    spawnRules: { ...config.rules },
    rng,
    cells,
    hours: 0,
    nextId: config.founders + 1,
    nextClone: 2,
  };
}

function maybeMutate(world: World, parent: Cell): { traits: Traits; mutations: Mutation[]; cloneId: string } {
  if (!world.rng.chance(world.config.env.mutationRate)) {
    return {
      traits: { ...parent.traits },
      mutations: parent.mutations.map((m) => ({ ...m })),
      cloneId: parent.cloneId,
    };
  }
  const gene = world.rng.pick(GENES);
  const advantageous = gene === "cycle_rate" || gene === "hypoxia_tolerance" || gene === "apoptosis_threshold";
  const magnitude = world.rng.float(0.08, 0.24);
  const delta =
    gene === "apoptosis_threshold"
      ? -magnitude
      : advantageous
        ? magnitude
        : world.rng.chance(0.5)
          ? magnitude
          : -magnitude;
  const mutation: Mutation = { gene, delta };
  return {
    traits: applyMutation(parent.traits, gene, delta),
    mutations: [...parent.mutations, mutation],
    cloneId: `C${world.nextClone++}`,
  };
}

export function step(world: World): void {
  const { config, rng, cells } = world;
  const { dt, cellRadius, chamberRadius, maxCells, env, rules } = config;
  const gridSize = cellRadius * 2.4;
  const grid = buildGrid(cells, gridSize);
  const born: Cell[] = [];

  for (const cell of cells) {
    if (cell.dead) continue;
    const neighbors = nearby(cells, grid, cell.pos, gridSize, cellRadius * 4.2);
    cell.oxygen = sampleOxygen(cell, cells, neighbors, env, chamberRadius);
    cell.age += dt;

    const livingNeighbors = neighbors.filter((i) => !cells[i]!.dead).length;
    const crowded = livingNeighbors >= 14;

    if (cell.oxygen < cell.traits.oxygenTolerance * 0.35) {
      cell.state = "NECROTIC";
      cell.dead = true;
      continue;
    }

    if (cell.oxygen < cell.traits.oxygenTolerance) {
      cell.state = "HYPOXIC";
    } else if (crowded) {
      cell.state = "QUIESCENT";
    } else {
      cell.state = "CYCLING";
    }

    const deathScale = rules.deathRate / Math.max(0.01, world.spawnRules.deathRate);
    const deathP =
      cell.traits.apoptosisThreshold *
      deathScale *
      (dt / 24) *
      (cell.state === "HYPOXIC" ? 3.4 : 1) *
      (1.15 - env.nutrient * 0.3);
    if (rng.chance(deathP)) {
      cell.state = "APOPTOTIC";
      cell.dead = true;
      continue;
    }

    if (cell.state === "CYCLING" || cell.state === "HYPOXIC") {
      const cycleScale = rules.cycleHours / Math.max(6, world.spawnRules.cycleHours);
      const cycleTime = Math.max(6, cell.traits.cycleTime * cycleScale);
      const oxygenFactor = cell.state === "HYPOXIC" ? 0.35 : 0.55 + 0.45 * cell.oxygen;
      const nutrientFactor = 0.45 + 0.55 * env.nutrient;
      cell.cycleProgress += (dt / cycleTime) * oxygenFactor * nutrientFactor;
    }

    if (cell.cycleProgress >= 1 && cells.length + born.length < maxCells && !crowded) {
      cell.cycleProgress = 0;
      const dir = rng.unitSphere();
      const dist = cellRadius * 1.85;
      const childPos: [number, number, number] = [
        cell.pos[0] + dir[0] * dist,
        cell.pos[1] + dir[1] * dist,
        cell.pos[2] + dir[2] * dist,
      ];
      const inherited = maybeMutate(world, cell);
      born.push({
        id: world.nextId++,
        parentId: cell.id,
        cloneId: inherited.cloneId,
        generation: cell.generation + 1,
        bornAt: world.hours + dt,
        age: 0,
        state: "CYCLING",
        pos: childPos,
        cycleProgress: 0,
        traits: inherited.traits,
        mutations: inherited.mutations,
        oxygen: cell.oxygen,
        dead: false,
      });
    }
  }

  for (const child of born) cells.push(child);

  const relax = 2;
  for (let pass = 0; pass < relax; pass++) {
    const g = buildGrid(cells, gridSize);
    for (const cell of cells) {
      if (cell.dead) continue;
      const neighbors = nearby(cells, g, cell.pos, gridSize, cellRadius * 3.2);
      let fx = 0;
      let fy = 0;
      let fz = 0;
      for (const i of neighbors) {
        const other = cells[i]!;
        if (other.id === cell.id) continue;
        const dx = cell.pos[0] - other.pos[0];
        const dy = cell.pos[1] - other.pos[1];
        const dz = cell.pos[2] - other.pos[2];
        const d = Math.hypot(dx, dy, dz) || 0.0001;
        const minD = cellRadius * (other.dead ? 1.4 : 1.95);
        if (d < minD) {
          const push = ((minD - d) / minD) * 0.55;
          fx += (dx / d) * push;
          fy += (dy / d) * push;
          fz += (dz / d) * push;
        } else if (!other.dead && other.cloneId === cell.cloneId) {
          const adhesionScale = rules.adhesion / Math.max(0.05, world.spawnRules.adhesion);
          const pull = cell.traits.adhesion * adhesionScale * 0.012;
          fx -= (dx / d) * pull;
          fy -= (dy / d) * pull;
          fz -= (dz / d) * pull;
        }
      }
      const walk = cell.traits.motility * 0.08;
      const jitter = rng.unitSphere();
      cell.pos[0] += fx + jitter[0] * walk;
      cell.pos[1] += fy + jitter[1] * walk;
      cell.pos[2] += fz + jitter[2] * walk;

      const r = Math.hypot(cell.pos[0], cell.pos[1], cell.pos[2]);
      const maxR = chamberRadius - cellRadius;
      if (r > maxR) {
        const s = maxR / r;
        cell.pos[0] *= s;
        cell.pos[1] *= s;
        cell.pos[2] *= s;
      }
    }
  }

  world.hours += dt;
}

export function replayTo(config: Partial<WorldConfig>, hours: number): World {
  const world = createWorld(config);
  const target = Math.max(0, hours);
  while (world.hours + 1e-9 < target) step(world);
  return world;
}

export function stats(world: World): WorldStats {
  const living = world.cells.filter((c) => !c.dead);
  const mutant = living.filter((c) => c.cloneId !== "C1" || c.mutations.length > 0).length;
  const clones = new Set(world.cells.filter((c) => !c.dead).map((c) => c.cloneId)).size;
  const n = Math.max(1, world.cells.length);
  return {
    hours: world.hours,
    cells: world.cells.length,
    living: living.length,
    mutant,
    mutantPct: living.length ? (mutant / living.length) * 100 : 0,
    deadPct: ((world.cells.length - living.length) / n) * 100,
    clones,
  };
}

export function cellById(world: World, id: number): Cell | undefined {
  return world.cells.find((c) => c.id === id);
}

export { lineageChain, lineageIds };
