"""Grid road network + shortest-path routing.

A GreenWave "district" is an R x C grid of intersections connected by bidirectional
roads. Each directed road (edge) is either Vertical ('V') or Horizontal ('H') — this
orientation is what a traffic signal phase serves.
"""
from __future__ import annotations

import heapq
from typing import Iterable


class GridNetwork:
    def __init__(self, rows: int = 6, cols: int = 8, spacing: float = 120.0):
        self.rows = rows
        self.cols = cols
        self.spacing = spacing
        self.nodes: dict[int, tuple[float, float]] = {}
        self.neighbors: dict[int, list[int]] = {}
        # (u, v) -> {"length": float, "orient": "H"|"V"}
        self.edges: dict[tuple[int, int], dict] = {}

        for r in range(rows):
            for c in range(cols):
                nid = self.nid(r, c)
                self.nodes[nid] = (c * spacing, r * spacing)
                self.neighbors[nid] = []

        for r in range(rows):
            for c in range(cols):
                u = self.nid(r, c)
                for dr, dc in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nr, nc = r + dr, c + dc
                    if 0 <= nr < rows and 0 <= nc < cols:
                        v = self.nid(nr, nc)
                        self.neighbors[u].append(v)
                        self.edges[(u, v)] = {
                            "length": spacing,
                            "orient": "V" if dc == 0 else "H",
                        }

    # --- id helpers -------------------------------------------------------
    def nid(self, r: int, c: int) -> int:
        return r * self.cols + c

    def rc(self, nid: int) -> tuple[int, int]:
        return divmod(nid, self.cols)

    def orientation(self, u: int, v: int) -> str:
        return self.edges[(u, v)]["orient"]

    def length(self, u: int, v: int) -> float:
        return self.edges[(u, v)]["length"]

    def border_nodes(self) -> list[int]:
        out = []
        for r in range(self.rows):
            for c in range(self.cols):
                if r in (0, self.rows - 1) or c in (0, self.cols - 1):
                    out.append(self.nid(r, c))
        return out

    # --- routing ----------------------------------------------------------
    def shortest_path(
        self, src: int, dst: int, blocked: Iterable[tuple[int, int]] | None = None
    ) -> list[int] | None:
        """A* over the grid (Manhattan heuristic). Returns node list incl. src & dst."""
        if src == dst:
            return [src]
        blocked_set = set(blocked or ())
        sr, sc = self.rc(dst)

        def h(n: int) -> float:
            r, c = self.rc(n)
            return (abs(r - sr) + abs(c - sc)) * self.spacing

        open_heap: list[tuple[float, int]] = [(h(src), src)]
        came: dict[int, int] = {}
        g: dict[int, float] = {src: 0.0}
        seen: set[int] = set()

        while open_heap:
            _, u = heapq.heappop(open_heap)
            if u == dst:
                path = [u]
                while u in came:
                    u = came[u]
                    path.append(u)
                path.reverse()
                return path
            if u in seen:
                continue
            seen.add(u)
            for v in self.neighbors[u]:
                if (u, v) in blocked_set:
                    continue
                ng = g[u] + self.length(u, v)
                if ng < g.get(v, float("inf")):
                    g[v] = ng
                    came[v] = u
                    heapq.heappush(open_heap, (ng + h(v), v))
        return None

    # --- serialization for the frontend ----------------------------------
    def to_geojson_like(self) -> dict:
        """Lightweight network description the browser uses to draw the basemap."""
        xs = [p[0] for p in self.nodes.values()]
        ys = [p[1] for p in self.nodes.values()]
        return {
            "rows": self.rows,
            "cols": self.cols,
            "spacing": self.spacing,
            "bounds": {"minX": min(xs), "minY": min(ys), "maxX": max(xs), "maxY": max(ys)},
            "nodes": [
                {"id": nid, "x": x, "y": y} for nid, (x, y) in self.nodes.items()
            ],
            # only one direction per pair to avoid drawing roads twice
            "edges": [
                {"u": u, "v": v, "orient": meta["orient"]}
                for (u, v), meta in self.edges.items()
                if u < v
            ],
        }
