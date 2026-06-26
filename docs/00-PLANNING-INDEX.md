# GreenWave 🌊🚦

> **A real-time, AI-driven digital twin that lets a city's traffic, signals, and emergency response optimize themselves — live.**

**FutureHacks 2026 — Advanced Division** · Theme: *The Future City*

GreenWave is a living simulation of a real city district. Instead of *predicting* traffic
(like most "smart city" demos), GreenWave **acts on it**: an AI signal controller continuously
re-times every intersection, reroutes vehicles around disruptions, and pre-empts signals to
clear a corridor for emergency vehicles — all in real time, with a live readout of the minutes,
fuel, CO₂, and response time it saves versus today's fixed-timing infrastructure.

The "wow" moment: a judge drags an **accident**, a **flood zone**, or an **ambulance** onto the
map and watches the entire district re-optimize itself in seconds.

---

## 📁 What's in this folder

| File | What it is | Read it if you want… |
|------|-----------|----------------------|
| [01-CONCEPT.md](01-CONCEPT.md) | The idea, why it wins, and 3 backup ideas | the pitch + alternatives |
| [02-PRD.md](02-PRD.md) | Product Requirements — what we're building & for whom | features, user stories, judging-rubric mapping |
| [03-TRD.md](03-TRD.md) | Technical Requirements — how it's built | architecture, stack, APIs, data, performance |
| [04-ROADMAP.md](04-ROADMAP.md) | Build plan (2-week + 48-hour variants) + submission checklist | timeline, milestones, what to cut |

## ⚡ The 10-second pitch
> "Cities run on traffic signals timed in the 1970s. GreenWave is the brain that should be running
> them — a live digital twin where AI re-times every light, reroutes around accidents, and clears
> a path for ambulances automatically, cutting commute times and emissions. We don't predict the
> future city. We run it."

## 🧱 Stack at a glance
**Frontend:** React + TypeScript + Vite · MapLibre/Mapbox + deck.gl · Tailwind + shadcn/ui · WebSockets
**Backend:** Python · FastAPI · SUMO traffic engine (via TraCI) · Redis pub/sub
**AI:** Max-Pressure adaptive control (baseline "AI") · optional Deep-RL agent · optional Claude planning copilot
**Deploy:** Vercel (web) · Docker container on Fly.io/Render (sim) · Upstash Redis · Neon/Supabase (Postgres)

## ✅ Submission deliverables (from the rules)
- [ ] 2–3 min public demo video (YouTube/Vimeo/Drive)
- [ ] Public GitHub repo with source
- [ ] Working deployment link
- See the checklist at the end of [04-ROADMAP.md](04-ROADMAP.md).

---
*Generated as a planning kit. The example "FutureCity AI" in the provided PDF is intentionally
**not** reused — GreenWave is a fresh, narrower, more demoable take on the same theme.*
