import { useCallback, useEffect, useRef, useState } from "react";
import { experimentHash, PRESETS, type ExperimentSpec } from "../sim/experiment";
import { lineageChain, lineageIds } from "../sim/lineage";
import { measure, radialProfile } from "../sim/morphology";
import {
  DEFAULT_ENV,
  DEFAULT_RULES,
  HORIZON_HOURS,
  type Cell,
  type EnvParams,
  type Morphology,
  type RadialBin,
  type RuleParams,
  type WorldStats,
} from "../sim/types";
import { createWorld, replayTo, stats, step, type World } from "../sim/world";

export type View = {
  stats: WorldStats;
  morphology: Morphology;
  profile: RadialBin[];
  hash: string;
  selected: Cell | null;
  chain: string[];
};

function snapshot(world: World, selectedId: number | null, seed: number, env: EnvParams, rules: RuleParams): View {
  const selected = selectedId === null ? null : (world.cells.find((c) => c.id === selectedId) ?? null);
  return {
    stats: stats(world),
    morphology: measure(world.cells),
    profile: radialProfile(world.cells),
    hash: experimentHash({ seed, env, rules }),
    selected,
    chain: selected ? lineageChain(world.cells, selected.id) : [],
  };
}

export function useSimulation() {
  const [seed, setSeed] = useState(4821);
  const [env, setEnv] = useState<EnvParams>(DEFAULT_ENV);
  const [rules, setRules] = useState<RuleParams>(DEFAULT_RULES);
  const [running, setRunning] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [lineageMode, setLineageMode] = useState(false);
  const [lineageSet, setLineageSet] = useState<Set<number>>(new Set());
  const [view, setView] = useState<View>(() =>
    snapshot(createWorld({ seed: 4821 }), null, 4821, DEFAULT_ENV, DEFAULT_RULES),
  );

  const worldRef = useRef<World>(createWorld({ seed: 4821 }));
  const selectedRef = useRef<number | null>(null);
  const envRef = useRef(env);
  const rulesRef = useRef(rules);
  envRef.current = env;
  rulesRef.current = rules;
  selectedRef.current = selectedId;

  const publish = useCallback(() => {
    setView(snapshot(worldRef.current, selectedRef.current, seed, envRef.current, rulesRef.current));
  }, [seed]);

  const applyLiveParams = useCallback(() => {
    worldRef.current.config.env = { ...envRef.current };
    worldRef.current.config.rules = { ...rulesRef.current };
  }, []);

  const reset = useCallback(
    (nextSeed = seed) => {
      worldRef.current = createWorld({ seed: nextSeed, env, rules });
      setLineageMode(false);
      setLineageSet(new Set());
      setSelectedId(null);
      selectedRef.current = null;
      setRunning(false);
      publish();
    },
    [env, publish, rules, seed],
  );

  const loadPreset = useCallback(
    (spec: ExperimentSpec) => {
      setSeed(spec.seed);
      setEnv(spec.env);
      setRules(spec.rules);
      envRef.current = spec.env;
      rulesRef.current = spec.rules;
      worldRef.current = createWorld({ seed: spec.seed, env: spec.env, rules: spec.rules });
      setLineageMode(false);
      setLineageSet(new Set());
      setSelectedId(null);
      selectedRef.current = null;
      setRunning(false);
      setView(snapshot(worldRef.current, null, spec.seed, spec.env, spec.rules));
    },
    [],
  );

  const run = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);

  const select = useCallback(
    (id: number | null) => {
      setSelectedId(id);
      selectedRef.current = id;
      if (id === null) {
        setLineageMode(false);
        setLineageSet(new Set());
      } else if (lineageMode) {
        setLineageSet(lineageIds(worldRef.current.cells, id));
      }
      publish();
    },
    [lineageMode, publish],
  );

  const traceLineage = useCallback(() => {
    const id = selectedRef.current;
    if (id === null) return;
    setLineageMode(true);
    setLineageSet(lineageIds(worldRef.current.cells, id));
  }, []);

  const clearLineage = useCallback(() => {
    setLineageMode(false);
    setLineageSet(new Set());
  }, []);

  const seekHours = useCallback(
    (hours: number) => {
      setRunning(false);
      applyLiveParams();
      const target = Math.max(0, Math.min(HORIZON_HOURS, Math.round(hours)));
      const current = worldRef.current.hours;
      if (target < current) {
        worldRef.current = replayTo({ seed, env: envRef.current, rules: rulesRef.current }, target);
      } else {
        while (worldRef.current.hours < target) step(worldRef.current);
      }
      if (selectedRef.current !== null && lineageMode) {
        setLineageSet(lineageIds(worldRef.current.cells, selectedRef.current));
      }
      publish();
    },
    [applyLiveParams, lineageMode, publish, seed],
  );

  useEffect(() => {
    applyLiveParams();
    publish();
  }, [applyLiveParams, env, publish, rules]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      applyLiveParams();
      const world = worldRef.current;
      if (world.hours >= HORIZON_HOURS) {
        setRunning(false);
        publish();
        return;
      }
      step(world);
      if (world.hours < HORIZON_HOURS) step(world);
      publish();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [applyLiveParams, publish, running]);

  return {
    worldRef,
    view,
    seed,
    setSeed,
    env,
    setEnv,
    rules,
    setRules,
    running,
    selectedId,
    lineageMode,
    lineageSet,
    presets: PRESETS,
    loadPreset,
    run,
    pause,
    reset,
    select,
    traceLineage,
    clearLineage,
    seekHours,
  };
}
