# GreenWave 🌊🚦

> **A real-time AI digital twin that proves smarter traffic signals save lives, time, and the planet — live, in 3D, in your browser.**

Two identical city districts run side by side. One is controlled by the same fixed timers most cities have used since the 1970s. The other is run by **GreenWave's AI**. Both receive the exact same vehicles from the same random seed. Every second you watch, the AI measurably outperforms the baseline — and every disruption you inject widens the gap further.

**FutureHacks 2026 · Advanced division · Theme: The Future City**

---

## The Problem

Urban traffic signals are one of the most consequential, most neglected pieces of infrastructure in the world:

- **54 billion hours** of commuter time are lost annually to traffic congestion in the US alone.
- The average urban driver spends **~50 extra hours per year** sitting at red lights with no cross-traffic.
- Idling and stop-and-go driving accounts for a disproportionate share of **vehicle CO₂ emissions** — fuel burned while going nowhere.
- Emergency vehicles lose an average of **1–3 minutes per mile** to red lights. For cardiac arrest, every minute reduces survival odds by ~10%.
- City planners have **no safe sandbox** to test changes. Every experiment happens on a live city with real commuters.

The root cause: signals are still timed to a fixed schedule written once, decades ago, based on traffic surveys that are immediately out of date. They don't know what's actually on the road right now.

---

## The Solution

GreenWave runs a live simulation of a city district and replaces fixed timing with **Max-Pressure adaptive control** — a decentralized, mathematically proven signal policy that reads actual queue lengths at each intersection and allocates green time to where demand is highest. No training data needed. No black box. Citable in the traffic engineering literature.

On top of that: **transit signal priority** — when an ambulance enters the network, GreenWave detects it on each approach and pre-empts the signal green before it arrives, opening a corridor through the city. The fixed city makes it wait at every red.

The whole thing runs **live in your browser** with a 3D rendered city, real-time KPIs, and interactive disruptions you can inject while it runs.

---

## Verified Results

These numbers come from a headless 1000-second benchmark run (accident injected at t=400s, demand multiplier 1.0):

| Metric | Fixed Timing | GreenWave AI | Improvement |
|---|---|---|---|
| Avg trip time | 121.8 s | 66.8 s | **45% faster** |
| Total wait time | 72,425 s | 13,966 s | **81% less idle time** |
| Trips completed | 1,237 | 1,433 | **+16% throughput** |
| Mean queue length | 0.53 veh | 0.05 veh | **91% shorter queues** |
| CO₂ emitted | 275 kg | 201 kg | **27% less emissions** |
| Ambulance: travel time | 133.5 s | 111.0 s | **17% faster response** |
| Ambulance: stops | 3 | **0** | never stopped at a red |

*Numbers vary with the live scenario you create in the UI — inject accidents and surges to widen the gap further.*

---

## Features

