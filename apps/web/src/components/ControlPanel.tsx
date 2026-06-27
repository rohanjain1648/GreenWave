import { useState } from "react";
import { sendAction } from "../api";
import { useStore } from "../store";
import { startDemoTour, stopDemoTour } from "../tour";
import type { WeatherMode } from "../types";

async function fetchLiveWeather(
  setStatus: (s: string | null) => void
) {
  setStatus("fetching…");
  try {
    const r = await fetch("https://wttr.in/?format=j1");
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const d = await r.json();
    const code = parseInt(d.current_condition[0].weatherCode, 10);
    const mode = code <= 116 ? 0 : code < 302 ? 1 : 2;
    const label = mode === 0 ? "clear ☀️" : mode === 1 ? "rain 🌧️" : "heavy ⛈️";
    sendAction("weather", mode);
    setStatus(`Applied: ${label}`);
    setTimeout(() => setStatus(null), 3000);
  } catch (e) {
    setStatus("Failed (CORS or offline)");
    setTimeout(() => setStatus(null), 3000);
  }
}

function clockLabel(simClock: number) {
  const h = Math.floor(simClock / 60) % 24;
  const m = Math.floor(simClock % 60);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

function Btn({
  onClick,
  children,
  variant = "default",
  title,
}: {
  onClick: () => void;
  children: React.ReactNode;
  variant?: "default" | "primary" | "danger" | "warn";
  title?: string;
}) {
  const styles = {
    default: "bg-ink-700 hover:bg-ink-600 text-slate-200 border-ink-600",
    primary: "bg-wave/20 hover:bg-wave/30 text-wave border-wave/50",
    danger: "bg-red-500/15 hover:bg-red-500/25 text-red-300 border-red-500/40",
    warn: "bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40",
  }[variant];
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-lg border px-3 py-2 text-sm font-medium transition active:scale-95 ${styles}`}
    >
      {children}
    </button>
  );
}

const WEATHER_LABELS: Record<WeatherMode, string> = {
  clear: "☀️ Clear",
  rain: "🌧️ Rain",
  heavy: "⛈️ Heavy",
};

export default function ControlPanel() {
  const cur = useStore((s) => s.cur);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const selected = useStore((s) => s.selected);
  const setSelected = useStore((s) => s.setSelected);
  const tourActive = useStore((s) => s.tourActive);
  const showHeatmap = useStore((s) => s.showHeatmap);
  const toggleHeatmap = useStore((s) => s.toggleHeatmap);
  const [speed, setSpeed] = useState(1);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);

  const weather = cur?.weather ?? "clear";
  const simClock = cur?.simClock ?? 420;
  const dayNightAuto = cur?.dayNightAuto ?? false;

  const running = cur?.running ?? false;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-ink-600 bg-ink-900 p-4">
      {/* showcase row */}
      <div className="flex flex-wrap gap-2">
        {tourActive ? (
          <Btn variant="danger" onClick={stopDemoTour}>
            ⏹ Stop tour
          </Btn>
        ) : (
          <Btn variant="primary" onClick={startDemoTour} title="Auto-play the highlight reel">
            🎬 Demo Tour
          </Btn>
        )}
        <button
          onClick={toggleHeatmap}
          title="Toggle the live emissions/congestion heatmap"
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition active:scale-95 ${
            showHeatmap
              ? "border-orange-500/50 bg-orange-500/20 text-orange-300"
              : "border-ink-600 bg-ink-700 text-slate-200 hover:bg-ink-600"
          }`}
        >
          🔥 Pollution map
        </button>
      </div>

      {/* run controls */}
      <div className="flex flex-wrap gap-2">
        {running ? (
          <Btn onClick={() => sendAction("pause")}>⏸ Pause</Btn>
        ) : (
          <Btn variant="primary" onClick={() => sendAction("play")}>
            ▶ Run the city
          </Btn>
        )}
        <Btn onClick={() => sendAction("reset")} title="Reset both twins">
          ↺ Reset
        </Btn>
        <div className="flex items-center gap-1 rounded-lg border border-ink-600 bg-ink-800 px-2">
          <span className="text-xs text-slate-500">speed</span>
          {[1, 2, 4].map((s) => (
            <button
              key={s}
              onClick={() => {
                setSpeed(s);
                sendAction("speed", s);
              }}
              className={`rounded px-2 py-1 text-xs ${
                speed === s ? "bg-wave/25 text-wave" : "text-slate-400"
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* environment */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] uppercase tracking-wider text-slate-500">
            Environment
          </span>
          <span className="text-[11px] text-slate-400">
            🕐 {clockLabel(simClock)}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["clear", "rain", "heavy"] as WeatherMode[]).map((w, i) => (
            <button
              key={w}
              onClick={() => sendAction("weather", i)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition active:scale-95 ${
                weather === w
                  ? "border-sky-400/50 bg-sky-400/20 text-sky-200"
                  : "border-ink-600 bg-ink-700 text-slate-300 hover:bg-ink-600"
              }`}
            >
              {WEATHER_LABELS[w]}
            </button>
          ))}
          <button
            onClick={() => fetchLiveWeather(setLiveStatus)}
            title="Fetch real weather from your location and apply it"
            className="rounded-lg border border-ink-600 bg-ink-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-ink-600 active:scale-95"
          >
            🌐 {liveStatus ?? "Live"}
          </button>
          <button
            onClick={() => sendAction("day_night")}
            title="Toggle auto rush-hour demand curve driven by clock"
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition active:scale-95 ${
              dayNightAuto
                ? "border-yellow-400/50 bg-yellow-400/20 text-yellow-200"
                : "border-ink-600 bg-ink-700 text-slate-300 hover:bg-ink-600"
            }`}
          >
            {dayNightAuto ? "🌙 Auto ON" : "🌙 Auto"}
          </button>
        </div>
      </div>

      {/* disruptions */}
      <div>
        <div className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
          Inject a disruption — watch the AI adapt
        </div>
        <div className="flex flex-wrap gap-2">
          <Btn variant="danger" onClick={() => sendAction("accident")}>
            💥 Accident
          </Btn>
          <Btn variant="warn" onClick={() => sendAction("closure")}>
            🌊 Flood / close blocks
          </Btn>
          <Btn variant="warn" onClick={() => sendAction("surge")}>
            📈 Rush-hour surge
          </Btn>
          <Btn variant="danger" onClick={() => sendAction("emergency")}>
            🚑 Ambulance
          </Btn>
          <Btn variant="warn" onClick={() => sendAction("motorcade")}>
            🚨 Motorcade
          </Btn>
          <Btn variant="danger" onClick={() => sendAction("signal_failure")}>
            💡 Signal failure
          </Btn>
          <Btn variant="warn" onClick={() => sendAction("protest")}>
            📢 Protest
          </Btn>
          <Btn variant="warn" onClick={() => sendAction("stadium")}>
            🏟️ Stadium surge
          </Btn>
        </div>
      </div>

      {/* demand slider */}
      <div>
        <div className="mb-1 flex justify-between text-[11px] uppercase tracking-wider text-slate-500">
          <span>Traffic demand</span>
          <span className="text-slate-300">{cur?.demand ?? 1}×</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={4}
          step={0.1}
          defaultValue={1}
          onChange={(e) => sendAction("demand", parseFloat(e.target.value))}
          className="w-full accent-wave"
        />
      </div>

      {/* view mode */}
      <div className="flex items-center justify-between border-t border-ink-700 pt-3">
        <div className="flex gap-1 rounded-lg border border-ink-600 bg-ink-800 p-1">
          <button
            onClick={() => setViewMode("split")}
            className={`rounded px-3 py-1 text-xs ${
              viewMode === "split" ? "bg-wave/25 text-wave" : "text-slate-400"
            }`}
          >
            Split A/B
          </button>
          <button
            onClick={() => setViewMode("single")}
            className={`rounded px-3 py-1 text-xs ${
              viewMode === "single" ? "bg-wave/25 text-wave" : "text-slate-400"
            }`}
          >
            Single
          </button>
        </div>
        {viewMode === "single" && (
          <div className="flex gap-1 rounded-lg border border-ink-600 bg-ink-800 p-1">
            <button
              onClick={() => setSelected("fixed")}
              className={`rounded px-3 py-1 text-xs ${
                selected === "fixed" ? "bg-slate-500/30 text-slate-200" : "text-slate-400"
              }`}
            >
              Fixed
            </button>
            <button
              onClick={() => setSelected("ai")}
              className={`rounded px-3 py-1 text-xs ${
                selected === "ai" ? "bg-wave/25 text-wave" : "text-slate-400"
              }`}
            >
              GreenWave AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
