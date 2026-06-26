import { useStore } from "../store";
import { stopDemoTour } from "../tour";

/** Narration banner shown over the city during the guided demo tour. */
export default function TourCaption() {
  const active = useStore((s) => s.tourActive);
  const caption = useStore((s) => s.tourCaption);
  if (!active) return null;
  return (
    <div className="pointer-events-none absolute left-1/2 top-14 z-20 w-[min(680px,90%)] -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-3 rounded-xl border border-wave/40 bg-ink-900/85 px-4 py-3 shadow-lg backdrop-blur glow">
        <span className="flex h-2.5 w-2.5 flex-none animate-pulse rounded-full bg-wave" />
        <p className="flex-1 text-sm text-slate-100">{caption || "Starting the tour…"}</p>
        <button
          onClick={stopDemoTour}
          className="flex-none rounded-md border border-ink-600 bg-ink-800 px-2 py-1 text-xs text-slate-300 hover:bg-ink-700"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
