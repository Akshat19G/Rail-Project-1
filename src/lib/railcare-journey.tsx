import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { supabase } from "@/integrations/supabase/client";
import * as db from "./railcare-db";


/**
 * Rail Chikitsak — self-contained demo store.
 * SIMULATED DEMO DATA only. No railway, IRCTC, GPS, hospital or SMS system is contacted.
 */

export const STATIONS = [
  "Pune Central",
  "Talegaon",
  "Lonavala",
  "Karjat",
  "Kalyan",
  "Thane",
  "Mumbai Central",
] as const;

export type Station = (typeof STATIONS)[number];

export const HOSPITALS: Record<Station, { name: string; contact: string; ambulance: string }> = {
  "Pune Central": { name: "Pune Government Medical Center", contact: "DEMO CONTACT · 100-2001", ambulance: "RC-AMB-01" },
  Talegaon: { name: "Talegaon Government Medical Center", contact: "DEMO CONTACT · 100-2002", ambulance: "RC-AMB-04" },
  Lonavala: { name: "Lonavala Government Medical Center", contact: "DEMO CONTACT · 100-2003", ambulance: "RC-AMB-02" },
  Karjat: { name: "Karjat Government Medical Center", contact: "DEMO CONTACT · 100-2004", ambulance: "RC-AMB-07" },
  Kalyan: { name: "Kalyan Government Medical Center", contact: "DEMO CONTACT · 100-2005", ambulance: "RC-AMB-03" },
  Thane: { name: "Thane Government Medical Center", contact: "DEMO CONTACT · 100-2006", ambulance: "RC-AMB-05" },
  "Mumbai Central": { name: "Mumbai Government Medical Center", contact: "DEMO CONTACT · 100-2007", ambulance: "RC-AMB-09" },
};

export const EMERGENCY_TYPES = [
  { id: "chest", icon: "❤️", label: "Chest Pain", weight: 4 },
  { id: "breathing", icon: "🫁", label: "Breathing Difficulty", weight: 4 },
  { id: "fainting", icon: "🧠", label: "Fainting / Seizure", weight: 3 },
  { id: "injury", icon: "🩸", label: "Injury / Bleeding", weight: 3 },
  { id: "illness", icon: "🌡️", label: "Severe Illness", weight: 2 },
  { id: "other", icon: "⚠️", label: "Other", weight: 1 },
] as const;

export const TRAIN = "RC Express 2047";

export type Doctor = { name: string; specialization: string; coach: string; seat: string };

/** Onboard medical responders travelling on the train. */
export const DOCTOR_POOL: Doctor[] = [
  { name: "Dr. Ananya Sharma", specialization: "Cardiologist", coach: "B3", seat: "28" },
  { name: "Dr. Rohan Mehta", specialization: "Emergency Medicine", coach: "A1", seat: "12" },
  { name: "Dr. Kavita Nair", specialization: "General Physician", coach: "B1", seat: "07" },
  { name: "Dr. Imran Qureshi", specialization: "Pulmonologist", coach: "S4", seat: "33" },
  { name: "Dr. Neha Deshpande", specialization: "Anaesthesiologist", coach: "B5", seat: "19" },
  { name: "Dr. Arjun Rao", specialization: "Orthopaedic Surgeon", coach: "A2", seat: "44" },
];

/** Randomly notify 2–3 onboard responders. */
export function pickResponders(): Doctor[] {
  const shuffled = [...DOCTOR_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2 + Math.floor(Math.random() * 2));
}


export type Role = "passenger" | "doctor";

export type Account = {
  role: Role;
  name: string;
  email: string;
  mobile: string;
  age?: number;
  bloodGroup?: string;
  emergencyContact?: string;
  allergies?: string;
  specialization?: string;
  willing?: boolean;
  /** true for the one-click demo profiles; false for accounts created via sign-up. */
  demo?: boolean;
  coach: string;
  seat: string;
};

export const DEMO_PASSENGER: Account = {
  role: "passenger",
  demo: true,
  name: "Amit Sharma",
  email: "amit@demo.railcare.ai",
  mobile: "DEMO-90000-11122",
  age: 54,
  bloodGroup: "B+",
  emergencyContact: "Meera Sharma · DEMO-90000-33344",
  coach: "B2",
  seat: "41",
};

