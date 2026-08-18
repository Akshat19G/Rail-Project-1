/**
 * Rail Chikitsak — real database access layer.
 *
 * Every helper here talks to the live backend as the signed-in user (RLS
 * applies). Nothing is stored in localStorage any more.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Account, EmergencyRecord, Priority, Role, Station } from "./railcare-journey";
import { HOSPITALS, STATIONS } from "./railcare-journey";

/* ---------------------------------------------------------------- account */

export async function loadAccount(userId: string): Promise<Account | null> {
  const [{ data: profile }, { data: journey }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("journeys").select("*").eq("user_id", userId).maybeSingle(),
  ]);
  if (!profile) return null;

  const role: Role = profile.role === "doctor" ? "doctor" : "passenger";
  return {
    role,
    name: profile.full_name || "Rail Chikitsak user",
    email: profile.email ?? "",
    mobile: profile.mobile ?? "",
    ...(profile.age != null ? { age: profile.age } : {}),
    ...(profile.blood_group ? { bloodGroup: profile.blood_group } : {}),
    ...(profile.emergency_contact ? { emergencyContact: profile.emergency_contact } : {}),
    ...(profile.allergies ? { allergies: profile.allergies } : {}),
    ...(profile.specialization ? { specialization: profile.specialization } : {}),
    willing: profile.is_responder,
    demo: false,
    coach: journey?.coach ?? (role === "doctor" ? "B3" : "B2"),
    seat: journey?.seat ?? (role === "doctor" ? "28" : "41"),
  };

}

export async function saveAccount(userId: string, account: Account): Promise<void> {
  await supabase.from("profiles").upsert(
    {
      id: userId,
      role: account.role,
      full_name: account.name,
      mobile: account.mobile || null,
      email: account.email || null,
      age: account.age ?? null,
      blood_group: account.bloodGroup || null,
      emergency_contact: account.emergencyContact || null,
      allergies: account.allergies || null,
      specialization: account.specialization || null,
      is_responder: account.role === "doctor" ? (account.willing ?? true) : false,
    },
    { onConflict: "id" },
  );

  const { data: existing } = await supabase.from("journeys").select("id").eq("user_id", userId).maybeSingle();
  const journey = {
    role: account.role,
    coach: account.coach,
    seat: account.seat,
    available: account.role === "doctor" ? (account.willing ?? true) : false,
  };
  if (existing) {
    await supabase.from("journeys").update(journey).eq("id", existing.id);
  } else {
    await supabase.from("journeys").insert({ user_id: userId, ...journey });
  }
}

/* -------------------------------------------------------------- emergency */

function asStation(value: string): Station {
  return (STATIONS as readonly string[]).includes(value) ? (value as Station) : STATIONS[0];
}

export type EmergencyInsert = {
  code: string;
  passengerId: string;
  passengerName: string;
  passengerAge?: number | undefined;
  bloodGroup?: string | undefined;
  emergencyContact?: string | undefined;
  coach: string;
  seat: string;
  station: string;
  emergencyType: string;
  symptoms: string;
  priority: Priority;
  triageReason: string;
};

export async function createEmergency(input: EmergencyInsert): Promise<string | null> {
  const { data, error } = await supabase
    .from("emergencies")
    .insert({
      code: input.code,
      passenger_id: input.passengerId,
      passenger_name: input.passengerName,
      passenger_age: input.passengerAge ?? null,
      blood_group: input.bloodGroup ?? null,
      emergency_contact: input.emergencyContact ?? null,
      coach: input.coach,
      seat: input.seat,
      current_station: input.station,
      emergency_type: input.emergencyType,
      symptoms: input.symptoms,
      priority: input.priority,
      triage_reason: input.triageReason,
      status: "TRIAGE_COMPLETE",
    })
    .select("id")
    .maybeSingle();
  if (error) console.error("[railcare] createEmergency", error.message);
  return data?.id ?? null;
}

type EmergencyPatch = {
  status?: string;
  assigned_doctor_name?: string | null;
  doctor_specialization?: string | null;
  doctor_coach?: string | null;
  assessment?: string | null;
  escalated?: boolean;
  hospital_name?: string | null;
  hospital_station?: string | null;
  hospital_contact?: string | null;
  hospital_notified?: boolean;
  ambulance_id?: string | null;
  ambulance_status?: string | null;
  resolution?: string | null;
};

export async function updateEmergency(id: string, patch: EmergencyPatch): Promise<void> {
  const { error } = await supabase.from("emergencies").update(patch).eq("id", id);
  if (error) console.error("[railcare] updateEmergency", error.message);
}

export async function logEmergencyEvent(emergencyId: string, detail: string, actor = "System"): Promise<void> {
  await supabase.from("emergency_events").insert({
    emergency_id: emergencyId,
    event_type: "TIMELINE",
    actor,
    detail,
  });
}

export async function loadHistory(userId: string): Promise<EmergencyRecord[]> {
  const { data } = await supabase
    .from("emergencies")
    .select("*")
    .eq("passenger_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => ({
    id: row.code,
    at: row.created_at,
    station: asStation(row.current_station),
    type: row.emergency_type,
    priority: (row.priority ?? "—") as Priority | "—",
    doctor: row.assigned_doctor_name,
    hospital: row.hospital_name,
    outcome: row.resolution ?? (row.hospital_notified ? "Hospital contacted" : "Onboard response"),
  }));
}

