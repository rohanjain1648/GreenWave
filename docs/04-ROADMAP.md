# 04 — Roadmap & Build Plan

Two timelines below — pick the one matching the event format. Both protect the **MVP (U1–U5)**
first and treat everything else as bonus. Dates are relative; drop in the real FutureHacks dates
(today is 2026-06-26).

---

## A) Two-week async build (recommended if the hackathon runs over weeks)

### Phase 0 — Setup (Day 0, before the clock matters)
- [ ] Repo scaffold (monorepo per TRD §9), CI lint, `.env.example`.
- [ ] **Docker container** that boots and runs a trivial SUMO step — *prove deploy works on Day 0.*
- [ ] Deploy a "hello world" frontend to Vercel + API to Fly.io/Render. (Deploy early, deploy often.)
- [ ] Pick & import the demo district (OSM → SUMO `.net.xml` + GeoJSON export).

### Phase 1 — Spine (Days 1–3) → *Milestone M1: vehicles move on screen*
- [ ] SUMO driver: step the sim, read vehicle positions/queues.
- [ ] FastAPI WebSocket streaming `Frame`s (MessagePack, ~10 Hz).
- [ ] Frontend: deck.gl renders roads + moving vehicles from the live stream.
- [ ] Play/pause/speed/reset controls.
- [ ] **Go/No-go on SUMO** — if not streaming, switch to custom sim now.

### Phase 2 — The AI + the proof (Days 4–7) → *M2: AI beats Fixed, measurably*
- [ ] Max-Pressure controller wired into signals.
- [ ] Fixed vs AI mode toggle (+ A/B counterfactual: parallel twins or seeded snapshot).
- [ ] KPI engine: travel time, wait, throughput, queue, CO₂/fuel.
- [ ] Live KPI dashboard with Fixed-vs-AI deltas + sparklines.
- [ ] Tune the default scenario so AI shows a **clear** win (target ≥15% travel-time drop).

### Phase 3 — The "wow" (Days 8–10) → *M3: interactive disruptions*
- [ ] Inject accident (block edge/lane) — both twins react.
- [ ] Road closure / flood zone (remove edges).
- [ ] Demand surge slider (rush hour).
- [ ] **Emergency vehicle + green-corridor** (A* route + signal pre-emption) → response-time KPI.
- [ ] "Saved this session" cumulative impact counter.

### Phase 4 — Polish & ship (Days 11–14) → *M4: submission-ready*
- [ ] Control-room visual pass (dark theme, neon-green accents, empty/loading states, mobile-responsive).
- [ ] Onboarding: one-click "Run the city", inline hints, plain-English impact summary line.
- [ ] Harden: deterministic seed, error handling, `/health`, reconnect logic, perf pass (frame size, LOD).
- [ ] **Record the 2–3 min video** (script below). Write the README + architecture diagram.
- [ ] Final deploy; smoke-test the public URL on a clean machine; submit.

**Stretch (only if M1–M4 done):** Deep-RL controller · Claude planning copilot · save/share scenario URL · live open-data demand.

---

## B) 48-hour sprint variant (if it's a single weekend)
> Be ruthless. The custom sim may be the *safer primary* here — SUMO setup can burn the first night.

| Hour | Focus |
|---|---|
| 0–2 | Repo + Vercel/Render hello-world deploy + pick tiny network |
| 2–8 | Sim (SUMO *or* custom) streaming vehicles over WS → render on map |
| 8–12 | Play/pause + KPIs computed and displayed |
| 12–18 | Max-Pressure controller + Fixed/AI toggle showing a delta *(sleep!)* |
| 18–26 | Accident injection + demand slider; tune the convincing scenario |
| 26–32 | Emergency green-corridor (the signature wow) |
| 32–40 | Polish: theme, one-click demo, impact counter, fix the worst bugs |
| 40–46 | Record video + README + final deploy + clean-machine smoke test |
| 46–48 | Buffer for the thing that breaks. Submit early. |

**48h cut order (drop from the bottom if behind):** live open-data → RL → copilot → flood zone →
parallel twins (use seeded snapshot instead) → emergency corridor *(keep this if at all possible —
it's the highlight)*.

---

## 🎬 The 2–3 minute video script (judges watch this first)
1. **0:00–0:20 — Hook + problem.** "Your city's traffic lights were timed before you were born."
   Show gridlock, an ambulance stuck. State the cost (hours lost, CO₂, response times).
2. **0:20–0:40 — What GreenWave is.** One line: the AI brain that runs the lights, live digital twin.
3. **0:40–1:40 — Live demo (the meat).** Run the city → AI vs Fixed delta appears → inject an
   accident, AI recovers while Fixed gridlocks → **send an ambulance, green corridor opens** →
   point at the falling numbers. Narrate the KPIs as they move.
4. **1:40–2:10 — How it works.** 15 seconds on the real tech: SUMO engine, Max-Pressure control,
   real-time WebSocket pipeline, scalable architecture (one worker per district).
5. **2:10–2:40 — Impact + theme + close.** "X minutes and Y kg CO₂ saved in one session, in one
   district. Now imagine the whole city." Tie to the future-city theme. Show the deployed URL + repo.
> Tips: screen-record the *real deployed app*, not slides. Use a deterministic seed so the demo
> behaves. Keep a backup clip of a perfect run in case of live jitter.

---

## ✅ Submission checklist (from the FutureHacks rules)
- [ ] **Video** 2–3 min, public on YouTube/Vimeo/Drive, link works in incognito.
- [ ] **Public GitHub repo** — code, README (setup + demo script + architecture), `.env.example`, license.
- [ ] **Working deployment link** — loads and runs the demo with zero local setup, tested on a clean browser.
- [ ] README maps features → judging criteria (copy the table from [02-PRD.md](02-PRD.md) §9).
- [ ] Theme statement front-and-center: *smart, sustainable, civic infrastructure for the future city.*
- [ ] Credit the example PDF as inspiration-only; note GreenWave is original.

---

## 📉 Scope ladder (if you must shrink to Intermediate/Beginner)
- **Intermediate:** drop SUMO → custom sim; one controller; accident + KPIs only; skip emergency
  corridor, RL, copilot. Still real-time and interactive.
- **Beginner:** a single-intersection visual sim, "Fixed vs Smart" toggle, simple count-based timer
  as the "AI", and a couple of KPIs. Same story, tiny scope — still demos the core idea.

➡️ Back to the [README](README.md) · idea rationale in [01-CONCEPT.md](01-CONCEPT.md).
