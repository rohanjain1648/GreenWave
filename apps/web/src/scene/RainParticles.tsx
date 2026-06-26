import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useStore } from "../store";

const COUNT = 900;
const DROP_HEIGHT = 80;
const FALL_SPEED = 55; // m/s

export default function RainParticles({
  width,
  depth,
}: {
  width: number;
  depth: number;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const geoRef = useRef<THREE.BufferGeometry>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * width * 1.6;
      pos[i * 3 + 1] = Math.random() * DROP_HEIGHT;
      pos[i * 3 + 2] = (Math.random() - 0.5) * depth * 1.6;
    }
    return pos;
  }, [width, depth]);

  useFrame((_, dt) => {
    const pts = pointsRef.current;
    const geo = geoRef.current;
    if (!pts || !geo) return;

    const weather = useStore.getState().cur?.weather ?? "clear";
    pts.visible = weather !== "clear";
    if (!pts.visible) return;

    const speed = weather === "heavy" ? FALL_SPEED * 1.7 : FALL_SPEED;
    const attr = geo.attributes.position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;

    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] -= speed * dt;
      if (arr[i * 3 + 1] < 0) {
        arr[i * 3] = (Math.random() - 0.5) * width * 1.6;
        arr[i * 3 + 1] = DROP_HEIGHT + Math.random() * 20;
        arr[i * 3 + 2] = (Math.random() - 0.5) * depth * 1.6;
      }
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} visible={false}>
      <bufferGeometry ref={geoRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#a8dcff"
        size={0.35}
        transparent
        opacity={0.55}
        sizeAttenuation
        toneMapped={false}
      />
    </points>
  );
}