export const DEMO_DOCTOR: Account = {
  role: "doctor",
  demo: true,
  name: "Dr. Ananya Sharma",
  email: "ananya@demo.railcare.ai",
  mobile: "DEMO-90000-55566",
  specialization: "Cardiologist",
  willing: true,
  coach: "B3",
  seat: "28",
};

export const JOURNEY_MS = 60_000;
const LEG_MS = JOURNEY_MS / (STATIONS.length - 1);
export const RESPONSE_WINDOW = 120;

export type Phase = "idle" | "running" | "completed" | "emergency";
export type EmergencyStage = "form" | "triage" | "response";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DoctorStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "NO_RESPONSE";
export type Assessment = "HOSPITAL" | "MONITOR" | "CRITICAL";

export type TimelineEvent = { time: string; label: string };

export type Emergency = {
  id: string;
  station: Station;
  /** Station whose hospital is engaged (next halt when nobody responds onboard). */
  hospitalStation: Station;
  stage: EmergencyStage;
  passenger: string;
  coach: string;
  seat: string;
  /** Age of the patient, when known. */
  age: number | null;
  /** false when the account holder is raising the SOS on behalf of someone else. */
  forSelf: boolean;
  /** Name of the account holder when the SOS is raised for another passenger. */
  reportedBy: string | null;
  relation: string | null;
  type: string | null;
  icon: string | null;
  symptoms: string;
  priority: Priority | null;
  triageReason: string;
  notifiedDoctors: Doctor[];
  respondingDoctor: Doctor | null;
  doctorStatus: DoctorStatus;
  countdown: number;
  assessment: Assessment | null;
  hospitalStatus: "IDLE" | "ALERTED";
  ambulanceStatus: "IDLE" | "PREPARING" | "READY";
  escalationReason: string | null;
};

export type EmergencyRecord = {
  id: string;
  at: string;
  station: Station;
  type: string;
  priority: Priority | "—";
  doctor: string | null;
  hospital: string | null;
  outcome: string;
};

type Ctx = {
  account: Account | null;
  authReady: boolean;
  signIn: (a: Account) => void;
  signOut: () => void;

  phase: Phase;
  paused: boolean;
  elapsed: number;
  progress: number;
  remaining: number;
  stationIndex: number;
  currentStation: Station;
  nextStation: Station | null;
  emergency: Emergency | null;
  timeline: TimelineEvent[];
  history: EmergencyRecord[];
  clearHistory: () => void;

  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  resumeJourney: () => void;
  jumpTo: (index: number) => void;

  triggerSos: () => void;
  submitEmergency: (input: {
    typeId: string;
    symptoms: string;
    patient?: {
      forSelf: boolean;
      name?: string;
      age?: number;
      coach?: string;
      seat?: string;
      relation?: string;
    };
  }) => void;
  triggerIncomingEmergency: () => void;
  acceptEmergency: () => void;
  declineEmergency: () => void;
  setAssessment: (a: Assessment) => void;
  escalateAfterMonitoring: () => void;
  fastForwardTimer: () => void;
};

const JourneyContext = createContext<Ctx | null>(null);


function clock() {
  return new Date().toLocaleTimeString("en-GB", { hour12: false });
}

function newEmergencyId() {
  return `RC-EMG-${1000 + Math.floor(Math.random() * 8999)}`;
}

