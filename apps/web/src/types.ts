export type NodeT = { id: number; x: number; y: number };
export type EdgeT = { u: number; v: number; orient: "H" | "V" };
export type NetworkT = {
  rows: number;
  cols: number;
  spacing: number;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  nodes: NodeT[];
  edges: EdgeT[];
};

export type Kpis = {
  completed: number;
  active: number;
  avgTravelTimeS: number;
  totalWaitS: number;
  throughputPerMin: number;
  meanQueue: number;
  co2Kg: number;
  fuelL: number;
  emergencyResponseS: number | null;
  emergencyStops: number | null;
};

// vehicle tuple: [id, x, y, emergency(0|1), stopped(0|1)]
export type VehicleT = [number, number, number, number, number];
// signal tuple: [nodeId, phase(0=V green, 1=H green)]
export type SignalT = [number, number];

export type WeatherMode = "clear" | "rain" | "heavy";

export type Frame = {
  vehicles: VehicleT[];
  signals: SignalT[];
  kpis: Kpis;
  failedSignals: number[];
};

export type Savings = {
  travelTimePct: number;
  waitPct: number;
  co2Pct: number;
  co2KgSaved: number;
  queuePct: number;
};

export type Snapshot = {
  tick: number;
  simTime: number;
  running: boolean;
  speed: number;
  demand: number;
  blocked: [number, number][];
  twins: { fixed: Frame; ai: Frame };
  savings: Savings;
  weather: WeatherMode;
  simClock: number;
  dayNightAuto: boolean;
};

export type TwinId = "fixed" | "ai";
