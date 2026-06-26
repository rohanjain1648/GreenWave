import type { NetworkT } from "../types";

/** Maps backend network coordinates (x = col*spacing, y = row*spacing) into a
 *  centered 3D world on the XZ ground plane (Y is up). */
export const WORLD_SCALE = 0.08;

export type CityTransform = {
  scale: number;
  width: number;
  depth: number;
  cx: number;
  cy: number;
  /** backend (x,y) -> world [X, 0, Z] */
  toWorld: (x: number, y: number) => [number, number, number];
};

export function makeTransform(net: NetworkT): CityTransform {
  const { minX, minY, maxX, maxY } = net.bounds;
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const scale = WORLD_SCALE;
  return {
    scale,
    cx,
    cy,
    width: (maxX - minX) * scale,
    depth: (maxY - minY) * scale,
    toWorld: (x, y) => [(x - cx) * scale, 0, (y - cy) * scale],
  };
}

/** Small deterministic PRNG so procedural buildings are stable across renders. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
