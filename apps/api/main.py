"""GreenWave API — FastAPI app exposing the network, live frame stream, and controls."""
from __future__ import annotations

import json
import os
import time

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from manager import SimManager

load_dotenv()

app = FastAPI(title="GreenWave API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo; lock to the Vercel domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = SimManager()

# ── Groq config ──────────────────────────────────────────────────────────────
_GROQ_URL   = "https://api.groq.com/openai/v1/chat/completions"
_GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
_GROQ_KEY   = os.getenv("GROQ_API_KEY", "")

# Server-side cache: don't hit Grok more than once every 12 seconds
_insights_cache: dict = {}
_insights_at: float   = 0.0


@app.on_event("startup")
async def _startup() -> None:
    manager.start()


@app.get("/health")
async def health() -> dict:
    return {"status": "ok", "tick": manager.tick}


@app.get("/api/network")
async def network() -> dict:
    return manager.net.to_geojson_like()


@app.get("/api/state")
async def state() -> dict:
    return manager.snapshot()


# ── AI Infrastructure Insights (Groq) ────────────────────────────────────────

def _build_prompt(snap: dict) -> str:
    fk = snap["twins"]["fixed"]["kpis"]
    ak = snap["twins"]["ai"]["kpis"]
    sv = snap["savings"]

    clock = snap.get("simClock", 420)
    city_time = f"{int(clock // 60):02d}:{int(clock % 60):02d}"
    weather   = snap.get("weather", "clear")
    blocked   = len(snap.get("blocked", []))
    demand    = snap.get("demand", 1.0)
    auto_dn   = snap.get("dayNightAuto", False)

    emg_fixed = fk.get("emergencyResponseS")
    emg_ai    = ak.get("emergencyResponseS")
    emg_line  = (
        f"Last ambulance — Fixed: {emg_fixed}s / {fk.get('emergencyStops')} stops | "
        f"AI: {emg_ai}s / {ak.get('emergencyStops')} stops"
        if emg_fixed or emg_ai
        else "No emergency dispatched yet"
    )

    return f"""You are GreenWave AI, an expert urban traffic-infrastructure analyst.
Analyse the live simulation data below and produce 4 specific, quantitative,
actionable recommendations that a city planner could implement. Reference actual
numbers from the data. Return ONLY valid JSON — no markdown, no prose outside it.

=== SIMULATION SNAPSHOT ===
Network : 6×8 grid · 48 intersections · 120 m block spacing · bidirectional roads
Elapsed : {snap['simTime']:.0f} s sim-time | City clock: {city_time} | Weather: {weather}
Demand  : {demand:.1f}× baseline | Day/night auto-curve: {auto_dn}
Blocked edges (disruptions): {blocked}

FIXED TIMING (status-quo baseline — 22 s fixed cycles):
  Trips completed  : {fk['completed']}   Active: {fk['active']}
  Avg trip time    : {fk['avgTravelTimeS']} s
  Total wait time  : {fk['totalWaitS']:.0f} s
  Throughput       : {fk['throughputPerMin']} trips/min
  Mean queue       : {fk['meanQueue']} veh/edge
  CO₂ emitted      : {fk['co2Kg']} kg   Fuel: {fk['fuelL']} L

MAX-PRESSURE AI (GreenWave — adaptive, queue-responsive):
  Trips completed  : {ak['completed']}   Active: {ak['active']}
  Avg trip time    : {ak['avgTravelTimeS']} s
  Total wait time  : {ak['totalWaitS']:.0f} s
  Throughput       : {ak['throughputPerMin']} trips/min
  Mean queue       : {ak['meanQueue']} veh/edge
  CO₂ emitted      : {ak['co2Kg']} kg   Fuel: {ak['fuelL']} L

SAVINGS (AI vs fixed):
  Travel time : {sv['travelTimePct']}% faster
  Wait time   : {sv['waitPct']}% less idle
  CO₂         : {sv['co2Pct']}% reduction · {sv['co2KgSaved']} kg saved
  Queue       : {sv['queuePct']}% shorter

EMERGENCY RESPONSE:
  {emg_line}

=== TASK ===
Return exactly this JSON (4 recommendations, each icon is a single emoji):
{{
  "summary": "One sentence overall assessment of city performance and biggest opportunity.",
  "recommendations": [
    {{
      "icon": "🚦",
      "title": "Short action title (5–8 words)",
      "detail": "Specific finding with numbers and clear reasoning. Two to three sentences.",
      "impact": "Estimated improvement e.g. ~18% queue reduction"
    }}
  ]
}}"""


@app.get("/api/insights")
async def insights() -> dict:
    global _insights_cache, _insights_at

    if not _GROQ_KEY:
        return {"ok": False, "error": "GROQ_API_KEY not set on the server."}

    now = time.monotonic()
    if _insights_cache and (now - _insights_at) < 12:
        return {"ok": True, "cached": True, **_insights_cache}

    snap   = manager.snapshot()
    prompt = _build_prompt(snap)

    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            resp = await client.post(
                _GROQ_URL,
                headers={
                    "Authorization": f"Bearer {_GROQ_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": _GROQ_MODEL,
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are GreenWave AI, an expert urban traffic analyst. "
                                "Always return valid JSON only — never wrap in markdown."
                            ),
                        },
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": 700,
                    "temperature": 0.35,
                },
            )
        resp.raise_for_status()

        raw = resp.json()["choices"][0]["message"]["content"].strip()

        # Strip accidental ```json ... ``` wrapping
        if raw.startswith("```"):
            parts = raw.split("```")
            raw = parts[1].lstrip("json").strip() if len(parts) > 1 else raw

        parsed = json.loads(raw)
        _insights_cache = parsed
        _insights_at    = now
        return {"ok": True, "cached": False, **parsed}

    except json.JSONDecodeError as exc:
        return {"ok": False, "error": f"Groq returned non-JSON: {exc}"}
    except httpx.HTTPStatusError as exc:
        return {"ok": False, "error": f"Groq API error {exc.response.status_code}: {exc.response.text[:200]}"}
    except Exception as exc:
        return {"ok": False, "error": str(exc)}


