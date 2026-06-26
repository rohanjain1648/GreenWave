import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { NetworkT, TwinId } from "../types";
import { useStore } from "../store";
import { makeTransform } from "./transform";

const GREEN = new THREE.Color("#22e584");
const RED = new THREE.Color("#ff3b30");
const AMBER = new THREE.Color("#ffb300");
const OFF = new THREE.Color("#111111");
const LIGHT_H = 1.5;

/** Two glowing lights per intersection (NS + EW), updated imperatively each frame. */
export default function Signals({
  network,
  twin,
}: {
  network: NetworkT;
  twin: TwinId;
}) {
  const nsRef = useRef<THREE.InstancedMesh>(null);
  const ewRef = useRef<THREE.InstancedMesh>(null);
  const poleRef = useRef<THREE.InstancedMesh>(null);
  const tf = useMemo(() => makeTransform(network), [network]);

  const { order, index } = useMemo(() => {
    const order = network.nodes.map((n) => n.id);
    const index = new Map<number, number>();
    order.forEach((id, i) => index.set(id, i));
    return { order, index };
  }, [network]);

  useLayoutEffect(() => {
    const ns = nsRef.current;
    const ew = ewRef.current;
    const pole = poleRef.current;
    if (!ns || !ew || !pole) return;
    const dummy = new THREE.Object3D();
    network.nodes.forEach((n, i) => {
      const [wx, , wz] = tf.toWorld(n.x, n.y);
      dummy.position.set(wx - 0.45, LIGHT_H, wz);
      dummy.scale.setScalar(1);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      ns.setMatrixAt(i, dummy.matrix);
      dummy.position.set(wx + 0.45, LIGHT_H, wz);
      dummy.updateMatrix();
      ew.setMatrixAt(i, dummy.matrix);
      dummy.position.set(wx, LIGHT_H / 2, wz);
      dummy.scale.set(1, LIGHT_H / 0.9, 1);
      dummy.updateMatrix();
      pole.setMatrixAt(i, dummy.matrix);
      ns.setColorAt(i, RED);
      ew.setColorAt(i, RED);
    });
    ns.instanceMatrix.needsUpdate = true;
    ew.instanceMatrix.needsUpdate = true;
    pole.instanceMatrix.needsUpdate = true;
    if (ns.instanceColor) ns.instanceColor.needsUpdate = true;
    if (ew.instanceColor) ew.instanceColor.needsUpdate = true;
  }, [network, tf]);

  useFrame(() => {
    const ns = nsRef.current;
    const ew = ewRef.current;
    if (!ns || !ew) return;
    const cur = useStore.getState().cur;
    if (!cur) return;
    const failed = new Set(cur.twins[twin].failedSignals ?? []);
    // blink amber at 1.25 Hz when signals are failed
    const blink = Math.floor(Date.now() / 400) % 2 === 0;
    for (const [nid, phase] of cur.twins[twin].signals) {
      const i = index.get(nid);
      if (i === undefined) continue;
      if (failed.has(nid)) {
        ns.setColorAt(i, blink ? AMBER : OFF);
        ew.setColorAt(i, blink ? AMBER : OFF);
      } else {
        ns.setColorAt(i, phase === 0 ? GREEN : RED);
        ew.setColorAt(i, phase === 1 ? GREEN : RED);
      }
    }
    if (ns.instanceColor) ns.instanceColor.needsUpdate = true;
    if (ew.instanceColor) ew.instanceColor.needsUpdate = true;
  });

  return (
    <group>
      <instancedMesh ref={poleRef} args={[undefined, undefined, order.length]}>
        <cylinderGeometry args={[0.05, 0.05, 0.9, 6]} />
        <meshStandardMaterial color="#2a3744" />
      </instancedMesh>
      <instancedMesh ref={nsRef} args={[undefined, undefined, order.length]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={ewRef} args={[undefined, undefined, order.length]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
