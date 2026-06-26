# 02 — Product Requirements Document (PRD)

**Product:** GreenWave — a real-time AI digital twin for self-optimizing urban mobility
**Author:** FutureHacks 2026 team · **Division:** Advanced · **Status:** Draft v1
**Theme:** The Future City

---

## 1. Vision
> Today's cities react to traffic with timers set decades ago. GreenWave is the **brain** the
> future city runs on: a live digital twin where AI continuously re-times signals, reroutes flow,
> and clears the way for emergencies — proving, minute by minute, the time, fuel, and lives it
> saves. **We don't predict the future city. We run it.**

## 2. Problem statement
1. **Static infrastructure.** Fixed-time signals ignore real demand → avoidable congestion.
2. **Emergency delay.** Vehicles can't clear a reliable path for ambulances/fire trucks.
3. **No safe sandbox.** Planners can't test "what if we close this road / add a bus lane?" live.
4. **Invisible impact.** Cities can't *show* citizens the cost of bad timing or the win from good.

## 3. Goals & non-goals
### Goals (what success looks like)
- G1 — A live, interactive map of a **real district** with vehicles moving in real time.
- G2 — A toggle/side-by-side between **Fixed-timing** and **GreenWave AI** with live KPI deltas.
- G3 — Judge-driven **disruptions** (accident, road closure/flood, demand surge) handled live.
- G4 — **Emergency green-corridor**: inject an emergency vehicle, signals pre-empt along its route.
- G5 — A clear, quantified **impact readout** (commute time, throughput, fuel, CO₂, response time).
- G6 — Deployed, public URL that loads and runs the demo without a local setup.

### Non-goals (explicitly out of scope — say this in the video to look disciplined)
- ❌ City-wide / multi-city scale (we demo **one district**, designed to scale).
- ❌ Real live traffic-camera feeds (we use OSM network + realistic synthetic/seeded demand;
  live-data ingestion is an architected stretch goal, not MVP).
- ❌ Predicting accidents (we *respond* to them — closed-loop, not forecasting).
- ❌ Mobile-native app (responsive web is enough for judging).

## 4. Target users & personas
| Persona | Need | How GreenWave helps |
|---|---|---|
| **Hackathon judge** (primary) | "Show me something real, fast" | Interactive live demo, instant measurable impact |
| **Traffic engineer** | Optimize signals without risk | Risk-free digital-twin sandbox + adaptive controller |
| **Emergency dispatcher** | Faster response times | Auto green-corridor for emergency vehicles |
| **City planner / official** | Justify infrastructure spend | Quantified before/after impact, scenario testing |
| **Citizen** | Less time stuck, cleaner air | The downstream beneficiary; framed in the pitch |

## 5. User stories (MoSCoW prioritized)
**Must have (MVP — this is the demo):**
- U1 As a user, I see a real district map with vehicles moving in real time. *(Must)*
- U2 As a user, I toggle "Fixed" vs "GreenWave AI" and see live KPI differences. *(Must)*
- U3 As a user, I inject an **accident** and watch the AI adapt the surrounding signals/routes. *(Must)*
- U4 As a user, I see a live dashboard: avg travel time, throughput, total wait, CO₂/fuel. *(Must)*
- U5 As a user, I can start/pause/reset the simulation and change its speed. *(Must)*

**Should have:**
- U6 As a user, I launch an **emergency vehicle** and see a green-corridor open. *(Should)*
- U7 As a user, I draw a **road closure / flood zone** to remove roads live. *(Should)*
- U8 As a user, I increase **demand** (rush hour) with a slider and watch both modes cope. *(Should)*
- U9 As a user, I see a cumulative "impact saved this session" counter. *(Should)*

**Could have (stretch — strong bonus, only if MVP is solid):**
- U10 A **Deep-RL signal agent** option alongside Max-Pressure. *(Could)*
- U11 A **Claude planning copilot**: type "add a bus lane on Main St" → it configures a scenario. *(Could)*
- U12 **Save/share a scenario** via URL. *(Could)*
- U13 **Live open-data demand** seeding from a public traffic API. *(Could)*

**Won't have (this hackathon):** multi-city, accounts/auth beyond a share link, native mobile.

