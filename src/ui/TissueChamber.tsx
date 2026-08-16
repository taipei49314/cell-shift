import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, type RefObject } from "react";
import { Color, DoubleSide, DynamicDrawUsage, InstancedMesh, Object3D } from "three";
import { DEFAULT_CONFIG, type Cell } from "../sim/types";
import type { World } from "../sim/world";
import { cellHex, type ColorMode } from "./palette";

const dummy = new Object3D();
const color = new Color();

function stateScale(cell: Cell): number {
  if (cell.state === "DEAD" || cell.state === "NECROTIC") return 0.62;
  if (cell.state === "APOPTOTIC") return 0.72;
  return 1;
}

function Tissue({
  worldRef,
  selectedId,
  lineageSet,
  colorMode,
  clip,
  onSelect,
}: {
  worldRef: RefObject<World>;
  selectedId: number | null;
  lineageSet: Set<number>;
  colorMode: ColorMode;
  clip: number;
  onSelect: (id: number | null) => void;
}) {
  const mesh = useRef<InstancedMesh>(null);
  const halo = useRef<InstancedMesh>(null);
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
    let haloCount = 0;
    for (let i = 0; i < n; i++) {
      const cell = cells[i]!;
      const hidden = cell.pos[2] > clip + 0.02;
      const s = hidden ? 0 : r * stateScale(cell);
      dummy.position.set(cell.pos[0], cell.pos[1], cell.pos[2]);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      inst.setColorAt(i, color.set(cellHex(cell, colorMode, lineageSet, selectedId)));
      if (!hidden && selectedId === cell.id) {
        dummy.scale.setScalar(r * 1.55);
        dummy.updateMatrix();
        halo.current?.setMatrixAt(0, dummy.matrix);
        haloCount = 1;
      }
    }
    inst.count = n;
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    if (halo.current) {
      halo.current.count = haloCount;
      halo.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh
        ref={mesh}
        args={[undefined, undefined, max]}
        frustumCulled={false}
        onClick={(e) => {
          e.stopPropagation();
          const cell = worldRef.current.cells[e.instanceId ?? -1];
          if (!cell || cell.pos[2] > clip + 0.02) {
            onSelect(null);
            return;
          }
          onSelect(cell.id);
        }}
      >
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial vertexColors roughness={0.42} metalness={0.12} />
      </instancedMesh>
      <instancedMesh ref={halo} args={[undefined, undefined, 1]} frustumCulled={false}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#f4fff8" wireframe transparent opacity={0.7} />
      </instancedMesh>
    </>
  );
}

function SpecimenWell() {
  const r = DEFAULT_CONFIG.chamberRadius;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -r * 0.22, 0]}>
        <cylinderGeometry args={[r * 0.92, r * 0.98, 0.55, 64]} />
        <meshStandardMaterial color="#101618" roughness={0.55} metalness={0.08} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -r * 0.22 + 0.28, 0]}>
        <ringGeometry args={[r * 0.86, r * 0.94, 64]} />
        <meshStandardMaterial color="#2a3f3a" roughness={0.35} metalness={0.15} side={DoubleSide} />
      </mesh>
      <mesh>
        <sphereGeometry args={[r, 28, 16]} />
        <meshBasicMaterial color="#24423c" wireframe transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

function ClipGuide({ clip }: { clip: number }) {
  const r = DEFAULT_CONFIG.chamberRadius;
  return (
    <mesh position={[0, 0, clip]}>
      <planeGeometry args={[r * 1.6, r * 1.6]} />
      <meshBasicMaterial color="#7dffc3" transparent opacity={0.06} side={DoubleSide} />
    </mesh>
  );
}

export function TissueChamber(props: {
  worldRef: RefObject<World>;
  selectedId: number | null;
  lineageSet: Set<number>;
  colorMode: ColorMode;
  clip: number;
  onSelect: (id: number | null) => void;
}) {
  return (
    <Canvas
      camera={{ position: [0, 10, 34], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => props.onSelect(null)}
    >
      <color attach="background" args={["#07090b"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[16, 18, 20]} intensity={42} color="#d9fff0" distance={80} />
      <pointLight position={[-14, 8, 10]} intensity={16} color="#5a7a88" distance={70} />
      <SpecimenWell />
      <ClipGuide clip={props.clip} />
      <Tissue
        worldRef={props.worldRef}
        selectedId={props.selectedId}
        lineageSet={props.lineageSet}
        colorMode={props.colorMode}
        clip={props.clip}
        onSelect={props.onSelect}
      />
      <OrbitControls enablePan={false} minDistance={14} maxDistance={52} enableDamping />
    </Canvas>
  );
}
