import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { NetworkT, TwinId } from "../types";
import { useStore } from "../store";
import { makeTransform } from "./transform";

const CAR_CAP = 900;
const EMG_CAP = 8;
const CAR_Y = 0.34;
const HEADLIGHT_OFFSET = 0.55;

// congestion colors (reused, no per-frame allocation)
const COLOR_FLOW = new THREE.Color("#2ee6a0"); // moving = green
const COLOR_STOP = new THREE.Color("#ff3344"); // jammed = red

/** Instanced cars colored by congestion (green = flowing, red = stopped),
 *  with glowing headlights. Interpolated between WebSocket frames. */
export default function Vehicles({
  network,
  twin,
}: {
  network: NetworkT;
  twin: TwinId;
}) {
  const carRef = useRef<THREE.InstancedMesh>(null);
  const headRef = useRef<THREE.InstancedMesh>(null);
  const emgRef = useRef<THREE.InstancedMesh>(null);
  const tf = useMemo(() => makeTransform(network), [network]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const headings = useRef<Map<number, number>>(new Map());

  useFrame(() => {
    const car = carRef.current;
    const head = headRef.current;
    const emg = emgRef.current;
    if (!car || !head || !emg) return;
    const { cur, prev, curAt, prevAt } = useStore.getState();
    if (!cur) {
      car.count = 0;
      head.count = 0;
      emg.count = 0;
      return;
    }

    const span = curAt - prevAt;
    const t = span > 0 ? Math.min(1, (performance.now() - curAt) / span) : 1;

    const prevMap = new Map<number, [number, number]>();
    if (prev) {
      for (const [id, x, y] of prev.twins[twin].vehicles) prevMap.set(id, [x, y]);
    }

    let ci = 0;
    let ei = 0;
    const seen = headings.current;
    for (const [id, x, y, isEmg, stopped] of cur.twins[twin].vehicles) {
      let px = x;
      let py = y;
      const pp = prevMap.get(id);
      if (pp) {
        px = pp[0] + (x - pp[0]) * t;
        py = pp[1] + (y - pp[1]) * t;
      }
      let h = seen.get(id) ?? 0;
      if (pp) {
        const dx = x - pp[0];
        const dy = y - pp[1];
        if (Math.abs(dx) + Math.abs(dy) > 0.4) {
          h = Math.atan2(-dy, dx);
          seen.set(id, h);
        }
      }
      const [wx, , wz] = tf.toWorld(px, py);
      dummy.position.set(wx, CAR_Y, wz);
      dummy.rotation.set(0, h, 0);

      if (isEmg) {
        if (ei >= EMG_CAP) continue;
        dummy.scale.set(1.3, 1.05, 0.8);
        dummy.updateMatrix();
        emg.setMatrixAt(ei++, dummy.matrix);
      } else {
        if (ci >= CAR_CAP) continue;
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        car.setMatrixAt(ci, dummy.matrix);
        car.setColorAt(ci, stopped ? COLOR_STOP : COLOR_FLOW);
        // headlight just ahead of the car, along its heading
        dummy.position.set(
          wx + Math.cos(h) * HEADLIGHT_OFFSET,
          CAR_Y + 0.02,
          wz - Math.sin(h) * HEADLIGHT_OFFSET,
        );
        dummy.scale.set(1, 1, 1);
        dummy.updateMatrix();
        head.setMatrixAt(ci, dummy.matrix);
        ci++;
      }
    }
    car.count = ci;
    head.count = ci;
    emg.count = ei;
    car.instanceMatrix.needsUpdate = true;
    head.instanceMatrix.needsUpdate = true;
    emg.instanceMatrix.needsUpdate = true;
    if (car.instanceColor) car.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh
        ref={carRef}
        args={[undefined, undefined, CAR_CAP]}
        castShadow
        frustumCulled={false}
      >
        <boxGeometry args={[1.15, 0.5, 0.62]} />
        <meshStandardMaterial roughness={0.35} metalness={0.4} />
      </instancedMesh>
      <instancedMesh
        ref={headRef}
        args={[undefined, undefined, CAR_CAP]}
        frustumCulled={false}
      >
        <boxGeometry args={[0.14, 0.14, 0.32]} />
        <meshBasicMaterial color="#fff3cf" toneMapped={false} />
      </instancedMesh>
      <instancedMesh
        ref={emgRef}
        args={[undefined, undefined, EMG_CAP]}
        frustumCulled={false}
      >
        <boxGeometry args={[1.0, 0.46, 0.55]} />
        <meshBasicMaterial color="#ff2233" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
