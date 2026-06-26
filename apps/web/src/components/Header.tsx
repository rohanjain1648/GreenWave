import { useStore } from "../store";

export default function Header() {
  const connected = useStore((s) => s.connected);
  const cur = useStore((s) => s.cur);
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-700 px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="text-2xl">🌊</div>
        <div>
          <div className="text-lg font-bold tracking-tight">
            Green<span className="text-wave text-glow">Wave</span>
          </div>
          <div className="text-[11px] text-slate-400">
            the self-optimizing city · real-time AI traffic digital twin
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-slate-400">
        <span>
          sim&nbsp;time{" "}
          <span className="font-mono text-slate-200">{cur?.simTime ?? 0}s</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-wave" : "bg-red-500"
            }`}
            style={connected ? { boxShadow: "0 0 8px #22e584" } : {}}
          />
          {connected ? "live" : "reconnecting…"}
        </span>
      </div>
    </header>
  );
}
