import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { BackSide, Color, DynamicDrawUsage, InstancedMesh, Object3D } from "three";
import { DEFAULT_CONFIG, type Cell } from "../sim/types";
import type { World } from "../sim/world";
import { cloneHue } from "./format";

const dummy = new Object3D();
const color = new Color();

function stateScale(cell: Cell): number {
  if (cell.state === "DEAD" || cell.state === "NECROTIC") return 0.62;
  if (cell.state === "APOPTOTIC") return 0.72;
  return 1;
}

function paintCell(cell: Cell, lineageMode: boolean, lineageSet: Set<number>, selectedId: number | null): Color {
  if (lineageMode && !lineageSet.has(cell.id)) {
    return color.set("#0e1614");
  }
  if (cell.dead || cell.state === "NECROTIC") {
    return color.set("#2a3032");
  }
  if (cell.state === "HYPOXIC") {
    return color.set(cloneHue(cell.cloneId)).multiplyScalar(0.55);
  }
  if (selectedId === cell.id) {
    return color.set("#f4fff8");
  }
  return color.set(cloneHue(cell.cloneId));
}

function Tissue({
  worldRef,
  selectedId,
  lineageMode,
  lineageSet,
  onSelect,
}: {
  worldRef: RefObject<World>;
  selectedId: number | null;
  lineageMode: boolean;
  lineageSet: Set<number>;
  onSelect: (id: number | null) => void;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const max = DEFAULT_CONFIG.maxCells;

  useEffect(() => {
    mesh.current?.instanceMatrix.setUsage(DynamicDrawUsage);
  }, []);

  useFrame(() => {
    const inst = mesh.current;
    if (!inst) return;
    const cells = worldRef.current.cells;
    const n = Math.min(cells.length, max);
    const r = DEFAULT_CONFIG.cellRadius;
    for (let i = 0; i < n; i++) {
      const cell = cells[i]!;
      const s = r * stateScale(cell) * (selectedId === cell.id ? 1.28 : 1);
      dummy.position.set(cell.pos[0], cell.pos[1], cell.pos[2]);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      inst.setColorAt(i, paintCell(cell, lineageMode, lineageSet, selectedId));
    }
    inst.count = n;
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined, undefined, max]}
      frustumCulled={false}
      onClick={(e) => {
        e.stopPropagation();
        const cell = worldRef.current.cells[e.instanceId ?? -1];
        onSelect(cell ? cell.id : null);
      }}
    >
      <sphereGeometry args={[1, 10, 10]} />
      <meshStandardMaterial vertexColors roughness={0.42} metalness={0.12} />
    </instancedMesh>
  );
}

function ChamberShell() {
  const r = DEFAULT_CONFIG.chamberRadius;
  return (
    <group>
      <mesh>
        <sphereGeometry args={[r, 48, 32]} />
        <meshPhysicalMaterial
          color="#7dffc3"
          transparent
          opacity={0.045}
          roughness={0.15}
          metalness={0.05}
          side={BackSide}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[r, 28, 16]} />
        <meshBasicMaterial color="#24423c" wireframe transparent opacity={0.16} />
      </mesh>
    </group>
  );
}

export function TissueChamber(props: {
  worldRef: RefObject<World>;
  selectedId: number | null;
  lineageMode: boolean;
  lineageSet: Set<number>;
  onSelect: (id: number | null) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 8, 32], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={["#07090b"]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[16, 18, 20]} intensity={48} color="#d9fff0" distance={80} />
      <pointLight position={[-18, -10, -12]} intensity={18} color="#5a7a88" distance={70} />
      <ChamberShell />
      <Tissue {...props} />
      <OrbitControls enablePan={false} minDistance={14} maxDistance={52} enableDamping />
    </Canvas>
  );
}