export function formatCountdown(s: number) {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = Math.max(0, s) % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function RailCareJourneyProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [phase, setPhase] = useState<Phase>("idle");
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [emergency, setEmergency] = useState<Emergency | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [history, setHistory] = useState<EmergencyRecord[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [userId, setUserId] = useState<string | null>(null);
  const rowId = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    async function hydrate(uid: string | null) {
      if (!uid) {
        if (!active) return;
        setAccount(null);
        setHistory([]);
        setAuthReady(true);
        return;
      }
      const [acc, hist] = await Promise.all([db.loadAccount(uid), db.loadHistory(uid)]);
      if (!active) return;
      setAccount(acc);
      setHistory(hist);
      setAuthReady(true);
    }

    void supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      void hydrate(uid);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      if (event === "SIGNED_OUT") {
        setAccount(null);
        setHistory([]);
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") void hydrate(uid);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (userId) void db.clearHistoryFor(userId);
  }, [userId]);


  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const push = useCallback((label: string) => {
    setTimeline((t) => {
      if (t.some((e) => e.label === label)) return t;
      if (rowId.current) void db.logEmergencyEvent(rowId.current, label);
      return [...t, { time: clock(), label }];
    });
  }, []);


  /* ------------------------------------------------------------- journey */

  // The train HALTS while an emergency is active — the ticker only runs in normal service.
  useEffect(() => {
    if (phase !== "running" || paused) return;
    const id = setInterval(() => {
      setElapsed((e) => {
        const next = e + 100;
        if (next >= JOURNEY_MS) {
          setPhase("completed");
          return JOURNEY_MS;
        }
        return next;
      });
    }, 100);
    return () => clearInterval(id);
  }, [phase, paused]);


  const stationIndex = Math.min(Math.floor(elapsed / LEG_MS), STATIONS.length - 1);
  const liveStation = STATIONS[stationIndex]!;
  const currentStation = liveStation;
  const nextStation = stationIndex < STATIONS.length - 1 ? STATIONS[stationIndex + 1]! : null;
  const progress = Math.round((elapsed / JOURNEY_MS) * 100);
  const remaining = Math.max(0, Math.ceil((JOURNEY_MS - elapsed) / 1000));

  /** Called after a real sign-in / sign-up — persists the profile + journey. */
  const signIn = useCallback((a: Account) => {
    setAccount(a);
    void (async () => {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id;
      if (!uid) return;
      setUserId(uid);
      await db.saveAccount(uid, a);
      setHistory(await db.loadHistory(uid));
    })();
  }, []);

  const signOut = useCallback(() => {
    setAccount(null);
    setHistory([]);
    rowId.current = null;
    void supabase.auth.signOut();
  }, []);


  const start = useCallback(() => {
    clearTimers();
    setElapsed(0);
    rowId.current = null;
    setEmergency(null);
    setTimeline([]);
    setPaused(false);
    setPhase("running");
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setElapsed(0);
    rowId.current = null;
    setEmergency(null);
    setTimeline([]);
    setPaused(false);
    setPhase("idle");
  }, [clearTimers]);

  /** Clear the emergency and let the halted train continue its run. */
  const resumeJourney = useCallback(() => {
    clearTimers();
    rowId.current = null;
    setEmergency(null);
    setTimeline([]);
    setPaused(false);
    setPhase((p) => (p === "emergency" ? "running" : p));
  }, [clearTimers]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  const jumpTo = useCallback((index: number) => {
    setElapsed(Math.min(Math.max(index, 0), STATIONS.length - 1) * LEG_MS);
    setPhase((p) => (p === "emergency" ? p : "running"));
  }, []);

  /* ----------------------------------------------------------- hospital */

  const escalateToHospital = useCallback(
    (reason: string) => {
      setEmergency((e) =>
        e ? { ...e, hospitalStatus: "ALERTED", ambulanceStatus: "PREPARING", escalationReason: reason } : e,
      );
      push("Hospital escalation triggered");
      push("Medical team preparing");
      timers.current.push(
        setTimeout(() => {
          setEmergency((e) => (e ? { ...e, ambulanceStatus: "READY" } : e));
          push("Ambulance ready at the halt");
        }, 1500),
      );
    },
    [push],
  );

  /* -------------------------------------------------------- response timer */

  useEffect(() => {
    if (!emergency || emergency.stage !== "response" || emergency.doctorStatus !== "PENDING") return;
    const id = setInterval(() => {
      setEmergency((e) => {
        if (!e || e.doctorStatus !== "PENDING") return e;
        const next = e.countdown - 1;
        if (next <= 0) return { ...e, countdown: 0, doctorStatus: "NO_RESPONSE" };
        return { ...e, countdown: next };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [emergency?.stage, emergency?.doctorStatus, emergency?.id]);

  useEffect(() => {
    if (emergency?.doctorStatus === "NO_RESPONSE" && emergency.hospitalStatus === "IDLE") {
      push("No onboard responder available");
      escalateToHospital(
        `No onboard doctor was available — the hospital at ${emergency.hospitalStation} has been contacted directly.`,
      );
    }
  }, [emergency?.doctorStatus, emergency?.hospitalStatus, emergency?.hospitalStation, escalateToHospital, push]);

  /* ------------------------------------------------------------- history */

  useEffect(() => {
    if (!emergency || emergency.stage !== "response") return;
    const hospitalAlerted = emergency.hospitalStatus === "ALERTED";
    const outcome = hospitalAlerted
      ? emergency.respondingDoctor
        ? "Doctor attended · hospital alerted"
        : "No doctor available · hospital contacted"
      : emergency.doctorStatus === "ACCEPTED"
        ? "Onboard doctor attending"
        : "Searching for medical assistance";

    const record: EmergencyRecord = {
      id: emergency.id,
      at: new Date().toISOString(),
      station: emergency.station,
      type: emergency.type ?? "Medical emergency",
      priority: emergency.priority ?? "—",
      doctor: emergency.respondingDoctor?.name ?? null,
      hospital: hospitalAlerted ? HOSPITALS[emergency.hospitalStation].name : null,
      outcome,
    };
    setHistory((h) => [record, ...h.filter((r) => r.id !== record.id)].slice(0, 20));

    if (!userId || account?.role !== "passenger") return;
    const hospital = HOSPITALS[emergency.hospitalStation];
    let cancelled = false;

    void (async () => {
      if (!rowId.current) {
        const id = await db.createEmergency({
          code: emergency.id,
          passengerId: userId,
          passengerName: emergency.passenger,
          passengerAge: emergency.age ?? account.age,
          bloodGroup: account.bloodGroup,
          emergencyContact: account.emergencyContact,
          coach: emergency.coach,
          seat: emergency.seat,
          station: emergency.station,
          emergencyType: emergency.type ?? "Medical emergency",
          symptoms: emergency.symptoms,
          priority: emergency.priority ?? "MEDIUM",
          triageReason: emergency.triageReason,
        });
        if (cancelled) return;
        rowId.current = id;
      }
      if (!rowId.current) return;
      await db.updateEmergency(rowId.current, {
        status: hospitalAlerted
          ? "HOSPITAL_ALERTED"
          : emergency.doctorStatus === "ACCEPTED"
            ? "DOCTOR_ASSIGNED"
            : "AWAITING_RESPONDER",
        assigned_doctor_name: emergency.respondingDoctor?.name ?? null,
        doctor_specialization: emergency.respondingDoctor?.specialization ?? null,
        doctor_coach: emergency.respondingDoctor?.coach ?? null,
        assessment: emergency.assessment,
        escalated: hospitalAlerted,
        hospital_notified: hospitalAlerted,
        hospital_name: hospitalAlerted ? hospital.name : null,
        hospital_station: hospitalAlerted ? emergency.hospitalStation : null,
        hospital_contact: hospitalAlerted ? hospital.contact : null,
        ambulance_id: hospitalAlerted ? hospital.ambulance : null,
        ambulance_status: emergency.ambulanceStatus,
        resolution: outcome,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    userId,
    account,
    emergency?.id,
    emergency?.stage,
    emergency?.doctorStatus,
    emergency?.hospitalStatus,
    emergency?.ambulanceStatus,
    emergency?.assessment,
    emergency?.respondingDoctor?.name,
    emergency?.priority,
  ]);



  /* -------------------------------------------------------- SOS + triage */

  const baseEmergency = useCallback(
    (station: Station, hospitalStation: Station): Emergency => ({
      id: newEmergencyId(),
      station,
      hospitalStation,
      stage: "form",
      passenger: account?.role === "passenger" ? account.name : DEMO_PASSENGER.name,
      coach: account?.role === "passenger" ? account.coach : DEMO_PASSENGER.coach,
      seat: account?.role === "passenger" ? account.seat : DEMO_PASSENGER.seat,
      age: (account?.role === "passenger" ? account.age : DEMO_PASSENGER.age) ?? null,
      forSelf: true,
      reportedBy: null,
      relation: null,
      type: null,
      icon: null,
      symptoms: "",
      priority: null,
      triageReason: "",
      notifiedDoctors: pickResponders(),
      respondingDoctor: null,
      doctorStatus: "PENDING",
      countdown: RESPONSE_WINDOW,
      assessment: null,
      hospitalStatus: "IDLE",
      ambulanceStatus: "IDLE",
      escalationReason: null,
    }),
    [account],
  );

  /** The train halts here; if nobody responds onboard, the next halt's hospital is engaged. */
  const haltStation = liveStation;
  const onwardStation = nextStation ?? liveStation;

  const triggerSos = useCallback(() => {
    clearTimers();
    // Bring the train to a stand at the station it is at right now.
    setElapsed(stationIndex * LEG_MS);
    setPhase("emergency");
    const em = baseEmergency(haltStation, onwardStation);
    setEmergency(em);
    setTimeline([
      { time: clock(), label: "SOS activated" },
      { time: clock(), label: `Train halted at ${haltStation}` },
      { time: clock(), label: "Emergency location identified" },
    ]);
  }, [baseEmergency, clearTimers, haltStation, onwardStation, stationIndex]);

  const triage = useCallback((typeId: string, symptoms: string) => {
    const type = EMERGENCY_TYPES.find((t) => t.id === typeId) ?? EMERGENCY_TYPES[5];
    const text = symptoms.toLowerCase();
    const boost =
      (text.includes("breath") ? 1 : 0) +
      (text.includes("unconscious") || text.includes("faint") ? 1 : 0) +
      (text.includes("dizz") ? 1 : 0);
    const score = type.weight + boost;
    const priority: Priority = score >= 5 ? "CRITICAL" : score >= 4 ? "HIGH" : score >= 3 ? "MEDIUM" : "LOW";
    const triageReason =
      priority === "CRITICAL"
        ? "Reported symptoms match a time-critical cardiac/respiratory pattern. Immediate medical response recommended."
        : priority === "HIGH"
          ? "Symptoms indicate an urgent condition requiring medical attention at the current station."
          : "Symptoms suggest a non-critical condition. Monitoring and first-aid support recommended.";
    return { type, priority, triageReason };
  }, []);

  const submitEmergency = useCallback(
    ({
      typeId,
      symptoms,
      patient,
    }: {
      typeId: string;
      symptoms: string;
      patient?: { forSelf: boolean; name?: string; age?: number; coach?: string; seat?: string; relation?: string };
    }) => {
      const { type, priority, triageReason } = triage(typeId, symptoms);
      setEmergency((e) => {
        if (!e) return e;
        const forSelf = patient?.forSelf ?? true;
        return {
          ...e,
          stage: "triage",
          type: type.label,
          icon: type.icon,
          symptoms,
          priority,
          triageReason,
          forSelf,
          reportedBy: forSelf ? null : e.passenger,
          relation: forSelf ? null : patient?.relation?.trim() || null,
          passenger: forSelf ? e.passenger : patient?.name?.trim() || "Unknown passenger",
          coach: forSelf ? e.coach : patient?.coach?.trim() || e.coach,
          seat: forSelf ? e.seat : patient?.seat?.trim() || e.seat,
          age: forSelf ? e.age : (patient?.age ?? null),
        };
      });
      push(
        patient && !patient.forSelf
          ? `Emergency reported on behalf of ${patient.name?.trim() || "another passenger"}`
          : "Emergency details submitted",
      );

      clearTimers();
      timers.current.push(
        setTimeout(() => {
          setEmergency((e) => (e ? { ...e, stage: "response" } : e));
          push("AI triage completed");
          setEmergency((e) => {
            if (e) push(`${e.notifiedDoctors.length} onboard medical responders alerted`);
            return e;
          });
        }, 1100),
      );

      // Responders answer fast — some journeys nobody is available and the
      // hospital at the next halt is contacted directly.
      timers.current.push(
        setTimeout(
          () => {
            setEmergency((e) => {
              if (!e || e.doctorStatus !== "PENDING") return e;
              const accepts = Math.random() < 0.6;
              if (!accepts) return { ...e, doctorStatus: "NO_RESPONSE", countdown: 0 };
              const doc = e.notifiedDoctors[Math.floor(Math.random() * e.notifiedDoctors.length)] ?? DOCTOR_POOL[0]!;
              push(`${doc.name} (${doc.specialization}) accepted — coach ${doc.coach}`);
              return { ...e, doctorStatus: "ACCEPTED", respondingDoctor: doc };
            });
          },
          2600 + Math.floor(Math.random() * 1800),
        ),
      );
    },
    [clearTimers, push, triage],
  );

  /** Incoming passenger SOS arriving at the doctor console. */
  const triggerIncomingEmergency = useCallback(() => {
    const { type, priority, triageReason } = triage("chest", "Chest pain and breathlessness, feeling dizzy");
    clearTimers();
    setElapsed(stationIndex * LEG_MS);
    setPhase("emergency");
    setEmergency({
      ...baseEmergency(haltStation, onwardStation),
      passenger: DEMO_PASSENGER.name,
      coach: DEMO_PASSENGER.coach,
      seat: DEMO_PASSENGER.seat,
      age: DEMO_PASSENGER.age ?? null,
      stage: "response",
      type: type.label,
      icon: type.icon,
      symptoms: "Chest pain + breathlessness",
      priority,
      triageReason,
    });
    // If a passenger raised a real SOS on this train, show those patient details.
    void db.loadLatestEmergency().then((live) => {
      if (!live) return;
      setEmergency((e) =>
        e
          ? {
              ...e,
              id: live.code,
              passenger: live.passengerName,
              age: live.age,
              coach: live.coach,
              seat: live.seat,
              type: live.emergencyType,
              symptoms: live.symptoms,
              priority: live.priority,
              triageReason: live.triageReason || e.triageReason,
            }
          : e,
      );
    });
    setTimeline([
      { time: clock(), label: "SOS activated" },
      { time: clock(), label: `Train halted at ${haltStation}` },
      { time: clock(), label: "AI triage completed" },
      { time: clock(), label: "Onboard medical responder notified" },
    ]);
  }, [baseEmergency, clearTimers, haltStation, onwardStation, stationIndex, triage]);

  const acceptEmergency = useCallback(() => {
    const self: Doctor | null =
      account?.role === "doctor"
        ? {
            name: account.name,
            specialization: account.specialization ?? "Medical responder",
            coach: account.coach,
            seat: account.seat,
          }
        : null;
    setEmergency((e) => (e ? { ...e, doctorStatus: "ACCEPTED", respondingDoctor: self ?? e.respondingDoctor } : e));
    push("Doctor accepted the emergency");
  }, [account, push]);


  const declineEmergency = useCallback(() => {
    setEmergency((e) => (e ? { ...e, doctorStatus: "DECLINED" } : e));
    push("Doctor declined — escalating");
    escalateToHospital("The onboard medical responder declined the emergency.");
  }, [escalateToHospital, push]);

  const setAssessment = useCallback(
    (a: Assessment) => {
      setEmergency((e) => (e ? { ...e, assessment: a } : e));
      push("Medical assessment completed");
      if (a === "MONITOR") {
        push("First aid / monitoring recommended");
      } else {
        escalateToHospital(
          a === "CRITICAL"
            ? "Doctor marked the case as critical — immediate hospital response required."
            : "Doctor determined that hospital assistance is required.",
        );
      }
    },
    [escalateToHospital, push],
  );

  const escalateAfterMonitoring = useCallback(() => {
    push("Condition worsened during monitoring");
    escalateToHospital("Doctor escalated after monitoring — hospital assistance now required.");
  }, [escalateToHospital, push]);

  const fastForwardTimer = useCallback(() => {
    setEmergency((e) => (e && e.doctorStatus === "PENDING" ? { ...e, countdown: 5 } : e));
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      account,
      authReady,
      signIn,
      signOut,
      phase,
      paused,
      elapsed,
      progress,
      remaining,
      stationIndex,
      currentStation,
      nextStation,
      emergency,
      timeline,
      history,
      clearHistory,
      start,
      pause,
      resume,
      reset,
      resumeJourney,
      jumpTo,
      triggerSos,
      submitEmergency,
      triggerIncomingEmergency,
      acceptEmergency,
      declineEmergency,
      setAssessment,
      escalateAfterMonitoring,
      fastForwardTimer,
    }),
    [
      account,
      authReady,
      signIn,
      signOut,
      phase,
      paused,
      elapsed,
      progress,
      remaining,
      stationIndex,
      currentStation,
      nextStation,
      emergency,
      timeline,
      history,
      clearHistory,
      start,
      pause,
      resume,
      reset,
      resumeJourney,
      jumpTo,
      triggerSos,
      submitEmergency,
      triggerIncomingEmergency,
      acceptEmergency,
      declineEmergency,
      setAssessment,
      escalateAfterMonitoring,
      fastForwardTimer,
    ],
  );

  return <JourneyContext.Provider value={value}>{children}</JourneyContext.Provider>;
}

export function useJourney() {
  const ctx = useContext(JourneyContext);
  if (!ctx) throw new Error("useJourney must be used inside RailCareJourneyProvider");
  return ctx;
}
