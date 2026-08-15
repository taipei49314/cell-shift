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
};

export type WorldConfig = {
  seed: number;
  env: EnvParams;
  rules: RuleParams;
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

export const DEFAULT_ENV: EnvParams = {
  oxygen: 0.8,
  nutrient: 0.7,
  mutationRate: 0.002,
};

export const DEFAULT_RULES: RuleParams = {
  cycleHours: 24,
  deathRate: 0.1,
  adhesion: 0.7,
};

export const DEFAULT_CONFIG: WorldConfig = {
  seed: 4821,
  env: DEFAULT_ENV,
  rules: DEFAULT_RULES,
  dt: 1,
  maxCells: 6000,
  chamberRadius: 18,
  cellRadius: 0.42,
  founders: 12,
};

export const HORIZON_HOURS = 720;
