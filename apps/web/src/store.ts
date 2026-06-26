import { create } from "zustand";
import type { NetworkT, Snapshot, TwinId } from "./types";

type ViewMode = "single" | "split";

type State = {
  network: NetworkT | null;
  cur: Snapshot | null;
  prev: Snapshot | null;
  curAt: number; // performance.now() when cur arrived
  prevAt: number;
  connected: boolean;
  viewMode: ViewMode;
  selected: TwinId; // which twin the single view shows

  // demo tour + visualization toggles
  tourActive: boolean;
  tourCaption: string;
  autoOrbit: boolean;
  showHeatmap: boolean;

  setNetwork: (n: NetworkT) => void;
  pushSnapshot: (s: Snapshot) => void;
  setConnected: (c: boolean) => void;
  setViewMode: (m: ViewMode) => void;
  setSelected: (t: TwinId) => void;
  setTourActive: (b: boolean) => void;
  setTourCaption: (s: string) => void;
  setAutoOrbit: (b: boolean) => void;
  setShowHeatmap: (b: boolean) => void;
  toggleHeatmap: () => void;
};

export const useStore = create<State>((set) => ({
  network: null,
  cur: null,
  prev: null,
  curAt: 0,
  prevAt: 0,
  connected: false,
  viewMode: "single",
  selected: "ai",

  tourActive: false,
  tourCaption: "",
  autoOrbit: false,
  showHeatmap: false,

  setNetwork: (n) => set({ network: n }),
  pushSnapshot: (s) =>
    set((st) => ({
      prev: st.cur,
      prevAt: st.curAt,
      cur: s,
      curAt: performance.now(),
    })),
  setConnected: (c) => set({ connected: c }),
  setViewMode: (m) => set({ viewMode: m }),
  setSelected: (t) => set({ selected: t }),
  setTourActive: (b) => set({ tourActive: b }),
  setTourCaption: (s) => set({ tourCaption: s }),
  setAutoOrbit: (b) => set({ autoOrbit: b }),
  setShowHeatmap: (b) => set({ showHeatmap: b }),
  toggleHeatmap: () => set((st) => ({ showHeatmap: !st.showHeatmap })),
}));
