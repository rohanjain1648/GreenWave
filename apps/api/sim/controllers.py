"""Signal controllers.

Both controllers set, per intersection, an integer ``phase``:
    phase 0  -> Vertical movements (V) get green
    phase 1  -> Horizontal movements (H) get green

`FixedController` is the status-quo baseline (timers set decades ago).
`MaxPressureController` is the GreenWave "AI": a decentralized, provably
throughput-stabilizing policy that gives green to whichever direction has the
most pressure (demand it can actually discharge) right now.
"""
from __future__ import annotations


class FixedController:
    name = "fixed"

    def __init__(self, green_time: float = 22.0):
        self.green_time = green_time

    def reset(self, sim) -> None:
        for n in sim.net.nodes:
            sim.phase[n] = 0
            sim.phase_time[n] = 0.0

    def update(self, sim, dt: float) -> None:
        for n in sim.net.nodes:
            sim.phase_time[n] += dt
            if sim.phase_time[n] >= self.green_time:
                sim.phase[n] = 1 - sim.phase[n]
                sim.phase_time[n] = 0.0


class MaxPressureController:
    name = "ai"

    def __init__(self, min_green: float = 6.0, downstream_weight: float = 0.5):
        self.min_green = min_green
        self.downstream_weight = downstream_weight

    def reset(self, sim) -> None:
        for n in sim.net.nodes:
            sim.phase[n] = 0
            sim.phase_time[n] = 0.0

    def _pressure(self, sim, node: int, orient: str) -> float:
        """Max-Pressure: queued demand for `orient` minus downstream queue it feeds."""
        incoming = 0.0
        outgoing = 0.0
        for nb in sim.net.neighbors[node]:
            if sim.net.orientation(nb, node) == orient:
                incoming += sim.waiting_count((nb, node))
            if sim.net.orientation(node, nb) == orient:
                outgoing += sim.waiting_count((node, nb))
        return incoming - self.downstream_weight * outgoing

    def update(self, sim, dt: float) -> None:
        for n in sim.net.nodes:
            sim.phase_time[n] += dt
            if sim.phase_time[n] < self.min_green:
                continue
            p_vertical = self._pressure(sim, n, "V")
            p_horizontal = self._pressure(sim, n, "H")
            desired = 0 if p_vertical >= p_horizontal else 1
            # Only switch when the other direction is meaningfully more loaded
            # (hysteresis prevents flapping under noise).
            if desired != sim.phase[n] and abs(p_vertical - p_horizontal) > 0.5:
                sim.phase[n] = desired
                sim.phase_time[n] = 0.0
