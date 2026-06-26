import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { NetworkT, TwinId } from "../types";
import { useStore } from "../store";
import { makeTransform } from "./transform";

const GW = 64;
const GH = 48;
const DECAY = 0.9; // per-frame fade
const STOP_WEIGHT = 3; // idling cars pollute the most
const MOVE_WEIGHT = 1;
const SCALE = 0.12; // intensity -> [0,1] saturation

/** Live emissions/congestion heatmap rendered as a translucent ground texture.
 *  Derived entirely on the client from the vehicle stream (no backend change):
 *  idling cars contribute more, so jams light up red. */
export default function Heatmap({
  network,
  twin,
}: {
  network: NetworkT;
  twin: TwinId;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const tf = useMemo(() => makeTransform(network), [network]);
  const grid = useRef(new Float32Array(GW * GH));
  const rgba = useMemo(() => new Uint8Array(GW * GH * 4), []);
  const tex = useMemo(() => {
    const t = new THREE.DataTexture(rgba, GW, GH, THREE.RGBAFormat);
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  }, [rgba]);

  const { minX, minY, maxX, maxY } = network.bounds;
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const { showHeatmap, cur } = useStore.getState();
    mesh.visible = showHeatmap;
    if (!showHeatmap || !cur) return;

    const g = grid.current;
    for (let i = 0; i < g.length; i++) g[i] *= DECAY;

    for (const [, x, y, isEmg, stopped] of cur.twins[twin].vehicles) {
      if (isEmg) continue;
      const gx = Math.min(GW - 1, Math.max(0, ((x - minX) / spanX) * GW) | 0);
      const gy = Math.min(GH - 1, Math.max(0, ((y - minY) / spanY) * GH) | 0);
      g[gy * GW + gx] += stopped ? STOP_WEIGHT : MOVE_WEIGHT;
    }

    for (let i = 0; i < g.length; i++) {
      const t = Math.min(1, g[i] * SCALE);
      let r: number, gr: number, b: number;
      if (t < 0.5) {
        const k = t * 2; // green -> yellow
        r = 0.15 + k * 0.85;
        gr = 0.8;
        b = 0.2 * (1 - k);
      } else {
        const k = (t - 0.5) * 2; // yellow -> red
        r = 1;
        gr = 0.8 * (1 - k) + 0.12 * k;
        b = 0.05;
      }
      const o = i * 4;
      rgba[o] = (r * 255) | 0;
      rgba[o + 1] = (gr * 255) | 0;
      rgba[o + 2] = (b * 255) | 0;
      rgba[o + 3] = (Math.min(0.72, t * 1.4) * 255) | 0;
    }
    tex.needsUpdate = true;
  });

  return (
    <mesh
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.06, 0]}
      visible={false}
    >
      <planeGeometry args={[tf.width, tf.depth]} />
      <meshBasicMaterial
        map={tex}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}
