import { useMemo } from "react";
import type { NetworkT } from "../types";
import { useStore } from "../store";
import { makeTransform } from "./transform";

/** Red barrier markers on accident / flooded edges. */
export default function Disruptions({ network }: { network: NetworkT }) {
  const tf = useMemo(() => makeTransform(network), [network]);
  const nodePos = useMemo(() => {
    const m = new Map<number, [number, number, number]>();
    for (const n of network.nodes) m.set(n.id, tf.toWorld(n.x, n.y));
    return m;
  }, [network, tf]);

  // subscribe only to the *set* of blocked edges (stable key) to avoid re-renders
  const blockedKey = useStore((s) =>
    (s.cur?.blocked ?? []).map((e) => e.join("-")).join(","),
  );

  const markers = useMemo(() => {
    if (!blockedKey) return [];
    return blockedKey.split(",").map((k) => {
      const [u, v] = k.split("-").map(Number);
      const a = nodePos.get(u)!;
      const b = nodePos.get(v)!;
      return [(a[0] + b[0]) / 2, (a[2] + b[2]) / 2] as [number, number];
    });
  }, [blockedKey, nodePos]);

  return (
    <group>
      {markers.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.4, z]}>
          <coneGeometry args={[0.32, 0.8, 5]} />
          <meshBasicMaterial color="#ff6b35" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}
