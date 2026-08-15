export type CellState =
  | "QUIESCENT"
  | "CYCLING"
  | "HYPOXIC"
  | "APOPTOTIC"
  | "NECROTIC"
  | "DEAD";

export type MutationGene =
  | "cycle_rate"
  | "apoptosis_threshold"
  | "hypoxia_tolerance"
  | "adhesion"
  | "motility"
  | "uptake";

export type Mutation = {
  gene: MutationGene;
  delta: number;
};

export type Traits = {
  cycleTime: number;
  oxygenTolerance: number;
  uptake: number;
  adhesion: number;
  motility: number;
  apoptosisThreshold: number;
};

export type Cell = {
  id: number;
  parentId: number | null;
  cloneId: string;
  generation: number;
  bornAt: number;
  age: number;
  state: CellState;
  pos: [number, number, number];
  cycleProgress: number;
  traits: Traits;
  mutations: Mutation[];
  oxygen: number;
  dead: boolean;
};

export type EnvParams = {
  oxygen: number;
  nutrient: number;
  mutationRate: number;
};

export type RuleParams = {
  cycleHours: number;
  deathRate: number;
  adhesion: number;
  motility: number;
};

export type CloneShift = {
  cloneId: string;
  deltas: Partial<Record<MutationGene, number>>;
};

export type WorldConfig = {
  seed: number;
  env: EnvParams;
  rules: RuleParams;
  shift: CloneShift | null;
  dt: number;
  maxCells: number;
  chamberRadius: number;
  cellRadius: number;
  founders: number;
};

export type WorldStats = {
  hours: number;
  cells: number;
  living: number;
  mutant: number;
  mutantPct: number;
  deadPct: number;
  clones: number;
};

export type Morphology = {
  r90: number;
  necroticFrac: number;
  hypoxicFrac: number;
  coreO2: number;
  rimO2: number;
  o2Drop: number;
  dominantClone: string;
  dominantShare: number;
};

export type RadialBin = {
  rMid: number;
  n: number;
  o2: number;
  necrotic: number;
  hypoxic: number;
  cycling: number;
};

export const DEFAULT_ENV: EnvParams = {
  oxygen: 0.8,
  nutrient: 0.7,
  mutationRate: 0.002,
};

export const DEFAULT_RULES: RuleParams = {
  cycleHours: 24,
  deathRate: 0.1,
  adhesion: 0.7,
  motility: 0.06,
};

export const DEFAULT_CONFIG: WorldConfig = {
  seed: 4821,
  env: DEFAULT_ENV,
  rules: DEFAULT_RULES,
  shift: null,
  dt: 1,
  maxCells: 6000,
  chamberRadius: 18,
  cellRadius: 0.42,
  founders: 12,
};

export const SNAPSHOT_EVERY = 6;
export const GENES: MutationGene[] = [
  "cycle_rate",
  "apoptosis_threshold",
  "hypoxia_tolerance",
  "adhesion",
  "motility",
  "uptake",
];

export const HORIZON_HOURS = 720;
