"""Spatial-queue traffic micro-simulation.

Vehicles travel along directed edges (positions interpolated for smooth rendering),
queue at stop lines, and are discharged across intersections when their movement has
a green signal and the downstream road has capacity. Emissions accumulate from time
in motion, idling, and stop-and-go events — so a network that flows better is also
cleaner, which is exactly the GreenWave value story.
"""
from __future__ import annotations

import math
from dataclasses import dataclass

from .network import GridNetwork

# --- tunable physics ------------------------------------------------------
VEH_SPEED = 13.0          # m/s free-flow (~47 km/h)
MIN_GAP = 7.0             # m bumper-to-bumper minimum (also sets jam density)
SAT_FLOW = 0.55           # veh/s discharged per green approach (saturation flow)
LANE_OFFSET = 7.0         # px perpendicular offset so opposing lanes don't overlap
STOPLINE_EPS = 0.5        # m tolerance for "arrived at stop line"
PREEMPT_DIST = 1.0        # fraction of an edge within which an emergency vehicle
                          # pre-empts the downstream signal (1.0 = whole approach)

# emissions model (grams CO2)
CO2_RUN = 1.6             # g/s while moving
CO2_IDLE = 0.9           # g/s while stopped (idling)
CO2_STOP_PENALTY = 8.0    # g per stop event (acceleration cost)
G_CO2_PER_LITRE = 2310.0  # g CO2 per litre of gasoline


@dataclass
class Vehicle:
    id: int
    path: list[int]          # node sequence src..dst
    idx: int = 0             # current edge is path[idx] -> path[idx+1]
    pos: float = 0.0         # distance travelled along current edge (m)
    speed: float = VEH_SPEED
    emergency: bool = False
    entered: float = 0.0     # sim time spawned
    stopped: bool = False
    stops: int = 0           # number of stop events (for the emergency KPI)

    @property
    def u(self) -> int:
        return self.path[self.idx]

    @property
    def v(self) -> int:
        return self.path[self.idx + 1]

    @property
    def is_last_edge(self) -> bool:
        return self.idx + 1 >= len(self.path) - 1