# ── Actions ───────────────────────────────────────────────────────────────────

class Action(BaseModel):
    type: str
    value: float | None = None
    node: int | None = None


@app.post("/api/action")
async def action(a: Action) -> dict:
    t = a.type
    if t == "play":
        manager.play()
    elif t == "pause":
        manager.pause()
    elif t == "reset":
        manager.reset()
    elif t == "speed":
        manager.set_speed(int(a.value or 1))
    elif t == "demand":
        manager.set_demand(a.value if a.value is not None else 1.0)
    elif t == "accident":
        return {"ok": True, "accident": manager.accident(a.node)}
    elif t == "closure":
        return {"ok": True, "closure": manager.closure()}
    elif t == "surge":
        manager.surge()
    elif t == "emergency":
        return {"ok": True, "emergency": manager.emergency()}
    elif t == "weather":
        modes = ["clear", "rain", "heavy"]
        manager.set_weather(modes[max(0, min(2, int(a.value or 0)))])
    elif t == "day_night":
        manager.toggle_day_night()
    elif t == "motorcade":
        return {"ok": True, "motorcade": manager.motorcade()}
    elif t == "signal_failure":
        return {"ok": True, "signal_failure": manager.signal_failure()}
    elif t == "protest":
        return {"ok": True, "protest": manager.protest()}
    elif t == "stadium":
        return {"ok": True, "stadium": manager.stadium()}
    else:
        return {"ok": False, "error": f"unknown action: {t}"}
    return {"ok": True}


# ── WebSocket ─────────────────────────────────────────────────────────────────

@app.websocket("/ws")
async def ws(websocket: WebSocket) -> None:
    await websocket.accept()
    q = manager.subscribe()
    try:
        await websocket.send_json(manager.snapshot())
        while True:
            data = await q.get()
            await websocket.send_json(data)
    except WebSocketDisconnect:
        pass
    except Exception:
        pass
    finally:
        manager.unsubscribe(q)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
