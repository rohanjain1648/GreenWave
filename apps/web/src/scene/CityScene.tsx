import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import type { TwinId } from "../types";
import { useStore } from "../store";
import { makeTransform } from "./transform";
import Roads from "./Roads";
import Buildings from "./Buildings";
import Signals from "./Signals";
import Vehicles from "./Vehicles";
import Disruptions from "./Disruptions";
import Heatmap from "./Heatmap";
import RainParticles from "./RainParticles";

// ---- sky/lighting helpers ------------------------------------------------

const _skyA = new THREE.Color();
const _skyB = new THREE.Color();

function lerpSky(a: string, b: string, t: number, out: THREE.Color): THREE.Color {
  return out.set(a).lerp(_skyB.set(b), t);
}

function timeToScene(hour: number, weather: string) {
  let skyHex: string, ambInt: number, dirInt: number, hemiInt: number;

  if (hour < 5 || hour >= 22) {
    skyHex = "#050a10"; ambInt = 0.15; dirInt = 0.08; hemiInt = 0.18;
  } else if (hour < 7) {
    const t = (hour - 5) / 2;
    lerpSky("#050a10", "#1a0d26", t, _skyA);
    skyHex = "#" + _skyA.getHexString();
    ambInt = 0.15 + t * 0.4; dirInt = 0.08 + t * 0.5; hemiInt = 0.18 + t * 0.35;
  } else if (hour < 17) {
    skyHex = "#070b18"; ambInt = 0.60; dirInt = 1.10; hemiInt = 0.65;
  } else if (hour < 20) {
    const t = (hour - 17) / 3;
    lerpSky("#070b18", "#160a0a", t, _skyA);
    skyHex = "#" + _skyA.getHexString();
    ambInt = 0.60 - t * 0.45; dirInt = 1.10 - t * 1.02; hemiInt = 0.65 - t * 0.47;
  } else {
    const t = (hour - 20) / 2;
    lerpSky("#160a0a", "#050a10", t, _skyA);
    skyHex = "#" + _skyA.getHexString();
    ambInt = 0.15; dirInt = 0.08; hemiInt = 0.18;
  }

  if (weather === "rain")  { ambInt *= 0.72; dirInt *= 0.55; }
  if (weather === "heavy") { ambInt *= 0.50; dirInt *= 0.35; }

  return { skyHex, ambInt, dirInt, hemiInt };
}

/** Inner Canvas component — drives sky color, fog, and all lights imperatively. */
function SkyLighting({ reach, compact }: { reach: number; compact: boolean }) {
  const ambRef  = useRef<THREE.AmbientLight>(null);
  const dirRef  = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const skyColor = useRef(new THREE.Color("#070b10"));

  useFrame(({ scene, gl }) => {
    const { cur } = useStore.getState();
    const hour    = ((cur?.simClock ?? 420) / 60) % 24;
    const weather = cur?.weather ?? "clear";
    const { skyHex, ambInt, dirInt, hemiInt } = timeToScene(hour, weather);

    skyColor.current.set(skyHex);
    gl.setClearColor(skyColor.current, 1);
    if (scene.fog instanceof THREE.Fog) scene.fog.color.set(skyHex);

    if (ambRef.current)  ambRef.current.intensity  = ambInt;
    if (dirRef.current)  dirRef.current.intensity  = dirInt;
    if (hemiRef.current) hemiRef.current.intensity = hemiInt;
  });

  return (
    <>
      <ambientLight ref={ambRef} intensity={0.5} />
      <hemisphereLight ref={hemiRef} args={["#4a6a92", "#05070a", 0.65]} />
      <directionalLight
        ref={dirRef}
        position={[reach, reach * 1.2, reach * 0.6]}
        intensity={1.1}
        castShadow={!compact}
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={reach * 4}
        shadow-camera-left={-reach}
        shadow-camera-right={reach}
        shadow-camera-top={reach}
        shadow-camera-bottom={-reach}
      />
    </>
  );
}

type Props = {
  twin: TwinId;
  title: string;
  subtitle: string;
  accent: string;
  compact?: boolean;
};

export default function CityScene({
  twin,
  title,
  subtitle,
  accent,
  compact = false,
}: Props) {
  const network = useStore((s) => s.network);
  const autoOrbit = useStore((s) => s.autoOrbit);
  const showHeatmap = useStore((s) => s.showHeatmap);
  const setAutoOrbit = useStore((s) => s.setAutoOrbit);

  const view = useMemo(() => {
    if (!network) return null;
    const tf = makeTransform(network);
    const reach = Math.max(tf.width, tf.depth);
    return {
      tf,
      camera: [tf.width * 0.5, reach * 0.82, tf.depth * 0.95] as [number, number, number],
      reach,
    };
  }, [network]);

  return (
    <div className="relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-xl border border-ink-600 bg-ink-900">
      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-3 py-2">
        <div>
          <div className="text-sm font-semibold" style={{ color: accent }}>
            {title}
          </div>
          <div className="text-[11px] text-slate-400">{subtitle}</div>
        </div>
        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{ background: accent, boxShadow: `0 0 10px ${accent}` }}
        />
      </div>

      {!view ? (
        <div className="flex flex-1 items-center justify-center text-sm text-slate-500">
          connecting to the city…
        </div>
      ) : (
        <Canvas
          shadows={!compact}
          dpr={[1, compact ? 1.25 : 2]}
          camera={{ position: view.camera, fov: 45, near: 0.1, far: 2000 }}
          gl={{ antialias: true, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#070b10"]} />
          <fog attach="fog" args={["#070b10", view.reach * 0.9, view.reach * 3]} />

          <SkyLighting reach={view.reach} compact={compact} />

          {/* ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
            <planeGeometry args={[view.reach * 4, view.reach * 4]} />
            <meshStandardMaterial color="#090d12" roughness={1} metalness={0} />
          </mesh>

          <Suspense fallback={null}>
            <Roads network={network!} />
            <Buildings network={network!} detail={compact ? 1 : 1} />
            <Signals network={network!} twin={twin} />
            <Vehicles network={network!} twin={twin} />
            <Disruptions network={network!} />
            <Heatmap network={network!} twin={twin} />
            <RainParticles width={view.tf.width} depth={view.tf.depth} />
          </Suspense>

          <OrbitControls
            target={[0, 0, 0]}
            enableDamping
            dampingFactor={0.08}
            autoRotate={autoOrbit}
            autoRotateSpeed={0.55}
            onStart={() => autoOrbit && setAutoOrbit(false)}
            minDistance={view.reach * 0.25}
            maxDistance={view.reach * 2.2}
            maxPolarAngle={Math.PI / 2.15}
          />

          {!compact && (
            <EffectComposer>
              <Bloom
                intensity={1.05}
                luminanceThreshold={0.3}
                luminanceSmoothing={0.25}
                mipmapBlur
              />
            </EffectComposer>
          )}
        </Canvas>
      )}

      <div className="pointer-events-none absolute bottom-2 right-3 z-10 text-[10px] text-slate-500">
        drag to orbit · scroll to zoom
      </div>

      {showHeatmap && (
        <div className="pointer-events-none absolute bottom-2 left-3 z-10 flex items-center gap-2 rounded bg-ink-900/70 px-2 py-1 text-[10px] text-slate-300">
          <span>emissions</span>
          <span
            className="h-2 w-20 rounded"
            style={{
              background:
                "linear-gradient(90deg,#27cc55,#ffd21e,#ff3322)",
            }}
          />
          <span>high</span>
        </div>
      )}
    </div>
  );
}
