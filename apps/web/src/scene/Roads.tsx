import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { NetworkT } from "../types";
import { makeTransform } from "./transform";

const ROAD_WIDTH = 1.7;

export default function Roads({ network }: { network: NetworkT }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tf = useMemo(() => makeTransform(network), [network]);
  const nodePos = useMemo(() => {
    const m = new Map<number, [number, number, number]>();
    for (const n of network.nodes) m.set(n.id, tf.toWorld(n.x, n.y));
    return m;
  }, [network, tf]);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    network.edges.forEach((e, i) => {
      const a = nodePos.get(e.u)!;
      const b = nodePos.get(e.v)!;
      const mx = (a[0] + b[0]) / 2;
      const mz = (a[2] + b[2]) / 2;
      const dx = b[0] - a[0];
      const dz = b[2] - a[2];
      const len = Math.hypot(dx, dz) + ROAD_WIDTH * 0.5;
      dummy.position.set(mx, 0.04, mz);
      dummy.rotation.set(0, Math.atan2(-dz, dx), 0);
      dummy.scale.set(len, 1, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [network, nodePos]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, network.edges.length]}
      receiveShadow
    >
      <boxGeometry args={[1, 0.08, ROAD_WIDTH]} />
      <meshStandardMaterial color="#11181f" roughness={0.9} metalness={0.1} />
    </instancedMesh>
  );
}
