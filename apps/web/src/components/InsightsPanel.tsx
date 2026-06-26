import { useState } from "react";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

type Recommendation = {
  icon: string;
  title: string;
  detail: string;
  impact: string;
};

type InsightsData = {
  summary: string;
  recommendations: Recommendation[];
  cached?: boolean;
};

async function fetchInsights(): Promise<InsightsData> {
  const r = await fetch(`${API}/api/insights`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  if (!d.ok) throw new Error(d.error ?? "Unknown error");
  return d as InsightsData;
}

export default function InsightsPanel() {
  const [data, setData]       = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInsights();
      setData(result);
      setFetchedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to reach Grok");
    } finally {
      setLoading(false);
    }
  }

  const age = fetchedAt ? Math.floor((Date.now() - fetchedAt) / 1000) : null;

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-900 p-4">
      {/* header */}
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            AI Infrastructure Insights
          </h2>
          <p className="text-[11px] text-slate-500">
            Powered by{" "}
            <span className="text-slate-400">Grok (xAI)</span>
            {data?.cached && (
              <span className="ml-1 text-slate-600">· cached</span>
            )}
            {age !== null && (
              <span className="ml-1 text-slate-600">· {age}s ago</span>
            )}
          </p>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className={`flex-none rounded-lg border px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
            loading
              ? "cursor-not-allowed border-ink-600 bg-ink-800 text-slate-500"
              : "border-wave/50 bg-wave/15 text-wave hover:bg-wave/25"
          }`}
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 animate-spin rounded-full border border-wave/40 border-t-wave" />
              Analyzing…
            </span>
          ) : (
            "⚡ Analyze city"
          )}
        </button>
      </div>

      {/* empty state */}
      {!data && !loading && !error && (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <span className="text-2xl">🏙️</span>
          <p className="text-[12px] leading-relaxed text-slate-400">
            Click <strong className="text-slate-300">Analyze city</strong> to get
            Grok's AI-powered recommendations for improving urban infrastructure
            based on live simulation data.
          </p>
        </div>
      )}

      {/* loading skeleton */}
      {loading && (
        <div className="space-y-3 py-1">
          {[80, 60, 72, 55].map((w, i) => (
            <div key={i} className="flex gap-2">
              <div className="mt-0.5 h-5 w-5 animate-pulse rounded bg-ink-700" />
              <div className="flex-1 space-y-1.5">
                <div
                  className="h-3 animate-pulse rounded bg-ink-700"
                  style={{ width: `${w}%` }}
                />
                <div className="h-2.5 w-full animate-pulse rounded bg-ink-800" />
                <div className="h-2.5 w-4/5 animate-pulse rounded bg-ink-800" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* error */}
      {error && !loading && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-[12px] text-red-300">
          <span className="font-medium">Error: </span>{error}
          {error.includes("GROK_API_KEY") && (
            <p className="mt-1 text-red-400/80">
              Set <code className="text-red-300">GROK_API_KEY</code> in{" "}
              <code className="text-red-300">apps/api/.env</code> and restart the server.
            </p>
          )}
        </div>
      )}

      {/* results */}
      {data && !loading && (
        <div className="space-y-3">
          {/* summary */}
          <div className="rounded-lg border border-wave/20 bg-wave/5 px-3 py-2.5">
            <p className="text-[12px] leading-relaxed text-slate-300">
              {data.summary}
            </p>
          </div>

          {/* recommendation cards */}
          <div className="space-y-2">
            {data.recommendations?.map((rec, i) => (
              <div
                key={i}
                className="rounded-lg border border-ink-600 bg-ink-800 p-3 transition hover:border-ink-500"
              >
                <div className="mb-1 flex items-start gap-2">
                  <span className="mt-0.5 flex-none text-base leading-none">
                    {rec.icon}
                  </span>
                  <span className="text-[12px] font-semibold leading-snug text-slate-200">
                    {rec.title}
                  </span>
                </div>
                <p className="mb-2 pl-6 text-[11px] leading-relaxed text-slate-400">
                  {rec.detail}
                </p>
                <div className="pl-6">
                  <span className="inline-block rounded border border-wave/30 bg-wave/10 px-2 py-0.5 text-[10px] font-medium text-wave">
                    {rec.impact}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-slate-600">
            Recommendations are generated from live KPI data by Grok (xAI) and
            reflect the current simulation state.
          </p>
        </div>
      )}
    </div>
  );
}
