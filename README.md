# GreenWave 🌊🚦 — the self-optimizing city

> A real-time AI **digital twin** where a city district's traffic signals optimize
> themselves live. Two identical cities run side by side — one on today's fixed timers,
> one run by GreenWave's AI — and you watch the AI cut commute times, queues, emissions,
> and emergency-response times in real time. Inject an accident, a flood, or an ambulance
> and watch it adapt.

**FutureHacks 2026 · Advanced division · Theme: The Future City**

📄 Planning docs (concept / PRD / TRD / roadmap) live in [`docs/`](docs/):
[Concept](docs/01-CONCEPT.md) · [PRD](docs/02-PRD.md) · [TRD](docs/03-TRD.md) · [Roadmap](docs/04-ROADMAP.md)

---

## ✨ What it does
- **Live digital twin** of a road network with vehicles moving in real time (WebSocket stream).
- **A/B counterfactual:** `Fixed timing` vs `GreenWave AI` (Max-Pressure adaptive control),
  fed the *exact same cars* so the comparison is fair.
- **Interactive disruptions:** accident, flood/road-closure, rush-hour surge, demand slider.
- **Emergency green-corridor:** dispatch an ambulance — the AI pre-empts signals along its
  route so it sails through; the fixed-timing city does not.
- **Live impact dashboard:** avg trip time, total wait, throughput, queues, CO₂, fuel,
  emergency response time — each with the AI's % improvement.

### Verified results (headless 1000s run, accident at t=400s)
| Metric | Fixed | GreenWave AI | Improvement |
|---|---|---|---|
| Avg trip time | 121.8 s | 66.8 s | **45% faster** |
| Total time waiting | 72,425 s | 13,966 s | **81% less** |
| Trips completed | 1,237 | 1,433 | **+16% throughput** |
| Mean queue | 0.53 | 0.05 | **91% shorter** |
| CO₂ emitted | 275 kg | 201 kg | **27% less** |
| Ambulance run | 133.5 s / 3 stops | 111 s / **0 stops** | faster + never stops |

*(Numbers vary slightly with the live scenario you create in the UI.)*

---

## 🧱 Architecture
```
Browser (React Three Fiber 3D)  ─WebSocket─►  FastAPI gateway  ──►  SimManager
  3D city + KPIs + controls       /ws, /api       (asyncio loop)       ├─ Twin A: Fixed-time
                                                                    └─ Twin B: GreenWave AI
                                                          (Max-Pressure control + emergency preemption)
```
- **Backend** (`apps/api`): pure-Python spatial-queue traffic micro-simulation — **no SUMO,
  no NumPy, no API keys**. Two twins step in lock-step on one seeded demand stream. FastAPI
  streams frames at ~10 Hz; REST endpoints inject disruptions.
- **Frontend** (`apps/web`): React + TypeScript + Vite + Tailwind + Zustand, rendering a
  **real-time 3D digital twin** with **React Three Fiber / three.js** (`@react-three/drei`,
  `@react-three/postprocessing` Bloom). The whole city — roads, procedural buildings, glowing
  signals, and up to ~900 cars per twin — is **GPU-instanced**, and every animated mesh is
  updated imperatively inside `useFrame` (reading the store directly, zero React re-renders
  per frame). Vehicle positions are interpolated between WebSocket frames; headings come from
  velocity.
- The TRD's SUMO + Redis path is the documented scale-up; this build ships the sanctioned
  lightweight engine + a self-contained 3D renderer so it runs anywhere and deploys in minutes.

## 🚀 Run it locally

### Quick start (Windows)
```powershell
cd greenwave
./scripts/dev.ps1     # opens two windows: API :8000 and web :5173
```

### Manual
**Backend** (Python 3.11+):
```bash
cd apps/api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000      # http://localhost:8000/health
```
**Frontend** (Node 18+):
```bash
cd apps/web
cp .env.example .env        # default points at localhost:8000
npm install
npm run dev                 # http://localhost:5173
```
Open http://localhost:5173 and click **▶ Run the city**.

### Backend via Docker
```bash
cd greenwave/infra
docker compose up --build   # API on http://localhost:8000
```

## ☁️ Deploy
- **Frontend → Vercel:** import the repo, set **Root Directory** to `apps/web`, framework
  *Vite*, env var `VITE_API_URL` = your deployed API URL. Build `npm run build`, output `dist`.
- **Backend → Render / Fly.io / Railway:** deploy `apps/api` with its `Dockerfile`
  (or `uvicorn main:app --host 0.0.0.0 --port $PORT`). Put its public URL in `VITE_API_URL`.
- CORS is open for the demo; lock `allow_origins` in `apps/api/main.py` to your Vercel domain.

## 📂 Structure
```
greenwave/
├─ apps/
│  ├─ api/          # FastAPI + simulation engine
│  │  ├─ sim/       # network, controllers (fixed + max-pressure), simulation
│  │  ├─ manager.py # two-twin async runner + demand + disruptions
│  │  └─ main.py    # REST + WebSocket
│  └─ web/          # React + Vite frontend
│     └─ src/scene/ # React Three Fiber 3D city (roads, buildings, signals, vehicles)
├─ docs/            # concept, PRD, TRD, roadmap
├─ infra/           # docker-compose
└─ scripts/         # dev.ps1 launcher
```

## 🧪 API
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | liveness |
| GET | `/api/network` | grid network for the basemap |
| GET | `/api/state` | one-shot snapshot |
| POST | `/api/action` | `{type: play\|pause\|reset\|speed\|demand\|accident\|closure\|surge\|emergency, value?}` |
| WS | `/ws` | live snapshot stream (both twins + savings) |

## 🏆 Judging-criteria fit
- **Innovation:** closed-loop control + live counterfactual + emergency corridor (not a dashboard).
- **Technical execution:** real-time sim engine, Max-Pressure control, async WebSocket pipeline.
- **Usability:** zero-config, one-click demo, everything interactive.
- **Impact:** quantified minutes / CO₂ / response-time saved.
- **Theme:** smart, sustainable, civic infrastructure for the future city.

## 🛣️ Roadmap to "groundbreaking" (stretch)
Swap the engine for **SUMO** on a real OSM district · add a **Deep-RL** controller option ·
a **Claude planning copilot** ("add a bus lane on Main St") · **live open-data** demand seeding ·
Redis pub/sub + multi-district workers for city-scale. See [docs/03-TRD.md](docs/03-TRD.md) &
[docs/04-ROADMAP.md](docs/04-ROADMAP.md).

---
*Built for FutureHacks 2026. The "FutureCity AI" example in the brief is intentionally not
reused — GreenWave is original work.*