## 6. Feature spec (MVP detail)
### 6.1 Live digital-twin map
- Renders an OSM road network for a chosen district; vehicles as moving points (deck.gl).
- Signals shown as colored nodes (red/amber/green) updating in real time.
- Smooth ~10–30 fps client rendering; sim runs ≥ real-time on the server.

### 6.2 Controller modes
- **Fixed-time** (baseline = status quo): standard cyclic phases.
- **GreenWave AI** (Max-Pressure): each intersection picks the phase maximizing throughput from
  current queues. Decentralized, no training, provably stabilizing — credible and explainable.
- Mode is switchable live; ideally **two synchronized twins side by side** for the A/B punch.

### 6.3 Disruption / scenario controls
- Accident (block a lane/edge for N seconds), road closure / flood (remove edges),
  demand surge (multiply spawn rate), emergency vehicle (priority agent + corridor).

### 6.4 Impact dashboard
- Live metrics: **average travel time, total/avg wait time, vehicles completed (throughput),
  mean queue length, CO₂ & fuel (SUMO emission model), emergency response time.**
- Each shown as **Fixed vs AI** with a **% improvement** delta and a small live sparkline.
- A headline **"Saved this session: X minutes · Y kg CO₂"** counter.

## 7. UX & key flows
1. **Landing → "Run the city".** One click loads the district and starts the sim (no setup).
2. **Observe.** Vehicles flow; KPIs populate; AI vs Fixed delta is visible within ~10 s.
3. **Disrupt.** User clicks "Inject accident" → picks a spot → both twins react; AI recovers faster.
4. **Rescue.** User clicks "Send ambulance" → route draws → green corridor opens → response-time KPI drops.
5. **Reflect.** Impact counter + a one-line plain-English summary ("AI cut average commute 23%").

**UX principles:** zero-config demo, one obvious primary action at each step, every claim backed by
a number on screen, looks polished (dark "control-room" theme, neon green accents = "GreenWave").

## 8. Success metrics
**For judging (what we optimize for):**
- Demo runs end-to-end on the deployed URL with no crash. ✅/❌
- AI mode shows a **clear, positive** KPI delta vs Fixed in the default scenario (target: ≥15%
  lower average travel time at moderate-high demand).
- Emergency corridor visibly reduces the emergency vehicle's stops to ~0.
- Judge can trigger ≥3 disruption types and see live reaction.

**Product KPIs (the story):** avg travel time ↓, throughput ↑, CO₂/fuel ↓, emergency response ↓.

## 9. Judging-rubric mapping (use this in the video!)
| Criterion | How GreenWave scores |
|---|---|
| **Creativity / innovation** | Closed-loop control + live counterfactual + emergency corridor — not another dashboard |
| **Technical execution** | Real traffic engine (SUMO), real control algorithm, real-time WebSocket pipeline, scalable architecture |
| **Usability** | Zero-config, one-click demo; everything interactive and self-explanatory |
| **Presentation / polish** | Control-room UI, live numbers, narratable "wow" moments |
| **Impact** | Quantified time, fuel, CO₂, and emergency-response savings — relatable and measurable |
| **Theme fit** | Smart, sustainable, civic infrastructure for the future city — dead center |

## 10. Risks & mitigations
| Risk | Likelihood | Mitigation |
|---|---|---|
| SUMO setup eats too much time | Med | TRD ships a **lightweight custom sim fallback**; containerize early (Day 1) |
| Real-time rendering janky | Med | Downsample + delta-encode + MessagePack frames; cap vehicle count; viewport culling |
| AI delta is small/unconvincing | Med | Tune demand & network so the gap is dramatic; pick a congested default scenario |
| Backend can't deploy (SUMO needs Linux) | Med | Docker container on Fly.io/Render from Day 1, not the last night |
| Scope creep (RL, copilot, live data) | High | They're **Could-have** only; MVP (U1–U5) is sacred and frozen first |
| Demo crashes live | Low-Med | Pre-recorded fallback clip in the video; deterministic seeded scenario |

## 11. Open questions
- Which real district? (Pick a small, grid-like, recognizable one — good visual + manageable size.)
- 2-week async build or 48-hour sprint? (Roadmap covers both — confirm event format.)
- Team size & skills? (Need ≥1 Python-comfortable person for the sim/backend.)

➡️ Technical design: [03-TRD.md](03-TRD.md) · Build plan: [04-ROADMAP.md](04-ROADMAP.md)
