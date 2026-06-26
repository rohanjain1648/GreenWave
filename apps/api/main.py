"""GreenWave API — FastAPI app exposing the network, live frame stream, and controls."""
from __future__ import annotations

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from manager import SimManager

app = FastAPI(title="GreenWave API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo; lock to the Vercel domain in production
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = SimManager()


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


@app.websocket("/ws")
async def ws(websocket: WebSocket) -> None:
    await websocket.accept()
    q = manager.subscribe()
    try:
        # send an immediate snapshot so the client renders instantly
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