class Simulation:
    """One twin. `preemption` enables emergency green-corridors (a GreenWave feature)."""

    def __init__(self, net: GridNetwork, controller, preemption: bool = False):
        self.net = net
        self.controller = controller
        self.preemption = preemption
        self.time = 0.0
        self._next_id = 1

        self.vehicles: dict[int, Vehicle] = {}
        self.edge_vehicles: dict[tuple[int, int], list[Vehicle]] = {
            e: [] for e in net.edges
        }
        self.discharge_credit: dict[tuple[int, int], float] = {e: 0.0 for e in net.edges}
        self.pending: list[Vehicle] = []        # trips waiting for room to enter

        self.phase: dict[int, int] = {}
        self.phase_time: dict[int, float] = {}
        self.blocked: set[tuple[int, int]] = set()
        self.blocked_until: dict[tuple[int, int], float] = {}

        # weather + signal-failure
        self.weather_speed_factor: float = 1.0
        self.failed_signals: set[int] = set()
        self.failed_until: dict[int, float] = {}

        # KPI accumulators
        self.completed = 0
        self.total_travel_time = 0.0
        self.total_wait_time = 0.0
        self.co2_g = 0.0
        self._completions: list[float] = []      # sim-times of recent completions
        self.emergency_active_id: int | None = None
        self.emergency_response_s: float | None = None
        self.emergency_stops: int | None = None

        self.controller.reset(self)

    # --- capacity helpers -------------------------------------------------
    def _cap(self, edge: tuple[int, int]) -> int:
        return max(1, int(self.net.length(*edge) / MIN_GAP))

    def occupancy(self, edge: tuple[int, int]) -> int:
        return len(self.edge_vehicles[edge])

    def waiting_count(self, edge: tuple[int, int]) -> int:
        """Real standing-queue length = vehicles halted on this edge.

        (Counting only cars *at* the stop line would report ~1 for a fully jammed
        road, because queued cars are spaced MIN_GAP apart — which blinds the
        Max-Pressure controller. Counting halted cars gives the true queue.)
        """
        return sum(1 for v in self.edge_vehicles[edge] if v.stopped)

    def has_room(self, edge: tuple[int, int]) -> bool:
        return self.occupancy(edge) < self._cap(edge)

    # --- demand injection -------------------------------------------------
    def add_trip(self, origin: int, dest: int, emergency: bool = False) -> int | None:
        path = self.net.shortest_path(origin, dest, self.blocked)
        if not path or len(path) < 2:
            return None
        vid = self._next_id
        self._next_id += 1
        veh = Vehicle(id=vid, path=path, emergency=emergency, entered=self.time)
        self.pending.append(veh)
        if emergency:
            self.emergency_active_id = vid
            self.emergency_response_s = None
            self.emergency_stops = None
        return vid

    def _admit_pending(self) -> None:
        still: list[Vehicle] = []
        for veh in self.pending:
            first = (veh.path[0], veh.path[1])
            if first in self.blocked:
                still.append(veh)
                continue
            if self.has_room(first):
                self.edge_vehicles[first].append(veh)
                self.vehicles[veh.id] = veh
            else:
                still.append(veh)
        self.pending = still

    # --- disruptions ------------------------------------------------------
    def block_edge(self, u: int, v: int, duration: float) -> None:
        for e in ((u, v), (v, u)):
            self.blocked.add(e)
            self.blocked_until[e] = self.time + duration
        self._reroute_all()

    def close_edges(self, pairs: list[tuple[int, int]]) -> None:
        for u, v in pairs:
            for e in ((u, v), (v, u)):
                self.blocked.add(e)
                self.blocked_until[e] = math.inf
        self._reroute_all()

    def _unblock_expired(self) -> None:
        expired = [e for e, t in self.blocked_until.items() if self.time >= t]
        for e in expired:
            self.blocked.discard(e)
            self.blocked_until.pop(e, None)
        if expired:
            self._reroute_all()

    def _unblock_signals(self) -> None:
        expired = [n for n, t in self.failed_until.items() if self.time >= t]
        for n in expired:
            self.failed_signals.discard(n)
            self.failed_until.pop(n, None)

    # --- environment controls ---------------------------------------------
    def set_weather_factor(self, factor: float) -> None:
        """Scale vehicle free-flow speed (rain reduces capacity and speed)."""
        self.weather_speed_factor = max(0.3, min(1.0, factor))

    def fail_signals(self, nodes: list[int], duration: float) -> None:
        """Put specified intersections into all-red failure mode."""
        for n in nodes:
            self.failed_signals.add(n)
            self.failed_until[n] = self.time + duration

    def block_edges_timed(self, pairs: list[tuple[int, int]], duration: float) -> None:
        """Block a set of directed edges for `duration` sim-seconds then auto-clear."""
        for u, v in pairs:
            self.blocked.add((u, v))
            self.blocked_until[(u, v)] = self.time + duration
        self._reroute_all()

    def _reroute_all(self) -> None:
        for veh in self.vehicles.values():
            # keep the edge the vehicle is committed to; replan from v onward
            new = self.net.shortest_path(veh.v, veh.path[-1], self.blocked)
            if new and len(new) >= 1:
                veh.path = veh.path[: veh.idx + 1] + new
        for veh in self.pending:
            new = self.net.shortest_path(veh.path[0], veh.path[-1], self.blocked)
            if new:
                veh.path = new

    # --- main step --------------------------------------------------------
    def step(self, dt: float) -> None:
        self.time += dt
        self._unblock_expired()
        self._unblock_signals()
        self._admit_pending()
        self.controller.update(self, dt)
        if self.preemption:
            self._apply_preemption()
        self._move(dt)
        self._discharge(dt)
        self._accumulate(dt)

    def _apply_preemption(self) -> None:
        """Force green along an emergency vehicle's approach (transit-signal priority)."""
        for veh in self.vehicles.values():
            if not veh.emergency:
                continue
            node = veh.v
            served = 0 if self.net.orientation(veh.u, veh.v) == "V" else 1
            if self.phase.get(node) != served:
                self.phase[node] = served
                self.phase_time[node] = 0.0

    def _move(self, dt: float) -> None:
        completed_now: list[Vehicle] = []
        for edge, vehs in self.edge_vehicles.items():
            if not vehs:
                continue
            length = self.net.length(*edge)
            vehs.sort(key=lambda x: -x.pos)  # leader (closest to stop line) first
            leader_pos: float | None = None
            for veh in vehs:
                ceiling = length
                if leader_pos is not None:
                    ceiling = min(ceiling, leader_pos - MIN_GAP)
                new_pos = min(veh.pos + veh.speed * self.weather_speed_factor * dt, ceiling)
                moved = new_pos - veh.pos > 1e-6
                if not moved and not veh.stopped:
                    veh.stopped = True
                    veh.stops += 1
                    self.co2_g += CO2_STOP_PENALTY  # acceleration cost of a stop
                elif moved:
                    veh.stopped = False
                veh.pos = max(veh.pos, new_pos)
                leader_pos = veh.pos

            # vehicles that reached the stop line of their final edge are done
            for veh in vehs:
                if veh.is_last_edge and veh.pos >= length - STOPLINE_EPS:
                    completed_now.append(veh)

        for veh in completed_now:
            self._complete(veh)

    def _discharge(self, dt: float) -> None:
        for node in self.net.nodes:
            if node in self.failed_signals:
                continue  # all-red: no vehicles cross on any phase
            phase = self.phase[node]
            served = "V" if phase == 0 else "H"
            for nb in self.net.neighbors[node]:
                edge = (nb, node)
                emergency_here = any(
                    v.emergency and v.pos >= self.net.length(*edge) - STOPLINE_EPS
                    for v in self.edge_vehicles[edge]
                )
                if self.net.orientation(nb, node) != served and not emergency_here:
                    continue
                self.discharge_credit[edge] += SAT_FLOW * dt
                length = self.net.length(*edge)
                # vehicles closest to the stop line go first
                queue = sorted(
                    (v for v in self.edge_vehicles[edge] if v.pos >= length - STOPLINE_EPS),
                    key=lambda x: (not x.emergency, -x.pos),
                )
                for veh in queue:
                    if self.discharge_credit[edge] < 1.0 and not veh.emergency:
                        break
                    nxt = (node, veh.path[veh.idx + 2]) if veh.idx + 2 < len(veh.path) else None
                    if nxt is None:
                        continue  # final-edge completion handled in _move
                    if nxt in self.blocked or not self.has_room(nxt):
                        break  # blocked downstream — cannot release this approach
                    self.edge_vehicles[edge].remove(veh)
                    veh.idx += 1
                    veh.pos = 0.0
                    self.edge_vehicles[nxt].append(veh)
                    if not veh.emergency:
                        self.discharge_credit[edge] -= 1.0

    def _complete(self, veh: Vehicle) -> None:
        edge = (veh.u, veh.v)
        if veh in self.edge_vehicles[edge]:
            self.edge_vehicles[edge].remove(veh)
        self.vehicles.pop(veh.id, None)
        self.completed += 1
        self.total_travel_time += self.time - veh.entered
        self._completions.append(self.time)
        if veh.emergency and veh.id == self.emergency_active_id:
            self.emergency_response_s = self.time - veh.entered
            self.emergency_stops = veh.stops
            self.emergency_active_id = None

    def _accumulate(self, dt: float) -> None:
        for veh in self.vehicles.values():
            if veh.stopped:
                self.total_wait_time += dt
                self.co2_g += CO2_IDLE * dt
            else:
                self.co2_g += CO2_RUN * dt
        # stop-and-go penalty is folded in via per-vehicle stop counting
        # (counted once when a vehicle transitions to stopped, applied here lazily)

    # --- outputs ----------------------------------------------------------
    def _throughput_per_min(self) -> float:
        window = 60.0
        recent = [t for t in self._completions if t >= self.time - window]
        self._completions = recent
        if self.time < window:
            span = max(self.time, 1e-6)
            return len(recent) / span * 60.0
        return len(recent)  # completions in the last 60s == per-minute rate

    def kpis(self) -> dict:
        active = len(self.vehicles)
        mean_queue = (
            sum(self.waiting_count(e) for e in self.net.edges) / max(1, len(self.net.edges))
        )
        co2 = self.co2_g  # stop penalties already folded in at stop-time
        return {
            "completed": self.completed,
            "active": active,
            "avgTravelTimeS": round(
                self.total_travel_time / self.completed, 1
            ) if self.completed else 0.0,
            "totalWaitS": round(self.total_wait_time, 1),
            "throughputPerMin": round(self._throughput_per_min(), 1),
            "meanQueue": round(mean_queue, 2),
            "co2Kg": round(co2 / 1000.0, 2),
            "fuelL": round(co2 / G_CO2_PER_LITRE, 2),
            "emergencyResponseS": (
                round(self.emergency_response_s, 1)
                if self.emergency_response_s is not None
                else None
            ),
            "emergencyStops": self.emergency_stops,
        }

    def _world_pos(self, veh: Vehicle) -> tuple[float, float]:
        ux, uy = self.net.nodes[veh.u]
        vx, vy = self.net.nodes[veh.v]
        length = self.net.length(veh.u, veh.v)
        frac = min(1.0, veh.pos / length) if length else 0.0
        dx, dy = vx - ux, vy - uy
        d = math.hypot(dx, dy) or 1.0
        # perpendicular offset for right-hand-side lane separation
        ox, oy = -dy / d * LANE_OFFSET, dx / d * LANE_OFFSET
        return ux + dx * frac + ox, uy + dy * frac + oy

    def frame(self) -> dict:
        vehicles = []
        for veh in self.vehicles.values():
            x, y = self._world_pos(veh)
            vehicles.append(
                [
                    veh.id,
                    round(x, 1),
                    round(y, 1),
                    1 if veh.emergency else 0,
                    1 if veh.stopped else 0,
                ]
            )
        signals = [[n, self.phase[n]] for n in self.net.nodes]
        return {
            "vehicles": vehicles,
            "signals": signals,
            "kpis": self.kpis(),
            "failedSignals": list(self.failed_signals),
        }
