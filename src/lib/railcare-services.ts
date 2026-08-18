/**
 * Rail Chikitsak — service abstraction layer.
 *
 * Everything in the current prototype runs on local, simulated state. These
 * interfaces exist so the demo implementations below can later be swapped for
 * real ones (Supabase auth, realtime emergency events, hospital APIs, SMS)
 * without touching the UI components.
 *
 *   AuthService              → DemoAuthService            → SupabaseAuthService
 *   TrainSimulationService   → DemoTrainSimulationService → LiveTrainFeedService
 *   EmergencyEventService    → DemoEmergencyEventService  → RealtimeEmergencyEventService
 *   HospitalService          → DemoHospitalService        → HospitalDirectoryService
 *   NotificationService      → DemoNotificationService    → SmsNotificationService
 */

import { HOSPITALS, JOURNEY_MS, STATIONS, type Account, type Station } from "./railcare-journey";

/* ------------------------------------------------------------------ auth */

export interface AuthService {
  readonly kind: string;
  load(): Account | null;
  save(account: Account): void;
  clear(): void;
}

const STORAGE_KEY = "railcare.account";

export const DemoAuthService: AuthService = {
  kind: "demo",
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Account) : null;
    } catch {
      return null;
    }
  },
  save(account) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(account));
    } catch {
      /* storage unavailable — demo continues in memory */
    }
  },
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

/* -------------------------------------------------------------- train sim */

export interface TrainSimulationService {
  readonly kind: string;
  readonly trainId: string;
  readonly stations: readonly Station[];
  readonly durationMs: number;
  stationIndexAt(elapsedMs: number): number;
}

export const DemoTrainSimulationService: TrainSimulationService = {
  kind: "demo",
  trainId: "RC Express 2047",
  get stations() {
    return STATIONS;
  },
  get durationMs() {
    return JOURNEY_MS;
  },
  stationIndexAt(elapsedMs) {
    const leg = JOURNEY_MS / (STATIONS.length - 1);
    return Math.min(Math.floor(elapsedMs / leg), STATIONS.length - 1);
  },
};

/* --------------------------------------------------------------- hospital */

export interface HospitalService {
  readonly kind: string;
  forStation(station: Station): { name: string; contact: string; ambulance: string };
}

export const DemoHospitalService: HospitalService = {
  kind: "demo",
  forStation(station) {
    return HOSPITALS[station];
  },
};

/* ---------------------------------------------------------- notifications */

export type SimulatedNotification = { channel: "SMS" | "PUSH" | "CONTROL"; to: string; body: string };

export interface NotificationService {
  readonly kind: string;
  send(n: SimulatedNotification): SimulatedNotification;
}

export const DemoNotificationService: NotificationService = {
  kind: "demo",
  send(n) {
    // No provider is contacted — the UI renders this as a simulated message.
    return n;
  },
};

/* ------------------------------------------------------- emergency events */

export type EmergencyEventName =
  | "sos.raised"
  | "triage.completed"
  | "doctor.notified"
  | "doctor.accepted"
  | "doctor.declined"
  | "doctor.timeout"
  | "hospital.alerted";

export interface EmergencyEventService {
  readonly kind: string;
  publish(event: EmergencyEventName, payload?: unknown): void;
  subscribe(handler: (event: EmergencyEventName, payload?: unknown) => void): () => void;
}

/** In-memory bus. Later: Supabase Realtime channel shared across devices. */
export const DemoEmergencyEventService: EmergencyEventService = (() => {
  const handlers = new Set<(event: EmergencyEventName, payload?: unknown) => void>();
  return {
    kind: "demo",
    publish(event, payload) {
      handlers.forEach((h) => h(event, payload));
    },
    subscribe(handler) {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
  };
})();

export const services = {
  auth: DemoAuthService,
  train: DemoTrainSimulationService,
  hospital: DemoHospitalService,
  notifications: DemoNotificationService,
  emergency: DemoEmergencyEventService,
};
