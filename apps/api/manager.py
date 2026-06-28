"""SimManager — runs the two twins (Fixed vs GreenWave AI) in lock-step.

Both twins receive the *identical* stream of trips from a single seeded RNG, so the
KPI comparison is a fair counterfactual. A background asyncio task advances the sims
and broadcasts frames to all connected WebSocket clients at ~10 Hz.
"""
from __future__ import annotations

import asyncio
import random

from sim import FixedController, GridNetwork, MaxPressureController, Simulation

ROWS, COLS = 6, 8
TICK_DT = 0.25            # sim-seconds per physics sub-step
LOOP_INTERVAL = 0.1      # real-seconds between broadcasts
BASE_DEMAND = 1.6        # mean trips spawned per sim-second at multiplier 1.0
MAX_VEHICLES = 700        # safety cap per twin
SEED = 42

# weather: speed factor for vehicles, demand factor for trip generation
WEATHER_MODES: dict[str, dict[str, float]] = {
    "clear": {"speed": 1.00, "demand": 1.00},
    "rain":  {"speed": 0.75, "demand": 0.88},
    "heavy": {"speed": 0.50, "demand": 0.72},
}

# Realistic rush-hour demand curve — multiplier per hour of day (index 0 = midnight)
DAY_CURVE = [
    0.25, 0.15, 0.12, 0.12, 0.18, 0.40, 0.75, 1.30,
    1.55, 1.10, 0.90, 0.88, 1.00, 0.92, 0.90, 0.98,
    1.12, 1.65, 1.55, 1.15, 0.85, 0.65, 0.50, 0.38,
]