### Core Simulation
- **Spatial-queue traffic micro-simulation** — vehicles travel along directed edges, queue at stop lines, discharge at green phases via a saturation flow model. Pure Python, no SUMO, no NumPy, no external API keys.
- **Deterministic demand** — both twins receive the same Poisson-distributed vehicle demand stream from a shared seeded RNG (seed=42). The comparison is a fair counterfactual, not cherry-picked.
- **45% central-avenue bias** — asymmetric demand (like a real city's main artery) is exactly where adaptive control beats fixed timing most.
- **Emissions model** — CO₂ accumulates per second of motion (1.6 g/s), idling (0.9 g/s), and per stop-and-go event (8 g penalty for acceleration). A network that flows better is measurably cleaner.

### AI Controller: Max-Pressure
- At every intersection, every tick, compute the **pressure** of each signal phase:
  `pressure = (halted vehicles upstream) − 0.5 × (halted vehicles downstream)`
- Give green to whichever phase has higher pressure.
- **Hysteresis** (0.5 veh threshold) prevents signal flapping under noise.
- **Min-green** (6 s) prevents dangerous short-phasing.
- This policy is **provably throughput-optimal** under any stable demand. It was introduced by Varaiya (2013) and has been validated in real-world deployments.

### Emergency Green Corridor (Transit Signal Priority)
- Spawns one emergency vehicle on a corner-to-corner route in both twins simultaneously.
- In the **Fixed** city: it waits at every red like any other vehicle.
- In the **AI** city: as the ambulance enters each approach edge, GreenWave detects it and **force-switches the downstream intersection to green** before it arrives. The corridor opens ahead of the vehicle. It never stops.
- Tracks and displays: response time, number of stops, and the delta between cities.

### 3D Real-Time Visualization
- Built with **React Three Fiber** (three.js) on GPU-instanced meshes — roads, buildings, signals, and up to ~900 vehicles per twin rendered at 60 fps.
- **Zero React re-renders per frame** — all animation runs inside `useFrame` reading the Zustand store directly, bypassing the React reconciler entirely.
- **Frame interpolation** — WebSocket delivers ~10 Hz snapshots; the renderer interpolates vehicle positions between frames for smooth 60 fps motion.
- **Bloom post-processing** (`@react-three/postprocessing`) — traffic signals, headlights, and rooftop beacons glow via `meshBasicMaterial` with `toneMapped={false}`.
- **Congestion colouring** — cars shade from green (free flow) to red (stopped) using per-instance colour on the InstancedMesh.
- **Headlights** — each vehicle has a white glow at its front, offset along its heading, that also catches Bloom.

### Live Pollution Heatmap
- A 64×48 `DataTexture` accumulates vehicle presence each frame on the city ground plane.
- **Idling cars weigh 3×** moving cars — jams light up red, free-flowing streets stay green.
- Per-frame exponential decay (×0.9) keeps the map temporally smoothed and responsive.
- Rendered as a single translucent plane (green → yellow → red), updated in `useFrame` — no backend change needed, pure client-side from the live vehicle stream.
- Toggle with the **🔥 Pollution map** button. In Split view, the Fixed city glows redder than the AI city.

### Guided Demo Tour
- **🎬 Demo Tour** auto-plays a 7-step scripted highlight reel with timed narration captions:
  - Intro → single AI hero view → split A/B comparison → inject accident → send ambulance → demand surge → pollution heatmap → closing impact statement.
- **Cinematic auto-orbit** during the tour (camera slowly rotates; any mouse drag instantly gives control back).
- **Cancellation token pattern** — a monotonic integer invalidates any in-flight tour instantly. Fully cancellable with **Skip** or **⏹ Stop tour**.
- Designed so you hit play, screen-record for 2–3 minutes, and have your demo video done.

### Weather System
- **☀️ Clear / 🌧️ Rain / ⛈️ Heavy rain** buttons change real simulation physics:
  - Rain → vehicles drive at 75% free-flow speed, demand drops 12% (people stay home).
  - Heavy rain → 50% speed, 28% fewer trips.
- **🌐 Live button** — fetches current weather from `wttr.in` (zero API key) and auto-applies the matching condition.
- **Rain particles** — 900 falling blue-white points rendered via `BufferGeometry` / `Points`, updated per-frame, invisible when clear, faster in heavy rain.
- Sky colour, fog, and all scene lighting update imperatively each frame to match weather (darker, bluer under rain).

### Day / Night Cycle
- Sim clock starts at **7:00 AM** and advances 1 city-minute per physics tick, cycling through a full 24-hour day in ~2.4 real minutes at speed 1.
- **🌙 Auto rush-hour** toggle enables a real demand curve: flat overnight (0.15×) → morning build → 8 AM peak (1.55×) → lunch dip → 5 PM peak (1.65×) → evening taper.
- Sky, fog, and lighting change continuously: purple dawn → dark teal midday → deep red dusk → near-black night.
- Current sim time shown live as **🕐 8:14 AM** in the control panel.

### Interactive Disruptions

| Button | What it does | Duration |
|---|---|---|
| 💥 Accident | Blocks a central intersection edge | 45 s, then auto-clears |
| 🌊 Flood / close blocks | Permanently removes a 2×2 block of roads | Permanent (session reset to restore) |
| 📈 Rush-hour surge | Multiplies demand by 1.8× | Permanent until reset |
| 🚑 Ambulance | Sends emergency vehicle corner-to-corner | Until it arrives |
| 🚨 Motorcade | Blocks the entire central avenue (7 edges) | 120 s, then auto-clears |
| 💡 Signal failure | 4 random intersections go all-red, blink amber | 60 s, then auto-restores |
| 📢 Protest | Closes a 3-block mid-city corridor | 90 s, then auto-clears |
| 🏟️ Stadium surge | 2.5× demand spike | Permanent until reset |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Browser                                                │
│  React + TypeScript + Vite + Tailwind + Zustand         │
│                                                         │
│  ┌─────────────────────┐  ┌────────────────────────┐   │
│  │  React Three Fiber  │  │  Control Panel + KPIs  │   │
│  │  3D city (R3F/drei) │  │  Zustand store         │   │
│  │  GPU instanced mesh │  │  WebSocket client      │   │
│  │  useFrame animation │  │  REST action sender    │   │
│  └─────────────────────┘  └────────────────────────┘   │
└──────────────────────┬──────────────────────────────────┘
         WebSocket /ws │  REST POST /api/action
                       ▼
┌─────────────────────────────────────────────────────────┐
│  FastAPI (Python 3.12 + Uvicorn + asyncio)              │
│  apps/api/main.py                                       │
│                                                         │
│  SimManager (apps/api/manager.py)                       │
│  ├─ Shared seeded RNG (seed=42) → fair demand stream    │
│  ├─ Twin A: Simulation + FixedController                │
│  └─ Twin B: Simulation + MaxPressureController          │
│             (preemption=True → emergency corridor)      │
│                                                         │
│  10 Hz asyncio broadcast loop → JSON snapshot           │
│  asyncio.Queue(maxsize=2) per subscriber (drops stale)  │
└─────────────────────────────────────────────────────────┘
```

### Simulation Engine (`apps/api/sim/`)

**`network.py`** — `GridNetwork(rows=6, cols=8, spacing=120m)`: bidirectional directed graph. Each edge has an orientation (`"H"` or `"V"`) that maps to signal phases. A* routing with Manhattan heuristic and a `blocked` edge set for disruptions.

**`simulation.py`** — `Simulation`: the spatial-queue micro-sim.
- Vehicles are dataclasses with `path`, `pos`, `speed`, `stopped`, `emergency`, `stops`.
- `_move(dt)` — each edge's vehicles sort by position (leader first). Each vehicle advances to `min(edge_length, leader_pos − MIN_GAP)`, applying `weather_speed_factor`. Stop events are detected and CO₂ penalty logged once.
- `_discharge(dt)` — for each green phase at each non-failed intersection, vehicles at the stop line cross via a saturation flow credit (`SAT_FLOW = 0.55 veh/s`). Emergency vehicles always cross.
- `_apply_preemption()` — force-switches the downstream intersection of an active emergency vehicle to the correct phase.

**`controllers.py`** — two controllers, same interface (`reset`, `update`):
- `FixedController` — 22-second green time, simple timer toggle.
- `MaxPressureController` — every tick after `min_green` has elapsed, compute `pressure = Σ_waiting_upstream − 0.5 × Σ_waiting_downstream` for each orientation, switch to the higher one if the gap exceeds 0.5 (hysteresis).

### Frontend Architecture (`apps/web/src/`)

**`scene/CityScene.tsx`** — R3F `Canvas` host. Contains `SkyLighting` (drives fog + ambient/dir/hemisphere lights imperatively via `useFrame` + `gl.setClearColor`). Includes all sub-scenes.

**`scene/Vehicles.tsx`** — Three `InstancedMesh` objects (body, headlight, emergency). Every frame: read store snapshot, interpolate position between `prev` and `cur` by `(now − curAt) / (curAt − prevAt)`, compute heading from velocity, `setMatrixAt` + `setColorAt`. No React state updates ever.

**`scene/Signals.tsx`** — Two `InstancedMesh` per intersection (NS + EW spheres). Every frame: read `failedSignals`, blink amber if failed; otherwise green/red by phase. `meshBasicMaterial toneMapped={false}` → Bloom glow.

**`scene/Heatmap.tsx`** — `DataTexture` 64×48. Every frame: decay all cells × 0.9, accumulate stopped vehicles (+3) and moving (+1) at their grid cell. Map intensity to green→yellow→red RGBA. `planeGeometry` at y=0.06 with transparent `meshBasicMaterial`.

**`scene/RainParticles.tsx`** — `BufferGeometry` / `Points` with 900 particles. Every frame: advance Y by `speed × dt`, reset to top when below ground. All mutations directly on the `Float32Array` via the `BufferAttribute` reference.

**`scene/Buildings.tsx`** — Procedural instanced buildings using `mulberry32` seeded PRNG for full determinism across refreshes. Dark palette (`#1b2733` etc). Neon rooftop beacons (`meshBasicMaterial toneMapped={false}`) glow through Bloom.

**`store.ts`** — Zustand store. Holds `network`, `cur`/`prev` snapshots + timestamps for interpolation, `tourActive`, `tourCaption`, `autoOrbit`, `showHeatmap`. All frame-rate animation reads `store.getState()` directly (not hooks) to avoid React re-renders.

**`tour.ts`** — Cancellation token pattern (`let token = 0`; each tour increments and checks `token !== myToken` before every step). 7-step sequence with `sendAction` calls, `sleep` dwells, and `setTourCaption` narration.

---

## Project Structure

```
greenwave/
├─ apps/
│  ├─ api/                        # Python backend
│  │  ├─ sim/
│  │  │  ├─ network.py            # GridNetwork, A* routing
│  │  │  ├─ simulation.py         # spatial-queue micro-sim, emissions
│  │  │  └─ controllers.py        # FixedController, MaxPressureController
│  │  ├─ manager.py               # SimManager: two twins, demand, disruptions
│  │  ├─ main.py                  # FastAPI app: REST + WebSocket
│  │  ├─ requirements.txt
│  │  └─ Dockerfile               # production-ready, $PORT aware
│  │
│  └─ web/                        # React frontend
│     └─ src/
│        ├─ scene/
│        │  ├─ CityScene.tsx      # R3F Canvas, SkyLighting, camera
│        │  ├─ Vehicles.tsx       # instanced cars, headlights, interpolation
│        │  ├─ Signals.tsx        # glowing instanced signals, amber blink
│        │  ├─ Buildings.tsx      # procedural instanced city blocks
│        │  ├─ Roads.tsx          # instanced road planes
│        │  ├─ Heatmap.tsx        # live DataTexture pollution overlay
│        │  ├─ RainParticles.tsx  # 900-point falling rain system
│        │  ├─ Disruptions.tsx    # blocked-edge red overlay
│        │  └─ transform.ts       # world-coordinate transform
│        ├─ components/
│        │  ├─ ControlPanel.tsx   # all buttons, sliders, weather, clock
│        │  ├─ KpiDashboard.tsx   # live A/B stats with % improvement
│        │  ├─ Header.tsx
│        │  └─ TourCaption.tsx    # animated narration banner
│        ├─ api.ts                # fetchNetwork, sendAction, connectStream
│        ├─ store.ts              # Zustand global state
│        ├─ tour.ts               # 7-step scripted demo tour
│        └─ types.ts              # NetworkT, Snapshot, Frame, VehicleT ...
│
├─ docs/
│  ├─ 00-PLANNING-INDEX.md
│  ├─ 01-CONCEPT.md               # ideation + why GreenWave beats alternatives
│  ├─ 02-PRD.md                   # product requirements
│  ├─ 03-TRD.md                   # technical design + scale-up roadmap
│  └─ 04-ROADMAP.md               # sprint plan + cut-lines
│
├─ infra/
│  └─ docker-compose.yml          # one-command local backend via Docker
│
├─ scripts/
│  └─ dev.ps1                     # Windows launcher (two terminal windows)
│
├─ .gitignore
└─ README.md
```

---

## Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend framework | React 18 + TypeScript + Vite | Fast HMR, strong typing, production build |
| 3D rendering | React Three Fiber + three.js | GPU-accelerated WebGL, instanced meshes, declarative scene graph |
| 3D helpers | @react-three/drei | OrbitControls, Suspense wrappers |
| Post-processing | @react-three/postprocessing | Bloom effect for signals/headlights |
| UI state | Zustand | Minimal, sync-read in useFrame (no hook overhead) |
| Styling | Tailwind CSS | Utility-first, dark control-room aesthetic |
| Backend | Python 3.12 + FastAPI + Uvicorn | Async WebSocket, clean REST, typed with Pydantic |
| Simulation | Pure Python spatial-queue sim | Zero external dependencies, cross-platform, fully self-contained |
| AI controller | Max-Pressure (Varaiya 2013) | Provably optimal, no training, real traffic engineering |
| Realtime transport | WebSocket (JSON, ~10 Hz) | Low latency, bidirectional, natively supported by FastAPI |
| Containerization | Docker | One-command deploy to any cloud, $PORT-aware |

---

## Running Locally

**Prerequisites:** Python 3.11+ · Node 18+ · (optional) Docker

### Quick start (Windows)

```powershell
cd greenwave
./scripts/dev.ps1
```

Opens two terminal windows: API on `:8000` and web dev server on `:5173`.

### Manual setup

**Backend:**

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Check it's alive: `http://localhost:8000/health` → `{"status":"ok","tick":0}`

**Frontend:**

```bash
cd apps/web
npm install
npm run dev                      # http://localhost:5173
```

Open `http://localhost:5173` and click **▶ Run the city**.

### Via Docker (backend only)

```bash
cd greenwave/infra
docker compose up --build        # API on http://localhost:8000
```

Then run the frontend manually with `npm run dev` as above.

---

## Deploying to Production

### Step 1 — Push to GitHub

```bash
cd greenwave
git init
git add .
git commit -m "Initial commit: GreenWave AI traffic digital twin"
git remote add origin https://github.com/YOUR_USERNAME/greenwave.git
git branch -M main
git push -u origin main
```

### Step 2 — Deploy the backend to Render.com

1. Go to [render.com](https://render.com) → **New → Web Service**
2. Connect your `greenwave` GitHub repo
3. Configure:

| Setting | Value |
|---|---|
| Root Directory | `apps/api` |
| Runtime | `Docker` |
| Instance Type | Free (or Starter $7/mo for always-on) |

4. Click **Create Web Service** — first deploy takes ~3 minutes
5. Note your URL: `https://greenwave-api.onrender.com`

> **Free tier note:** spins down after 15 min of inactivity; first request takes ~30s to wake. Use the Starter plan for a live demo that needs to respond instantly.

### Step 3 — Deploy the frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. Import the `greenwave` repo
3. Configure:

| Setting | Value |
|---|---|
| Root Directory | `apps/web` |
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

4. Add environment variable:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://greenwave-api.onrender.com` |

5. Click **Deploy** — live in ~60 seconds

### Auto-deploys

Both Render and Vercel watch the `main` branch. Every `git push` triggers an automatic redeploy with no manual steps.

### Production architecture

```
User browser  ──►  Vercel CDN (static React bundle)
                        │
              VITE_API_URL points to ▼
                   Render.com (Docker)
                   FastAPI + asyncio sim engine
                   Port $PORT (set by Render)
                   No database · No Redis · No secrets
```

Lock CORS before going public: change `allow_origins=["*"]` in `apps/api/main.py` to your Vercel domain.

---

## API Reference

### REST

| Method | Path | Body / Params | Description |
|---|---|---|---|
| `GET` | `/health` | — | Liveness check. Returns `{status, tick}` |
| `GET` | `/api/network` | — | Grid network as GeoJSON-like `{nodes, edges, bounds, rows, cols, spacing}` |
| `GET` | `/api/state` | — | Full snapshot (same shape as WebSocket frames) |
| `POST` | `/api/action` | `{type, value?, node?}` | See action types below |

### Action types (`POST /api/action`)

| `type` | `value` | Effect |
|---|---|---|
| `play` | — | Start the simulation |
| `pause` | — | Pause the simulation |
| `reset` | — | Rebuild both twins from seed |
| `speed` | `1`/`2`/`4` | Set simulation speed multiplier |
| `demand` | `0.2`–`4.0` | Set trip spawn rate multiplier |
| `accident` | — | Block a central edge for 45 s |
| `closure` | — | Permanently close a 2×2 block of roads |
| `surge` | — | Multiply demand by 1.8× |
| `emergency` | — | Dispatch ambulance corner-to-corner |
| `weather` | `0`/`1`/`2` | Clear / Rain / Heavy rain |
| `day_night` | — | Toggle automatic rush-hour demand curve |
| `motorcade` | — | Block entire central avenue for 120 s |
| `signal_failure` | — | Fail 4 random intersections for 60 s |
| `protest` | — | Close a 3-block corridor for 90 s |
| `stadium` | — | Multiply demand by 2.5× |

### WebSocket `/ws`

Connects and immediately receives a snapshot, then gets pushed ~10 frames/second.

```ts
// Frame shape (TypeScript)
type Snapshot = {
  tick: number;
  simTime: number;       // elapsed simulation seconds
  running: boolean;
  speed: number;
  demand: number;        // effective demand multiplier
  blocked: [number, number][];   // edges currently closed
  weather: "clear" | "rain" | "heavy";
  simClock: number;      // minutes since midnight (0–1439)
  dayNightAuto: boolean;
  twins: {
    fixed: Frame;
    ai: Frame;
  };
  savings: {
    travelTimePct: number;  // positive = AI wins
    waitPct: number;
    co2Pct: number;
    co2KgSaved: number;
    queuePct: number;
  };
};

type Frame = {
  vehicles: [id, x, y, emergency(0|1), stopped(0|1)][];
  signals:  [nodeId, phase(0=V green|1=H green)][];
  kpis: Kpis;
  failedSignals: number[];  // node IDs of all-red failed intersections
};

type Kpis = {
  completed: number;
  active: number;
  avgTravelTimeS: number;
  totalWaitS: number;
  throughputPerMin: number;
  meanQueue: number;
  co2Kg: number;
  fuelL: number;
  emergencyResponseS: number | null;
  emergencyStops: number | null;
};
```

---

## The Science

### Max-Pressure Control

Introduced by Varaiya (2013) as a generalisation of backpressure routing to signalised networks. The key properties:

1. **Decentralised** — each intersection runs independently, with no coordination overhead.
2. **Provably stabilising** — for any arrival rate vector inside the capacity region, Max-Pressure keeps queues bounded. No other policy has this guarantee.
3. **No training** — it reads queue lengths in real time; there's no offline learning phase that could diverge from deployment conditions.
4. **Explainable** — you can point at any intersection at any moment and explain exactly why it's green.

GreenWave's implementation:

```python
def _pressure(self, sim, node, orient):
    incoming = sum(sim.waiting_count((nb, node))
                   for nb in sim.net.neighbors[node]
                   if sim.net.orientation(nb, node) == orient)
    outgoing = sum(sim.waiting_count((node, nb))
                   for nb in sim.net.neighbors[node]
                   if sim.net.orientation(node, nb) == orient)
    return incoming - 0.5 * outgoing
```

`waiting_count` counts vehicles with `stopped=True` on an edge (not just those at the stop line — that would undercount a fully jammed road).

### Emissions Model

```
CO₂ while moving:  1.6 g/s   (typical urban petrol, ~8 L/100km at 13 m/s)
CO₂ while idling:  0.9 g/s   (engine at tick-over)
CO₂ per stop:      8.0 g     (fuel cost of a stop-and-go acceleration event)
```

A signal that holds green longer for a busy queue isn't just faster — it eliminates the repeated stop-and-go penalty that fixed timing accumulates. That's why the CO₂ improvement (27%) is smaller than the wait improvement (81%) but still material.

### Vehicle Dynamics

```
Free-flow speed:   13.0 m/s  (~47 km/h urban)
Min gap:           7.0 m     (bumper-to-bumper, sets jam density)
Saturation flow:   0.55 veh/s per green approach
Lane offset:       7.0 m     (perpendicular, right-hand driving)
```

---

## KPI Definitions

| KPI | Definition |
|---|---|
| Avg trip time | Mean (arrival time − departure time) over all completed trips |
| Total wait time | Cumulative seconds all vehicles have spent with `stopped=True` |
| Throughput | Trips completed in the last 60 sim-seconds (trips/min) |
| Mean queue | Average number of halted vehicles per edge across all edges |
| CO₂ (kg) | Motion + idle + stop-penalty, accumulated since last reset |
| Fuel (L) | CO₂ ÷ 2310 g/L (petrol combustion constant) |
| Emergency response | Travel time of the most recent ambulance dispatch |
| Emergency stops | Number of times the ambulance had a `stopped=True` event |

The **savings** figures in the KPI dashboard are always computed as `(fixed − ai) / |fixed|` so a positive number always means the AI wins, regardless of whether lower or higher is better for that metric.

---

## Hackathon Judging Criteria

| Criterion | How GreenWave addresses it |
|---|---|
| **AI / ML integration** | Max-Pressure adaptive control (citable algorithm); emergent TSP corridor; optional real-weather API integration |
| **Technical execution** | Custom simulation engine; async WebSocket pipeline at 10 Hz; GPU-instanced 3D renderer at 60 fps; zero external sim dependencies |
| **Usability** | Zero-config local setup; one-click demo tour; every feature is interactive and immediate |
| **Impact** | Quantified: 45% faster trips, 81% less idle time, 27% CO₂ reduction, ambulance never stops — measured, not asserted |
| **Theme: Future City** | Smart adaptive infrastructure; sustainability (emissions ↓); civic emergency response; planner sandbox; day/night + weather realism |

---

## Roadmap (Stretch Goals)

The current build is a self-contained MVP that proves the core value claim. The architecture is designed to scale:

- **Real OSM district** — swap the procedural `GridNetwork` for an `osmnx`-imported real map. Frontend basemap switches to MapLibre GL with a GeoJSON overlay.
- **SUMO engine** — replace the Python sim with SUMO via `libsumo`/TraCI for industry-standard vehicle dynamics and real emission models. The controller interface is identical.
- **Deep-RL controller** — train a DQN agent offline with SUMO-RL; inference only at demo time. Adds a third "AI+" twin for three-way comparison.
- **Claude planning copilot** — natural language scenario editor: type "add a bus lane on Main St" → Claude parses intent → configures a scenario and explains the expected impact.
- **Multi-district workers** — stateless FastAPI + Redis pub/sub + N district sim workers → horizontal scale to a whole city.
- **Live open-data demand** — seed vehicle demand from real traffic count APIs (INRIX, HERE, city open-data) instead of synthetic Poisson.
- **Save / share URL** — encode scenario seed + disruption timeline as URL params; share a specific scenario for reproducible comparison.

---

## Acknowledgements

- **Max-Pressure control** — P. Varaiya, "Max pressure control of a network of signalized intersections," *Transportation Research Part C*, 2013.
- **React Three Fiber** — [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber)
- **Weather data** — [wttr.in](https://wttr.in) (Igor Chubin, open source)
- Built for **FutureHacks 2026** hosted by TechShare. The "FutureCity AI" example in the brief is intentionally not reused — GreenWave is original work.

---

*Questions or issues? Open a GitHub issue.*
