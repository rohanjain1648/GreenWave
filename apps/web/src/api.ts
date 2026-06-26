import type { NetworkT, Snapshot } from "./types";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

function wsUrl(): string {
  const u = new URL(API);
  u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
  u.pathname = "/ws";
  return u.toString();
}

export async function fetchNetwork(): Promise<NetworkT> {
  const r = await fetch(`${API}/api/network`);
  if (!r.ok) throw new Error("failed to load network");
  return r.json();
}

export type ActionType =
  | "play"
  | "pause"
  | "reset"
  | "speed"
  | "demand"
  | "accident"
  | "closure"
  | "surge"
  | "emergency"
  | "weather"
  | "day_night"
  | "motorcade"
  | "signal_failure"
  | "protest"
  | "stadium";

export async function sendAction(
  type: ActionType,
  value?: number,
): Promise<void> {
  await fetch(`${API}/api/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, value }),
  });
}

/** Connects to the live frame stream with auto-reconnect. */
export function connectStream(
  onFrame: (s: Snapshot) => void,
  onStatus: (connected: boolean) => void,
): () => void {
  let ws: WebSocket | null = null;
  let closed = false;
  let retry: ReturnType<typeof setTimeout> | null = null;

  const open = () => {
    ws = new WebSocket(wsUrl());
    ws.onopen = () => onStatus(true);
    ws.onmessage = (e) => {
      try {
        onFrame(JSON.parse(e.data) as Snapshot);
      } catch {
        /* ignore malformed frame */
      }
    };
    ws.onclose = () => {
      onStatus(false);
      if (!closed) retry = setTimeout(open, 1200);
    };
    ws.onerror = () => ws?.close();
  };
  open();

  return () => {
    closed = true;
    if (retry) clearTimeout(retry);
    ws?.close();
  };
}
