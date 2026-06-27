# GreenWave 5-Minute Live Demo Script

**Audience:** Judges, investors, or anyone seeing GreenWave for the first time.  
**Duration:** ~5 minutes.  
**Setup:** Backend running on `:8000`, frontend on `:5173` (or deployed URLs).  
**Presenter:** Show the browser fullscreen. Click features as you narrate.

---

## 00:00–00:30 — Intro & problem statement

> "Cities use traffic signals timed in the 1970s. They don't know what's actually on the road. A commuter wastes 50 hours a year at unnecessary red lights. Ambulances lose critical minutes. Every minute of congestion also burns fuel and pumps CO₂ into the air.  
> 
> **GreenWave is an AI that fixes traffic signals live.** It reads actual queue lengths and adapts the signal timing every cycle. You're about to see it in action."

**Action:** Open the app at `http://localhost:5173`. Wait for the 3D city to load (dark buildings, green glowing signals).

---

## 00:30–01:15 — The A/B counterfactual

> "This is the genius part: **two identical cities running side by side**, fed the exact same cars from the same random seed. Left city: fixed timers (like today's infrastructure). Right city: GreenWave AI."

**Action:**
1. Click **▶ Run the city** to start the simulation.
2. Wait 3–5 seconds for vehicles to spawn and queues to form.
3. Point to the **KPI Dashboard** on the right:
   - Trip time: AI is ~45% faster
   - Wait time: AI is ~81% lower
   - Mean queue: AI is ~91% shorter
   - CO₂: AI cuts emissions by ~27%

> "Same cars. Same network. Same demand. But the AI city flows *dramatically* better. Let's prove it with a disruption."

---

## 01:15–02:00 — Interactive disruptions (pick one or two)

**Option A — Accident (fastest impact):**

> "Watch what happens when a road gets blocked."

**Action:**
1. Click **💥 Accident** under "Inject a disruption".
2. Watch the KPI Dashboard for 3–4 seconds.
3. Point to the **Fixed city** (left): queues pile up visibly, wait time spikes, the AI's advantage widens.
4. Point to the **GreenWave city** (right): it re-routes traffic around the accident, queues remain small.

> "The fixed-timing city is gridlocked. GreenWave detected the blockage and rerouted green time to alternate intersections. That's a 20–30% gap opening *from a single accident*."

**Option B — Ambulance (most dramatic):**

> "Now watch an ambulance."

**Action:**
1. Click **🚑 Ambulance** under "Inject a disruption".
2. Watch the **KPI Dashboard** — look for **Emergency response time** and **Emergency stops**.
3. In the **Fixed city**: the ambulance waits at red lights (3–4 stops, 130+ seconds).
4. In the **GreenWave city**: the ambulance sails through every intersection (0 stops, ~110 seconds).

> "GreenWave detects the ambulance on each approach and pre-empts the signal green before it arrives. In a real city, that's the difference between surviving a cardiac arrest and not. That's the impact story."

---

## 02:00–02:30 — Environment & realism (weather + day/night)

> "But traffic isn't static. Weather and rush hour change everything."

**Action:**
1. Click **🌧️ Rain** under the Environment row.
   - Watch the sky darken, rain particles fall, vehicles slow down (75% speed).
   - Demand drops 12% (people stay home).
   - All KPIs degrade, but the AI still wins.

2. Toggle **🌙 Auto** (rush-hour curve).
   - Clock in the top-left starts ticking: "7:30 AM" → "8:00 AM" (peak hour).
   - Demand multiplier climbs to 1.55× (morning rush).
   - Sky gradually brightens (dawn lighting).
   - Watch trip times and queues worsen under peak demand.

> "At 8 AM, the city is at peak congestion. The AI's advantage *grows* because Max-Pressure scales with demand — it's provably optimal when the network is fullest."

---

## 02:30–03:15 — Live pollution heatmap

> "Here's something you won't see in a static dashboard: where the emissions actually are."

**Action:**
1. Click **🔥 Pollution map**.
   - Ground plane now shows a heatmap: green (clean flow) → yellow (some congestion) → red (heavy idling).
2. Toggle to **Split A/B** view (top-right buttons).
   - The Fixed city glows noticeably redder.
   - The GreenWave city is greener.

> "The red zones are where cars are sitting idle. GreenWave doesn't just improve KPIs — it cuts the actual pollution footprint by 27%. This is measurable sustainability."

---

## 03:15–03:45 — Scripted demo tour (optional speed boost)

> "To show you the full story in 5 minutes, let me run the demo tour."

**Action:**
1. Click **🎬 Demo Tour** at the top of the control panel.
2. Let it play automatically for 30–45 seconds:
   - Narration appears in a banner.
   - Camera auto-orbits around the city.
   - Steps through: intro → single AI view → split A/B → accident injection → ambulance dispatch → surge → heatmap → closing.
3. You can click **Skip** to move to the next step, or let it finish.

