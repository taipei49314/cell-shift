import { useCallback, useEffect, useRef, useState } from "react";
import { experimentHash, PRESETS, type ExperimentSpec } from "../sim/experiment";
import { issueReceipt, parseReceipt, replayReceipt, type Receipt } from "../sim/receipt";
import { lineageChain, lineageIds } from "../sim/lineage";
import { livingShares, measure, radialProfile, type CloneShare } from "../sim/morphology";
import { effectiveTraits, emptyShift, shiftActive } from "../sim/shift";
import { cloneSeries } from "../sim/snapshot";
import {
  DEFAULT_ENV,
  DEFAULT_RULES,
  HORIZON_HOURS,
  type Cell,
  type CloneShift,
  type EnvParams,
  type Morphology,
  type RadialBin,
  type RuleParams,
  type WorldStats,
} from "../sim/types";
import { createWorld, replayTo, seekTo, stats, step, type World } from "../sim/world";

export type Contrast = {
  label: string;
  morphology: Morphology;
};

export type View = {
  stats: WorldStats;
  morphology: Morphology;
  profile: RadialBin[];
  hash: string;
  selected: Cell | null;
  effective: Cell["traits"] | null;
  chain: string[];
  series: { hours: number; shares: { cloneId: string; share: number }[] }[];
  shares: CloneShare[];
};

function snapshot(
  world: World,
  selectedId: number | null,
  seed: number,
  env: EnvParams,
  rules: RuleParams,
  shift: CloneShift | null,
): View {
  const selected = selectedId === null ? null : (world.cells.find((c) => c.id === selectedId) ?? null);
  return {
    stats: stats(world),
    morphology: measure(world.cells),
    profile: radialProfile(world.cells),
    hash: experimentHash({ seed, env, rules, shift }),
    selected,
    effective: selected ? effectiveTraits(selected, world.config.shift) : null,
    chain: selected ? lineageChain(world.cells, selected.id) : [],
    series: cloneSeries(world.frames),
    shares: livingShares(world.cells),
  };
}

export function useSimulation() {
  const [seed, setSeed] = useState(4821);
  const [env, setEnv] = useState<EnvParams>(DEFAULT_ENV);
  const [rules, setRules] = useState<RuleParams>(DEFAULT_RULES);
  const [shift, setShift] = useState<CloneShift>(emptyShift("C1"));
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 4 | 16>(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [lineageMode, setLineageMode] = useState(false);
  const [lineageSet, setLineageSet] = useState<Set<number>>(new Set());
  const [contrast, setContrast] = useState<Contrast | null>(null);
  const [view, setView] = useState<View>(() =>
    snapshot(createWorld({ seed: 4821 }), null, 4821, DEFAULT_ENV, DEFAULT_RULES, null),
  );

  const worldRef = useRef<World>(createWorld({ seed: 4821 }));
  const selectedRef = useRef<number | null>(null);
  const envRef = useRef(env);
  const rulesRef = useRef(rules);
  const shiftRef = useRef(shift);
  const speedRef = useRef(speed);
  envRef.current = env;
  rulesRef.current = rules;
  shiftRef.current = shift;
  speedRef.current = speed;
  selectedRef.current = selectedId;

  const armed = shiftActive(shift) ? shift : null;

  const publish = useCallback(() => {
    setView(
      snapshot(worldRef.current, selectedRef.current, seed, envRef.current, rulesRef.current, armed),
    );
  }, [armed, seed]);

  const applyLiveParams = useCallback(() => {
    worldRef.current.config.env = { ...envRef.current };
    worldRef.current.config.rules = { ...rulesRef.current };
  }, []);

  const reset = useCallback(
    (nextSeed = seed) => {
      worldRef.current = createWorld({ seed: nextSeed, env, rules, shift: armed });
      setLineageMode(false);
      setLineageSet(new Set());
      setSelectedId(null);
      selectedRef.current = null;
      setRunning(false);
      setContrast(null);
      publish();
    },
    [armed, env, publish, rules, seed],
  );

  const loadPreset = useCallback((spec: ExperimentSpec) => {
    const nextShift = emptyShift("C1");
    setSeed(spec.seed);
    setEnv(spec.env);
    setRules(spec.rules);
    setShift(nextShift);
    envRef.current = spec.env;
    rulesRef.current = spec.rules;
    shiftRef.current = nextShift;
    worldRef.current = createWorld({ seed: spec.seed, env: spec.env, rules: spec.rules, shift: null });
    setLineageMode(false);
    setLineageSet(new Set());
    setSelectedId(null);
    selectedRef.current = null;
    setRunning(false);
    setContrast(null);
    setView(snapshot(worldRef.current, null, spec.seed, spec.env, spec.rules, null));
  }, []);

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

  const armClone = useCallback(
    (cloneId: string) => {
      setShift((s) => ({ ...s, cloneId }));
    },
    [],
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
      seekTo(worldRef.current, target);
      if (selectedRef.current !== null && lineageMode) {
        setLineageSet(lineageIds(worldRef.current.cells, selectedRef.current));
      }
      publish();
    },
    [applyLiveParams, lineageMode, publish],
  );

  const compare = useCallback(
    (kind: "shift" | "adhesion") => {
      const hours = worldRef.current.hours;
      if (kind === "shift") {
        const other = replayTo({ seed, env: envRef.current, rules: rulesRef.current, shift: null }, hours);
        setContrast({ label: "no SHIFT", morphology: measure(other.cells) });
        return;
      }
      const alt = rulesRef.current.adhesion < 0.5 ? 1.1 : 0.15;
      const other = replayTo(
        {
          seed,
          env: envRef.current,
          rules: { ...rulesRef.current, adhesion: alt },
          shift: armed,
        },
        hours,
      );
      setContrast({ label: `adhesion ${alt}`, morphology: measure(other.cells) });
    },
    [armed, seed],
  );

  const exportReceipt = useCallback((): Receipt => {
    return issueReceipt(worldRef.current, {
      name: "live",
      seed,
      env: envRef.current,
      rules: rulesRef.current,
      shift: armed,
    });
  }, [armed, seed]);

  const loadReceipt = useCallback((raw: unknown) => {
    const receipt = parseReceipt(raw);
    const world = replayReceipt(receipt);
    setSeed(receipt.seed);
    setEnv(receipt.env);
    setRules(receipt.rules);
    setShift(receipt.shift ?? emptyShift("C1"));
    envRef.current = receipt.env;
    rulesRef.current = receipt.rules;
    worldRef.current = world;
    setLineageMode(false);
    setLineageSet(new Set());
    setSelectedId(null);
    selectedRef.current = null;
    setRunning(false);
    setContrast(null);
    setView(
      snapshot(world, null, receipt.seed, receipt.env, receipt.rules, receipt.shift),
    );
  }, []);

  useEffect(() => {
    applyLiveParams();
    publish();
  }, [applyLiveParams, env, publish, rules, shift]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      applyLiveParams();
      const world = worldRef.current;
      const n = speedRef.current;
      for (let i = 0; i < n; i++) {
        if (world.hours >= HORIZON_HOURS) {
          setRunning(false);
          break;
        }
        step(world);
      }
      publish();
      if (world.hours < HORIZON_HOURS) raf = requestAnimationFrame(loop);
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
    shift,
    setShift,
    armed,
    speed,
    setSpeed,
    running,
    selectedId,
    lineageMode,
    lineageSet,
    contrast,
    presets: PRESETS,
    loadPreset,
    armClone,
    run,
    pause,
    reset,
    select,
    traceLineage,
    clearLineage,
    seekHours,
    compare,
    exportReceipt,
    loadReceipt,
  };
}
