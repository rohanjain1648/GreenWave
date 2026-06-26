# 01 — Concept & Ideation

## The theme, decoded
FutureHacks asks for *"a future city — smart infrastructure, sustainable systems, civic tools,
technology that improves how people live, work, and connect in urban spaces."*

The Advanced brief rewards: **AI/ML integration, complex backends, large-scale data processing,
external API integration, scalable architecture, and innovation tied to the theme** — but it
explicitly states the best projects are *"ambitious while still remaining functional, polished,
and clearly connected to the theme."*

> **Key insight:** Ambition that you can't *demo working* loses to a smaller idea that visibly
> works. The example "FutureCity AI" in the PDF tries to do traffic + energy + weather + safety +
> transit at once — that's 6 half-built fake dashboards. We pick **one** system and make it
> genuinely, impressively *alive*.

---

## 🏆 The flagship: **GreenWave**
**A real-time, AI-driven digital twin where a city district's traffic signals, vehicle flow, and
emergency response optimize themselves live.**

### The problem (real, relatable, big)
- Most traffic signals run on **fixed timers set decades ago**. They don't react to actual demand.
- Congestion costs the average commuter **~50+ hours/year** and pumps out avoidable CO₂ from idling.
- Emergency vehicles lose critical minutes stuck at red lights; every minute matters for survival.
- City planners can't safely "experiment" on a live city — they have no risk-free sandbox.

### The solution
GreenWave imports a **real road network** (OpenStreetMap) and runs a **live traffic simulation**
of it. On top of the sim sits an **AI signal controller** that:
1. **Re-times every intersection in real time** based on actual queue pressure (not a fixed timer).
2. **Reroutes traffic** around disruptions the instant they appear.
3. **Carves an emergency green-corridor** — auto-detects an ambulance/fire truck and pre-empts the
   signals along its route so it never stops.
4. **Proves its value live** — an always-on A/B comparison of *Today's Fixed Timing* vs *GreenWave
   AI*, showing real-time deltas in average commute time, throughput, fuel, CO₂, and emergency
   response time.

### The "wow" demo moment (this is what wins)
The judge isn't shown a video of charts. They **interact**:
- Drag an **accident** onto an intersection → watch GreenWave re-route the district while the
  fixed-timing twin gridlocks beside it.
- Drop a **flood zone** over a few blocks → roads close, AI adapts, KPIs update.
- Launch an **ambulance** → watch a green wave of lights open ahead of it across the city.
- A live counter ticks up: *"GreenWave has saved 14.2 minutes and 3.1 kg CO₂ in this session."*

### Why this beats the example
| | "FutureCity AI" (the example) | **GreenWave** |
|---|---|---|
| Core verb | *Predicts* | **Acts / controls** (closed loop) |
| Scope | 6 systems, all shallow | 1 system, deep & real |
| Demo | Static dashboards | Live, interactive, judge-driven |
| "AI" | Vague ML claims | A real, citable control algorithm + optional RL |
| Proof of impact | Asserted | **Measured live** (A/B counterfactual) |
| Buildable in a hackathon | Barely | Yes, with a clear MVP |

### Theme fit (airtight)
Smart infrastructure ✅ · sustainability (emissions ↓) ✅ · civic tool (planner sandbox) ✅ ·
improves how people live/move ✅ · uses real urban data ✅.

### Advanced-rubric fit
AI/ML ✅ · complex backend (real-time sim engine + pub/sub) ✅ · large-scale data (thousands of
agents/sec) ✅ · external APIs (OSM, optional live traffic, optional Claude) ✅ · scalable
architecture (stateless API + worker sims + Redis) ✅.

---

## 🔁 Backup / alternative ideas (if you want to pivot)
All three keep the same "focused + real-time + measurable + interactive demo" philosophy.

### Alt 1 — **AirWeave**: real-time citizen air-quality & clean-route engine
Crowd + sensor (or open-data) air-quality map that computes the **cleanest walking/cycling route**
between two points, not the fastest — and shows lungs-worth of pollution avoided. Real-time,
sustainability-forward, very visual, simpler backend than GreenWave. *Good if SUMO feels heavy.*

### Alt 2 — **GridBalance**: a community microgrid energy game/twin
Simulate a neighborhood's solar + batteries + EV charging and let an AI balance supply/demand to
cut peak load and cost, with a live "blackout vs. balanced" comparison. Strong sustainability
angle; sim is lighter (no map rendering). *Good if you prefer energy over mobility.*

### Alt 3 — **Pulse**: a real-time civic-reporting nervous system
Citizens report issues (pothole, outage, hazard); an AI triages, clusters duplicates, predicts
severity, and routes to the right department with live SLA tracking. Heaviest on LLM/AI, lightest
on simulation. *Good if you want an LLM-centric build.*

> **Recommendation:** Build **GreenWave**. It has the single best "wow" moment, the cleanest theme
> story, and the strongest Advanced-rubric coverage — and the TRD gives you a fallback engine so
> the ambition stays buildable. If your team has zero Python/sim appetite, fall back to **Alt 1
> (AirWeave)**, which reuses ~70% of the same frontend architecture.

➡️ Full product spec in [02-PRD.md](02-PRD.md) · technical design in [03-TRD.md](03-TRD.md).
