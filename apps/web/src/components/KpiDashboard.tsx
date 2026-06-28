import { useStore } from "../store";
import type { Kpis } from "../types";

function Stat({
  label,
  fixed,
  ai,
  unit,
  better = "lower",
}: {
  label: string;
  fixed: number | null;
  ai: number | null;
  unit?: string;
  better?: "lower" | "higher";
}) {
  const f = fixed ?? 0;
  const a = ai ?? 0;
  // improvement = how much better the AI is; positive always means AI wins,
  // regardless of whether the metric is better-when-lower or better-when-higher.
  let improvement = 0;
  if (f !== 0) improvement = ((better === "lower" ? f - a : a - f) / Math.abs(f)) * 100;
  const shown = Math.round(improvement * 10) / 10;
  const deltaColor =
    shown > 0.05 ? "text-wave" : shown < -0.05 ? "text-red-400" : "text-slate-500";
  return (
    <div className="grid grid-cols-3 items-center gap-2 border-b border-ink-700 py-2 text-sm">
      <div className="text-slate-400">{label}</div>
      <div className="text-right font-mono text-slate-300">
        {fixed === null ? "—" : `${f}${unit ?? ""}`}
        <span className="ml-2 font-mono text-wave">
          {ai === null ? "—" : `${a}${unit ?? ""}`}
        </span>
      </div>
      <div className={`text-right font-mono text-xs ${deltaColor}`}>
        {fixed === null || ai === null || f === 0
          ? "—"
          : `${shown > 0 ? "+" : ""}${shown}%`}
      </div>
    </div>
  );
}

export default function KpiDashboard() {
  const cur = useStore((s) => s.cur);
  const fixed: Kpis | undefined = cur?.twins.fixed.kpis;
  const ai: Kpis | undefined = cur?.twins.ai.kpis;
  const savings = cur?.savings;

  return (
    <div className="flex flex-col gap-3">
      {/* headline impact */}
      <div className="rounded-xl border border-wave/40 bg-gradient-to-br from-ink-800 to-ink-900 p-4 glow">
        <div className="text-[11px] uppercase tracking-wider text-slate-400">
          Saved this session by GreenWave AI
        </div>
        <div className="mt-1 flex items-end gap-3">
          <div className="text-3xl font-bold text-wave text-glow">
            {savings ? `${Math.max(0, savings.travelTimePct)}%` : "—"}
          </div>
          <div className="pb-1 text-sm text-slate-300">faster average trips</div>
        </div>
        <div className="mt-1 text-sm text-slate-400">
          {savings ? `${Math.max(0, savings.co2KgSaved)} kg CO₂ avoided` : ""}
          {savings && savings.waitPct > 0
            ? ` · ${savings.waitPct}% less time stuck waiting`
            : ""}
        </div>
      </div>

      {/* comparison table */}
      <div className="rounded-xl border border-ink-600 bg-ink-900 p-4">
        <div className="mb-2 grid grid-cols-3 gap-2 text-[11px] uppercase tracking-wider text-slate-500">
          <div>Metric</div>
          <div className="text-right">
            Fixed <span className="text-wave">/ AI</span>
          </div>
          <div className="text-right">AI delta</div>
        </div>
        <Stat label="Avg trip time" fixed={fixed?.avgTravelTimeS ?? null} ai={ai?.avgTravelTimeS ?? null} unit="s" />
        <Stat label="Time waiting (total)" fixed={fixed?.totalWaitS ?? null} ai={ai?.totalWaitS ?? null} unit="s" />
        <Stat label="Trips completed" fixed={fixed?.completed ?? null} ai={ai?.completed ?? null} better="higher" />
        <Stat label="Throughput" fixed={fixed?.throughputPerMin ?? null} ai={ai?.throughputPerMin ?? null} unit="/min" better="higher" />
        <Stat label="Mean queue" fixed={fixed?.meanQueue ?? null} ai={ai?.meanQueue ?? null} />
        <Stat label="CO₂ emitted" fixed={fixed?.co2Kg ?? null} ai={ai?.co2Kg ?? null} unit=" kg" />
        <Stat label="Fuel burned" fixed={fixed?.fuelL ?? null} ai={ai?.fuelL ?? null} unit=" L" />
      </div>

      {/* emergency panel */}
      <div className="rounded-xl border border-ink-600 bg-ink-900 p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-wider text-slate-500">
          🚑 Emergency response (last dispatched)
          {(fixed?.emergencyActive || ai?.emergencyActive) && (
            <span className="flex items-center gap-1 rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-medium text-yellow-300">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
              in transit
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-ink-800 p-3">
            <div className="text-xs text-slate-400">Fixed timing</div>
            <div className="font-mono text-lg text-slate-200">
              {fixed?.emergencyActive && fixed?.emergencyResponseS == null
                ? "..."
                : fixed?.emergencyResponseS != null ? `${fixed.emergencyResponseS}s` : "—"}
            </div>
            <div className="text-xs text-slate-500">
              {fixed?.emergencyActive && fixed?.emergencyStops == null
                ? "en route"
                : fixed?.emergencyStops != null ? `${fixed.emergencyStops} stops` : "no run yet"}
            </div>
          </div>
          <div className="rounded-lg bg-ink-800 p-3 ring-1 ring-wave/40">
            <div className="text-xs text-wave">GreenWave AI corridor</div>
            <div className="font-mono text-lg text-wave">
              {ai?.emergencyActive && ai?.emergencyResponseS == null
                ? "..."
                : ai?.emergencyResponseS != null ? `${ai.emergencyResponseS}s` : "—"}
            </div>
            <div className="text-xs text-slate-500">
              {ai?.emergencyActive && ai?.emergencyStops == null
                ? "en route"
                : ai?.emergencyStops != null ? `${ai.emergencyStops} stops` : "no run yet"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
