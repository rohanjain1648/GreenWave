import { useEffect } from "react";
import { connectStream, fetchNetwork } from "./api";
import { useStore } from "./store";
import Header from "./components/Header";
import CityScene from "./scene/CityScene";
import ControlPanel from "./components/ControlPanel";
import KpiDashboard from "./components/KpiDashboard";
import TourCaption from "./components/TourCaption";
import InsightsPanel from "./components/InsightsPanel";

export default function App() {
  const setNetwork = useStore((s) => s.setNetwork);
  const pushSnapshot = useStore((s) => s.pushSnapshot);
  const setConnected = useStore((s) => s.setConnected);
  const viewMode = useStore((s) => s.viewMode);
  const selected = useStore((s) => s.selected);

  useEffect(() => {
    fetchNetwork().then(setNetwork).catch(() => {});
    const disconnect = connectStream(pushSnapshot, setConnected);
    return disconnect;
  }, [setNetwork, pushSnapshot, setConnected]);

  return (
    <div className="flex h-full flex-col">
      <Header />
      <main className="grid flex-1 grid-cols-1 gap-4 overflow-auto p-4 lg:grid-cols-[1fr_380px]">
        {/* map area */}
        <section className="relative flex min-h-[420px] flex-col gap-4">
          <TourCaption />
          {viewMode === "split" ? (
            <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
              <CityScene
                twin="fixed"
                title="Fixed timing"
                subtitle="today's infrastructure — signals on a fixed timer"
                accent="#94a3b8"
                compact
              />
              <CityScene
                twin="ai"
                title="GreenWave AI"
                subtitle="Max-Pressure adaptive control + emergency corridors"
                accent="#22e584"
                compact
              />
            </div>
          ) : (
            <div className="flex-1">
              <CityScene
                twin={selected}
                title={selected === "ai" ? "GreenWave AI" : "Fixed timing"}
                subtitle={
                  selected === "ai"
                    ? "Max-Pressure adaptive control + emergency corridors"
                    : "today's infrastructure — signals on a fixed timer"
                }
                accent={selected === "ai" ? "#22e584" : "#94a3b8"}
              />
            </div>
          )}
          <ControlPanel />
        </section>

        {/* right rail */}
        <aside className="flex flex-col gap-4">
          <KpiDashboard />
          <InsightsPanel />
          <div className="rounded-xl border border-ink-700 bg-ink-900 p-3 text-[11px] leading-relaxed text-slate-500">
            <span className="text-slate-400">How to read this:</span> both cities get the
            exact same cars. The left runs on fixed timers (like most real cities); the
            right is run by GreenWave's AI. Inject an accident or send an ambulance and
            watch the gap widen. FutureHacks 2026 · Advanced division.
          </div>
        </aside>
      </main>
    </div>
  );
}
