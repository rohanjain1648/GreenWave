import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { NetworkT } from "../types";
import { makeTransform, mulberry32 } from "./transform";

type Block = {
  pos: [number, number, number];
  w: number;
  d: number;
  h: number;
  color: THREE.Color;
  beacon: boolean;
};

/** Procedural city blocks placed in each grid cell + glowing rooftop beacons. */
export default function Buildings({
  network,
  detail = 1,
}: {
  network: NetworkT;
  detail?: number;
}) {
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const beaconRef = useRef<THREE.InstancedMesh>(null);
  const tf = useMemo(() => makeTransform(network), [network]);

  const blocks = useMemo<Block[]>(() => {
    const rnd = mulberry32(1337);
    const out: Block[] = [];
    const cell = network.spacing;
    const palette = ["#1b2733", "#202d3a", "#172029", "#243443", "#1a2430"];
    for (let r = 0; r < network.rows - 1; r++) {
      for (let c = 0; c < network.cols - 1; c++) {
        if (rnd() < 0.12 * detail) continue; // some empty lots
        const bx = (c + 0.5) * cell + network.bounds.minX;
        const by = (r + 0.5) * cell + network.bounds.minY;
        const [wx, , wz] = tf.toWorld(bx, by);
        const footprint = cell * tf.scale;
        const w = footprint * (0.45 + rnd() * 0.28);
        const d = footprint * (0.45 + rnd() * 0.28);
        const h = 1.2 + rnd() * rnd() * 8.5; // skewed toward shorter
        const color = new THREE.Color(palette[(rnd() * palette.length) | 0]);
        out.push({
          pos: [wx, h / 2, wz],
          w,
          d,
          h,
          color,
          beacon: h > 5.5 || rnd() < 0.25,
        });
      }
    }
    return out;
  }, [network, tf, detail]);

  const beacons = useMemo(() => blocks.filter((b) => b.beacon), [blocks]);

  // procedural "lit windows" texture so the skyline reads as a living night city
  const windowTex = useMemo(() => {
    const cv = document.createElement("canvas");
    cv.width = 64;
    cv.height = 128;
    const ctx = cv.getContext("2d")!;
    ctx.fillStyle = "#05080c";
    ctx.fillRect(0, 0, cv.width, cv.height);
    const rnd = mulberry32(99);
    const cols = 4;
    const rows = 11;
    const lit = ["#ffd28a", "#ffe6b0", "#7fd8ff", "#bfe9ff"];
    const padX = 6;
    const padY = 5;
    const wW = (cv.width - padX * (cols + 1)) / cols;
    const wH = (cv.height - padY * (rows + 1)) / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = rnd() < 0.55 ? lit[(rnd() * lit.length) | 0] : "#0a1018";
        ctx.fillRect(
          padX + c * (wW + padX),
          padY + r * (wH + padY),
          wW,
          wH,
        );
      }
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 5);
    return tex;
  }, []);

  useLayoutEffect(() => {
    const mesh = bodyRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    blocks.forEach((b, i) => {
      dummy.position.set(b.pos[0], b.pos[1], b.pos[2]);
      dummy.scale.set(b.w, b.h, b.d);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, b.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [blocks]);

  useLayoutEffect(() => {
    const mesh = beaconRef.current;
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    beacons.forEach((b, i) => {
      dummy.position.set(b.pos[0], b.h + 0.12, b.pos[2]);
      dummy.scale.set(0.18, 0.18, 0.18);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [beacons]);

  return (
    <group>
      <instancedMesh
        ref={bodyRef}
        args={[undefined, undefined, blocks.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          roughness={0.7}
          metalness={0.3}
          emissive="#ffffff"
          emissiveMap={windowTex}
          emissiveIntensity={0.85}
        />
      </instancedMesh>
      <instancedMesh ref={beaconRef} args={[undefined, undefined, beacons.length]}>
        <boxGeometry args={[1, 1, 1]} />
        {/* basic + toneMapped:false => bright -> blooms */}
        <meshBasicMaterial color="#22e584" toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