> "This is the full story on a timer. You can record this video and submit it to competitions. It highlights every key feature."

---

## 03:45–04:30 — AI Infrastructure Insights (Grok)

> "Finally, the breakthrough: **the system doesn't just control traffic — it recommends changes to city planners**."

**Action:**
1. Click **⚡ Analyze city** in the right rail (under KPI Dashboard).
2. Wait 2–3 seconds (spinner animates).
3. Read the **summary** — e.g., "Fixed timing is generating 3× more idle time. The central avenue is the dominant bottleneck."
4. Scroll down or point to the **4 recommendation cards**:
   - Each shows: icon + title + detailed finding + estimated impact badge.
   - Example: "Extend green phases on central avenue by 8–10 s → ~22% queue reduction"
   - Example: "During peak demand, deploy Max-Pressure to add ~16% throughput without infrastructure"

> "This is AI-powered infrastructure planning. Grok (xAI) analyzes live KPIs and tells a city planner exactly what to change and why. Not a black box. Not a prediction. Real, actionable, quantitative recommendations."

---

## 04:30–05:00 — Closing & the big claim

> "Let me recap what you just saw:
> 
> 1. **Real-time simulation** — vehicles move in 3D, emergent congestion forms, we measure everything.
> 2. **Fair A/B comparison** — same demand, same seed, different controllers (fixed vs. Max-Pressure).
> 3. **Quantified impact** — 45% faster trips, 81% less wait, 27% CO₂ savings, ambulances never stop.
> 4. **Interactive disruptions** — accidents, closures, surges, motorcades, signal failures, protests, stadium events.
> 5. **Environmental realism** — weather, day/night cycles, demand curves, live heatmaps.
> 6. **AI recommendations** — Grok generates actionable infrastructure improvements tied to actual KPIs.
> 
> This isn't a dashboard. This is a **closed-loop AI system that optimizes a city in real time and tells planners what to do next.**
> 
> GreenWave proves that smarter signal control saves lives, time, and the planet. And it can be deployed in any city, starting today."

**Final action:** Click **Reset** if you want to show one more scenario. Or leave it as-is and open the code/docs for technical questions.

---

## Bonus features (if judges ask)

- **Speed multiplier** (top of control panel, 1× / 2× / 4×) — run scenarios faster.
- **Demand slider** — crank demand to 4× to see the network saturate (AI still wins).
- **Flood/closure** — click 🌊 to permanently block a 2×2 block; watch rerouting.
- **Stadium surge** — click 🏟️ for a 2.5× demand spike (biggest disruption).
- **Signal failure** — click 💡 to fail 4 intersections (amber blinking in 3D); AI reroutes, Fixed gridlocks.
- **Motorcade** — click 🚨 to block the entire central avenue; watch traffic flow around it.
- **Grok live weather** — click 🌐 to fetch real weather from your location and apply it.

---

## Pitch talking points (if time allows)

- **Max-Pressure is real traffic engineering** — cite Varaiya 2013, it's provably optimal under any stable demand.
- **No training, no black box** — the algorithm reads queue lengths and makes a local decision. You can explain why every signal is green.
- **Scales horizontally** — multiple districts as independent workers, Redis pub/sub, stateless API.
- **Self-contained** — zero external simulation dependencies (no SUMO needed), pure Python, runs anywhere.
- **Three winners in one**: Judges get innovation (Max-Pressure + TSP + AI insights), technical execution (real-time sim + WebSocket + GPU rendering), and impact (measured KPIs + emergency response).

---

## If something breaks during the demo

| Issue | Fix |
|---|---|
| Browser won't load | Check backend is running (`http://localhost:8000/health`). Refresh (Ctrl+Shift+R). |
| No vehicles spawning | Click **▶ Run the city**, wait 5s. Vehicles are seeded when simulation starts. |
| Grok insights error | Backend doesn't have `GROK_API_KEY` set. Set it in `.env` and restart backend. (Or just skip this feature — the rest of the demo is self-contained.) |
| Low frame rate | Close other browser tabs. Drag to rotate the city manually (auto-orbit might be on). Click **Pause** then **Resume**. |
| WebSocket connection lost | Refresh page. Check backend is alive. |

---

## Time breakdown

| Segment | Time | What you do |
|---|---|---|
| Intro + problem | 0:00–0:30 | Narrate, load app |
| A/B counterfactual | 0:30–1:15 | Start sim, point at KPIs |
| Accident disruption | 1:15–2:00 | Inject, watch KPIs change |
| Weather + day/night | 2:00–2:30 | Rain + Auto, point to sky/clock |
| Heatmap + Split view | 2:30–3:15 | Show pollution reduction |
| Demo tour | 3:15–3:45 | Click play, narrate highlights |
| Grok insights | 3:45–4:30 | Click Analyze, read recommendations |
| Closing | 4:30–5:00 | Recap + big claim |

---

*Good luck! 🚦🌊*