export type LiveEmergency = {
  code: string;
  passengerName: string;
  age: number | null;
  coach: string;
  seat: string;
  station: Station;
  emergencyType: string;
  symptoms: string;
  priority: Priority;
  triageReason: string;
};

/** Most recent SOS raised on the train, used by the doctor console. */
export async function loadLatestEmergency(): Promise<LiveEmergency | null> {
  const { data } = await supabase
    .from("emergencies")
    .select("*")
    .neq("status", "ARCHIVED")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return {
    code: data.code,
    passengerName: data.passenger_name,
    age: data.passenger_age,
    coach: data.coach,
    seat: data.seat,
    station: asStation(data.current_station),
    emergencyType: data.emergency_type,
    symptoms: data.symptoms,
    priority: (data.priority ?? "MEDIUM") as Priority,
    triageReason: data.triage_reason ?? "",
  };
}

export async function clearHistoryFor(userId: string): Promise<void> {
  // Emergencies are an audit record and cannot be deleted; mark them archived.
  await supabase.from("emergencies").update({ status: "ARCHIVED" }).eq("passenger_id", userId);
}

export function hospitalFor(station: Station) {
  return HOSPITALS[station];
}

/* ---------------------------------------------------------------- reports */

export type ReportRow = {
  id: string;
  emergency_code: string;
  reporter_id: string;
  reporter_role: string;
  reported_user_id: string | null;
  reason: string;
  description: string;
  status: string;
  review_result: string | null;
  resolution: string | null;
  created_at: string;
};

export async function loadReports(): Promise<ReportRow[]> {
  const { data } = await supabase
    .from("emergency_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as ReportRow[];
}

export async function insertReport(input: {
  emergencyCode: string;
  reporterId: string;
  reporterRole: "doctor" | "passenger";
  reportedUserId: string | null;
  reason: string;
  description: string;
}): Promise<ReportRow | null> {
  const { data, error } = await supabase
    .from("emergency_reports")
    .insert({
      emergency_code: input.emergencyCode,
      reporter_id: input.reporterId,
      reporter_role: input.reporterRole,
      reported_user_id: input.reportedUserId,
      reason: input.reason,
      description: input.description,
      status: "SUBMITTED",
    })
    .select("*")
    .maybeSingle();
  if (error) console.error("[railcare] insertReport", error.message);
  return (data as ReportRow | null) ?? null;
}

export async function patchReport(
  id: string,
  patch: { status: string; review_result: string | null; resolution: string | null },
): Promise<void> {
  const { error } = await supabase.from("emergency_reports").update(patch).eq("id", id);
  if (error) console.error("[railcare] patchReport", error.message);
}

/* ---------------------------------------------------------------- rewards */

export type RewardTxRow = { id: string; label: string; points: number; kind: string; created_at: string };
export type RedeemedRow = {
  id: string;
  reward_id: string;
  name: string;
  detail: string;
  cost: number;
  code: string;
  created_at: string;
};

export async function loadRewards(userId: string): Promise<{ tx: RewardTxRow[]; redeemed: RedeemedRow[] }> {
  const [{ data: tx }, { data: redeemed }] = await Promise.all([
    supabase
      .from("reward_transactions")
      .select("id, label, points, kind, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("redeemed_rewards")
      .select("id, reward_id, name, detail, cost, code, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);
  return { tx: (tx ?? []) as RewardTxRow[], redeemed: (redeemed ?? []) as RedeemedRow[] };
}

export async function insertRewardTx(
  userId: string,
  label: string,
  points: number,
  kind: "EARN" | "REDEEM",
): Promise<RewardTxRow | null> {
  const { data, error } = await supabase
    .from("reward_transactions")
    .insert({ user_id: userId, label, points, kind })
    .select("id, label, points, kind, created_at")
    .maybeSingle();
  if (error) console.error("[railcare] insertRewardTx", error.message);
  return (data as RewardTxRow | null) ?? null;
}

export async function insertRedeemed(
  userId: string,
  reward: { id: string; name: string; detail: string; cost: number },
  code: string,
): Promise<RedeemedRow | null> {
  const { data, error } = await supabase
    .from("redeemed_rewards")
    .insert({
      user_id: userId,
      reward_id: reward.id,
      name: reward.name,
      detail: reward.detail,
      cost: reward.cost,
      code,
    })
    .select("id, reward_id, name, detail, cost, code, created_at")
    .maybeSingle();
  if (error) console.error("[railcare] insertRedeemed", error.message);
  return (data as RedeemedRow | null) ?? null;
}

/* ------------------------------------------------------------------ trust */

export async function loadTrustScore(userId: string): Promise<number | null> {
  const { data } = await supabase.from("profiles").select("trust_score").eq("id", userId).maybeSingle();
  return data?.trust_score ?? null;
}

export async function saveTrustScore(userId: string, score: number): Promise<void> {
  await supabase.from("profiles").update({ trust_score: score }).eq("id", userId);
}

export async function countEmergenciesFor(userId: string): Promise<number> {
  const { count } = await supabase
    .from("emergencies")
    .select("id", { count: "exact", head: true })
    .eq("passenger_id", userId);
  return count ?? 0;
}
