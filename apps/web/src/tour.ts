import { sendAction } from "./api";
import { useStore } from "./store";

/** A scripted "wow sequence" for judges / the demo video.
 *  Cancellable: a monotonically increasing token invalidates any running tour. */
let token = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Step = { caption: string; run?: () => void | Promise<void>; dwell: number };

export async function startDemoTour(): Promise<void> {
  const myToken = ++token;
  const s = useStore.getState();
  s.setTourActive(true);
  s.setAutoOrbit(true);
  s.setShowHeatmap(false);

  const steps: Step[] = [
    {
      caption:
        "Two identical cities, the same cars — one on today's fixed timers, one run by GreenWave's AI.",
      run: async () => {
        await sendAction("reset");
        useStore.getState().setViewMode("single");
        useStore.getState().setSelected("ai");
        await sendAction("demand", 1.4);
        await sendAction("speed", 2);
        await sendAction("play");
      },
      dwell: 6500,
    },
    {
      caption:
        "Side by side — left is fixed timing, right is GreenWave AI. Watch the AI keep traffic flowing.",
      run: () => useStore.getState().setViewMode("split"),
      dwell: 8000,
    },
    {
      caption:
        "💥 An accident! GreenWave re-times the surrounding signals and reroutes traffic in real time.",
      run: () => sendAction("accident"),
      dwell: 9000,
    },
    {
      caption:
        "🚑 Ambulance dispatched — the AI opens a green corridor so it never stops. The fixed city can't.",
      run: () => sendAction("emergency"),
      dwell: 10000,
    },
    {
      caption: "📈 Rush-hour surge — as demand climbs, the performance gap widens.",
      run: () => sendAction("surge"),
      dwell: 8000,
    },
    {
      caption:
        "🔥 Pollution map: red = idling emissions. The AI city runs measurably cleaner.",
      run: () => useStore.getState().setShowHeatmap(true),
      dwell: 9000,
    },
    {
      caption:
        "Faster trips, shorter queues, less CO₂ — this is the self-optimizing city.",
      dwell: 7000,
    },
  ];

  for (const step of steps) {
    if (token !== myToken) return; // cancelled
    if (step.run) await step.run();
    if (token !== myToken) return;
    useStore.getState().setTourCaption(step.caption);
    await sleep(step.dwell);
  }
  if (token === myToken) stopDemoTour();
}

export function stopDemoTour(): void {
  token++; // invalidate any in-flight tour
  const s = useStore.getState();
  s.setTourActive(false);
  s.setTourCaption("");
  s.setAutoOrbit(false);
}