class SimManager:
    def __init__(self) -> None:
        self.net = GridNetwork(ROWS, COLS)
        self._build()
        self.subscribers: set[asyncio.Queue] = set()
        self.running = False
        self.speed = 1
        self.demand_multiplier = 1.0
        self.tick = 0
        self.sim_time = 0.0
        self.weather = "clear"
        self.weather_demand_factor = 1.0
        self.day_night_auto = False
        self.sim_clock = 7 * 60.0   # minutes since midnight; start at 7:00 AM
        self._task: asyncio.Task | None = None

    def _build(self) -> None:
        self.rng = random.Random(SEED)
        self.fixed = Simulation(self.net, FixedController(), preemption=False)
        self.ai = Simulation(self.net, MaxPressureController(), preemption=True)
        self.tick = 0
        self.sim_time = 0.0
        self.sim_clock = 7 * 60.0

    # --- lifecycle --------------------------------------------------------
    def start(self) -> None:
        if self._task is None:
            self._task = asyncio.create_task(self._run())

    async def _run(self) -> None:
        while True:
            try:
                if self.running:
                    substeps = max(1, int(self.speed))
                    for _ in range(substeps):
                        self._spawn(TICK_DT)
                        self.fixed.step(TICK_DT)
                        self.ai.step(TICK_DT)
                        self.sim_time += TICK_DT
                        # 1 sim-tick = 1 city-minute (so a full day cycles in ~2.4 min at speed 1)
                        self.sim_clock = (self.sim_clock + TICK_DT) % 1440.0
                        self.tick += 1
                await self._broadcast()
            except Exception as exc:  # keep the loop alive in a demo
                print("sim loop error:", exc)
            await asyncio.sleep(LOOP_INTERVAL)

    # --- demand -----------------------------------------------------------
    def _effective_demand(self) -> float:
        mult = self.demand_multiplier * self.weather_demand_factor
        if self.day_night_auto:
            hour = int(self.sim_clock // 60) % 24
            mult *= DAY_CURVE[hour]
        return mult

    def _spawn(self, dt: float) -> None:
        if len(self.ai.vehicles) >= MAX_VEHICLES:
            return
        expected = BASE_DEMAND * self._effective_demand() * dt
        n = self._poisson(expected)
        borders = self.net.border_nodes()
        mid_row = self.net.rows // 2
        for _ in range(n):
            # 45% of trips ride a busy central avenue -> asymmetric demand,
            # which is exactly where adaptive control beats fixed timing.
            if self.rng.random() < 0.45:
                o = self.net.nid(mid_row, 0)
                d = self.net.nid(mid_row, self.net.cols - 1)
                if self.rng.random() < 0.5:
                    o, d = d, o
            else:
                o = self.rng.choice(borders)
                d = self.rng.choice(borders)
                if o == d:
                    continue
            self.fixed.add_trip(o, d)
            self.ai.add_trip(o, d)

    def _poisson(self, lam: float) -> int:
        # Knuth's algorithm (lam is small here)
        L = pow(2.718281828, -lam)
        k, p = 0, 1.0
        while True:
            k += 1
            p *= self.rng.random()
            if p <= L:
                return k - 1

    # --- controls (called from REST handlers) -----------------------------
    def play(self) -> None:
        self.running = True

    def pause(self) -> None:
        self.running = False

    def reset(self) -> None:
        self._build()
        self.running = False
        self.demand_multiplier = 1.0
        self.weather = "clear"
        self.weather_demand_factor = 1.0
        self.day_night_auto = False
        self.speed = 1

    def set_speed(self, speed: int) -> None:
        self.speed = max(1, min(6, int(speed)))

    def set_demand(self, multiplier: float) -> None:
        self.demand_multiplier = max(0.1, min(4.0, float(multiplier)))

    def accident(self, node: int | None = None) -> dict:
        # pick a busy central edge if none specified
        if node is None:
            mid_row, mid_col = self.net.rows // 2, self.net.cols // 2
            u = self.net.nid(mid_row, mid_col)
            v = self.net.nid(mid_row, mid_col + 1)
        else:
            u = node
            v = self.net.neighbors[u][0]
        self.fixed.block_edge(u, v, duration=45.0)
        self.ai.block_edge(u, v, duration=45.0)
        return {"u": u, "v": v}

    def closure(self) -> dict:
        # flood a 2x2 block near a corner: remove its internal/adjacent edges
        r0, c0 = 1, 1
        nodes = [
            self.net.nid(r0, c0),
            self.net.nid(r0, c0 + 1),
            self.net.nid(r0 + 1, c0),
            self.net.nid(r0 + 1, c0 + 1),
        ]
        pairs: list[tuple[int, int]] = []
        nodeset = set(nodes)
        for u in nodes:
            for v in self.net.neighbors[u]:
                if v in nodeset:
                    pairs.append((u, v))
        self.fixed.close_edges(pairs)
        self.ai.close_edges(pairs)
        return {"nodes": nodes}

    def surge(self) -> None:
        self.set_demand(min(4.0, self.demand_multiplier * 1.8))

    # --- new disruptions --------------------------------------------------
    def set_weather(self, mode: str) -> None:
        if mode not in WEATHER_MODES:
            return
        self.weather = mode
        w = WEATHER_MODES[mode]
        self.weather_demand_factor = w["demand"]
        self.fixed.set_weather_factor(w["speed"])
        self.ai.set_weather_factor(w["speed"])

    def toggle_day_night(self) -> None:
        self.day_night_auto = not self.day_night_auto

    def motorcade(self) -> dict:
        """VIP convoy blocks the full central avenue for 120 sim-seconds."""
        mid_row = self.net.rows // 2
        edges: list[list[int]] = []
        for c in range(self.net.cols - 1):
            u = self.net.nid(mid_row, c)
            v = self.net.nid(mid_row, c + 1)
            self.fixed.block_edge(u, v, 120.0)
            self.ai.block_edge(u, v, 120.0)
            edges.append([u, v])
        return {"edges": edges}

    def signal_failure(self) -> dict:
        """4 random interior intersections go all-red for 60 sim-seconds."""
        interior = [
            self.net.nid(r, c)
            for r in range(1, self.net.rows - 1)
            for c in range(1, self.net.cols - 1)
        ]
        nodes = self.rng.sample(interior, min(4, len(interior)))
        self.fixed.fail_signals(nodes, 60.0)
        self.ai.fail_signals(nodes, 60.0)
        return {"nodes": nodes}

    def protest(self) -> dict:
        """Protest blocks a 3-block mid-city corridor for 90 sim-seconds."""
        row = self.net.rows // 2 + 1
        c0 = self.net.cols // 2 - 1
        pairs: list[tuple[int, int]] = []
        for c in range(c0, min(c0 + 3, self.net.cols - 1)):
            u = self.net.nid(row, c)
            v = self.net.nid(row, c + 1)
            pairs.extend([(u, v), (v, u)])
        valid = [(u, v) for u, v in pairs if (u, v) in self.net.edges]
        self.fixed.block_edges_timed(valid, 90.0)
        self.ai.block_edges_timed(valid, 90.0)
        return {"pairs": [[u, v] for u, v in valid]}

    def stadium(self) -> dict:
        """Stadium lets out: 2.5× demand spike."""
        self.set_demand(min(4.0, self.demand_multiplier * 2.5))
        return {}

    def emergency(self) -> dict:
        # middle row, left border → right border: 7 edges × 120 m ≈ 15 real-seconds
        mid = self.net.rows // 2
        o = self.net.nid(mid, 0)
        d = self.net.nid(mid, self.net.cols - 1)
        self.fixed.add_trip(o, d, emergency=True)
        self.ai.add_trip(o, d, emergency=True)
        return {"from": o, "to": d}

    # --- broadcast --------------------------------------------------------
    def _savings(self, fk: dict, ak: dict) -> dict:
        def pct(base, ai):
            if not base:
                return 0.0
            return round((base - ai) / base * 100.0, 1)

        return {
            "travelTimePct": pct(fk["avgTravelTimeS"], ak["avgTravelTimeS"]),
            "waitPct": pct(fk["totalWaitS"], ak["totalWaitS"]),
            "co2Pct": pct(fk["co2Kg"], ak["co2Kg"]),
            "co2KgSaved": round(fk["co2Kg"] - ak["co2Kg"], 2),
            "queuePct": pct(fk["meanQueue"], ak["meanQueue"]),
        }

    def snapshot(self) -> dict:
        f_frame = self.fixed.frame()
        a_frame = self.ai.frame()
        blocked = sorted({tuple(sorted(e)) for e in self.ai.blocked})
        return {
            "tick": self.tick,
            "simTime": round(self.sim_time, 1),
            "running": self.running,
            "speed": self.speed,
            "demand": round(self._effective_demand(), 2),
            "blocked": [list(e) for e in blocked],
            "twins": {"fixed": f_frame, "ai": a_frame},
            "savings": self._savings(f_frame["kpis"], a_frame["kpis"]),
            "weather": self.weather,
            "simClock": round(self.sim_clock, 1),
            "dayNightAuto": self.day_night_auto,
        }

    async def _broadcast(self) -> None:
        if not self.subscribers:
            return
        data = self.snapshot()
        for q in list(self.subscribers):
            if q.full():
                try:
                    q.get_nowait()
                except asyncio.QueueEmpty:
                    pass
            await q.put(data)

    def subscribe(self) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue(maxsize=2)
        self.subscribers.add(q)
        return q

    def unsubscribe(self, q: asyncio.Queue) -> None:
        self.subscribers.discard(q)
