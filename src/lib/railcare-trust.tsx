import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import * as db from "./railcare-db";


/**
 * Rail Chikitsak Trust, Accountability & Recognition layer.
 *
 * Mock service implementations (TrustService / RewardsService / ReportService)
 * kept intentionally abstract so they can be swapped for real backend calls
 * without touching any UI component.
 */

/* ------------------------------------------------------------------ types */

export type ReportReason =
  | "Suspected prank / false emergency"
  | "Repeated misuse"
  | "Abusive behavior"
  | "Deliberate misinformation"
  | "Other";

export const REPORT_REASONS: ReportReason[] = [
  "Suspected prank / false emergency",
  "Repeated misuse",
  "Abusive behavior",
  "Deliberate misinformation",
  "Other",
];

export type ReportStatus = "SUBMITTED" | "UNDER_REVIEW" | "VERIFIED" | "DISMISSED";

export type EmergencyReport = {
  id: string;
  emergencyId: string;
  reporterId: string;
  reporterRole: "doctor" | "passenger";
  reportedUserId: string;
  reason: ReportReason | string;
  description: string;
  status: ReportStatus;
  reviewResult: string | null;
  resolution: string | null;
  createdAt: string;
};

export type TrustStatus = "Good Standing" | "Warning" | "Restricted";

export type TrustProfile = {
  userId: string;
  score: number;
  status: TrustStatus;
  verifiedIncidents: number;
  warnings: number;
  emergencyRequests: number;
  successfulResponses: number;
};

export type RewardTier = "RESPONDER" | "SILVER" | "GOLD" | "ELITE";

export type RewardTransaction = {
  id: string;
  label: string;
  points: number;
  at: string;
  kind: "EARN" | "REDEEM";
};

export type RewardAccount = {
  userId: string;
  points: number;
  tier: RewardTier;
  history: RewardTransaction[];
};

export type ResponderImpact = {
  assisted: number;
  successful: number;
  escalations: number;
  reliability: number;
};

export type PassengerFeedback = {
  id: string;
  emergencyId: string;
  rating: "Excellent assistance" | "Helpful" | "Neutral" | "Concern";
  note: string;
  at: string;
};

/* ------------------------------------------------------------- reference */

export const TIERS: { tier: RewardTier; label: string; min: number; max: number }[] = [
  { tier: "RESPONDER", label: "Responder", min: 0, max: 499 },
  { tier: "SILVER", label: "Silver Responder", min: 500, max: 999 },
  { tier: "GOLD", label: "Gold Responder", min: 1000, max: 1999 },
  { tier: "ELITE", label: "Elite Responder", min: 2000, max: Number.POSITIVE_INFINITY },
];

export function tierFor(points: number): RewardTier {
  return TIERS.find((t) => points >= t.min && points <= t.max)?.tier ?? "RESPONDER";
}

export function nextTier(points: number) {
  return TIERS.find((t) => t.min > points) ?? null;
}

export const EARNING_RULES = [
  { label: "Emergency acknowledged", points: 20 },
  { label: "Emergency responsibly assessed", points: 40 },
  { label: "Hospital escalation when clinically appropriate", points: 50 },
  { label: "Completing responder availability period", points: 10 },
  { label: "Verified emergency assistance", points: 75 },
];

export type Redeemable = { id: string; name: string; cost: number; detail: string };

export const REDEEMABLES: Redeemable[] = [
  { id: "travel", name: "Railway Travel Voucher", cost: 1000, detail: "Travel credit with a partner railway operator." },
  { id: "cafe", name: "Partner Café Voucher", cost: 500, detail: "Refreshment credit at participating station cafés." },
  { id: "cert", name: "Emergency Response Certificate", cost: 300, detail: "Formal record of responder participation." },
  { id: "badge", name: "Rail Chikitsak Recognition Badge", cost: 250, detail: "Verified responder badge on your profile." },
];

/* ------------------------------------------------------------- defaults */

const BASE_TRUST_SCORE = 1000;

const EMPTY_TRUST: TrustProfile = {
  userId: "",
  score: BASE_TRUST_SCORE,
  status: "Good Standing",
  verifiedIncidents: 0,
  warnings: 0,
  emergencyRequests: 0,
  successfulResponses: 0,
};

const EMPTY_REWARDS: RewardAccount = { userId: "", points: 0, tier: "RESPONDER", history: [] };

const DEFAULT_IMPACT: ResponderImpact = { assisted: 12, successful: 9, escalations: 3, reliability: 98 };

/* --------------------------------------------------------------- context */

export type RedeemedReward = {
  id: string;
  rewardId: string;
  name: string;
  detail: string;
  cost: number;
  code: string;
  at: string;
};

type Ctx = {
  trust: TrustProfile;
  rewards: RewardAccount;
  redeemedRewards: RedeemedReward[];
  impact: ResponderImpact;
  reports: EmergencyReport[];
  feedback: PassengerFeedback[];
  available: boolean;
  setAvailable: (v: boolean) => void;

  submitReport: (input: {
    emergencyId: string;
    reason: ReportReason | string;
    description: string;
    reporterRole?: "doctor" | "passenger" | undefined;
    reportedUserId?: string | undefined;
  }) => EmergencyReport;
  verifyReport: (reportId: string) => void;
  dismissReport: (reportId: string) => void;
  earnPoints: (label: string, points: number) => void;
  redeem: (reward: Redeemable) => RedeemedReward | null;
  addFeedback: (f: Omit<PassengerFeedback, "id" | "at">) => void;
  resetTrustLayer: () => void;
};

const TrustContext = createContext<Ctx | null>(null);

/** Legacy local cache cleanup — all trust data now lives in the database. */
export function clearTrustStorage() {
  try {
    localStorage.removeItem("railcare.trust.v1");
  } catch {
    /* ignore */
  }
}

function voucherCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return `RC-${out.slice(0, 4)}-${out.slice(4)}`;
}

function toReport(row: db.ReportRow): EmergencyReport {
  return {
    id: row.id,
    emergencyId: row.emergency_code,
    reporterId: row.reporter_id,
    reporterRole: row.reporter_role === "passenger" ? "passenger" : "doctor",
    reportedUserId: row.reported_user_id ?? "",
    reason: row.reason,
    description: row.description,
    status: row.status as ReportStatus,
    reviewResult: row.review_result,
    resolution: row.resolution,
    createdAt: row.created_at,
  };
}

function statusFor(verified: number): TrustStatus {
  return verified >= 3 ? "Restricted" : verified >= 1 ? "Warning" : "Good Standing";
}

export function RailCareTrustProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [trust, setTrust] = useState<TrustProfile>(EMPTY_TRUST);
  const [rewards, setRewards] = useState<RewardAccount>(EMPTY_REWARDS);
  const [redeemedRewards, setRedeemedRewards] = useState<RedeemedReward[]>([]);
  const [reports, setReports] = useState<EmergencyReport[]>([]);
  const [feedback, setFeedback] = useState<PassengerFeedback[]>([]);
  const [available, setAvailable] = useState(true);

  const hydrate = useCallback(async (uid: string | null) => {
    if (!uid) {
      setTrust(EMPTY_TRUST);
      setRewards(EMPTY_REWARDS);
      setRedeemedRewards([]);
      setReports([]);
      return;
    }
    const [score, emergencies, rows, wallet] = await Promise.all([
      db.loadTrustScore(uid),
      db.countEmergenciesFor(uid),
      db.loadReports(),
      db.loadRewards(uid),
    ]);

    const list = rows.map(toReport);
    const verified = list.filter((r) => r.reportedUserId === uid && r.status === "VERIFIED").length;

    setReports(list);
    setTrust({
      userId: uid,
      score: score ?? BASE_TRUST_SCORE,
      status: statusFor(verified),
      verifiedIncidents: verified,
      warnings: verified,
      emergencyRequests: emergencies,
      successfulResponses: emergencies,
    });

    const points = wallet.tx.reduce((sum, t) => sum + t.points, 0);
    setRewards({
      userId: uid,
      points,
      tier: tierFor(points),
      history: wallet.tx.map((t) => ({
        id: t.id,
        label: t.label,
        points: t.points,
        at: t.created_at,
        kind: t.kind === "REDEEM" ? "REDEEM" : "EARN",
      })),
    });
    setRedeemedRewards(
      wallet.redeemed.map((r) => ({
        id: r.id,
        rewardId: r.reward_id,
        name: r.name,
        detail: r.detail,
        cost: r.cost,
        code: r.code,
        at: r.created_at,
      })),
    );
  }, []);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user.id ?? null;
      setUserId(uid);
      void hydrate(uid);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      const uid = session?.user.id ?? null;
      setUserId(uid);
      if (event === "SIGNED_OUT") void hydrate(null);
      else if (event === "SIGNED_IN" || event === "USER_UPDATED") void hydrate(uid);
    });
    return () => sub.subscription.unsubscribe();
  }, [hydrate]);

  const submitReport = useCallback<Ctx["submitReport"]>(
    (input) => {
      const optimistic: EmergencyReport = {
        id: `pending-${Date.now()}`,
        emergencyId: input.emergencyId,
        reporterId: userId ?? "",
        reporterRole: input.reporterRole ?? "doctor",
        reportedUserId: input.reportedUserId ?? "",
        reason: input.reason,
        description: input.description,
        status: "SUBMITTED",
        reviewResult: null,
        resolution: null,
        createdAt: new Date().toISOString(),
      };
      setReports((r) => [optimistic, ...r]);

      if (userId) {
        void (async () => {
          const row = await db.insertReport({
            emergencyCode: input.emergencyId,
            reporterId: userId,
            reporterRole: optimistic.reporterRole,
            reportedUserId: input.reportedUserId ?? null,
            reason: String(input.reason),
            description: input.description,
          });
          if (row) {
            setReports((r) => r.map((x) => (x.id === optimistic.id ? toReport(row) : x)));
            setTimeout(() => {
              void db.patchReport(row.id, { status: "UNDER_REVIEW", review_result: null, resolution: null });
              setReports((r) => r.map((x) => (x.id === row.id ? { ...x, status: "UNDER_REVIEW" } : x)));
            }, 900);
          }
        })();
      }

      return optimistic;
    },
    [userId],
  );

  const verifyReport = useCallback(
    (reportId: string) => {
      const patch = {
        status: "VERIFIED",
        review_result: "Verified misuse",
        resolution: "Passenger warning issued",
      };
      setReports((r) =>
        r.map((x) =>
          x.id === reportId
            ? { ...x, status: "VERIFIED", reviewResult: patch.review_result, resolution: patch.resolution }
            : x,
        ),
      );
      if (!reportId.startsWith("pending-")) void db.patchReport(reportId, patch);

      setTrust((t) => {
        const verified = t.verifiedIncidents + 1;
        const score = Math.max(0, t.score - 100);
        if (userId) void db.saveTrustScore(userId, score);
        return { ...t, score, verifiedIncidents: verified, warnings: t.warnings + 1, status: statusFor(verified) };
      });
    },
    [userId],
  );

  const dismissReport = useCallback((reportId: string) => {
    const patch = { status: "DISMISSED", review_result: "No misuse found", resolution: "No action taken" };
    setReports((r) =>
      r.map((x) =>
        x.id === reportId
          ? { ...x, status: "DISMISSED", reviewResult: patch.review_result, resolution: patch.resolution }
          : x,
      ),
    );
    if (!reportId.startsWith("pending-")) void db.patchReport(reportId, patch);
  }, []);

  const earnPoints = useCallback(
    (label: string, points: number) => {
      let shouldPersist = false;
      setRewards((a) => {
        if (a.history.some((h) => h.label === label && h.kind === "EARN")) return a;
        shouldPersist = true;
        const next = a.points + points;
        return {
          ...a,
          points: next,
          tier: tierFor(next),
          history: [
            { id: `local-${Date.now()}`, label, points, at: new Date().toISOString(), kind: "EARN" as const },
            ...a.history,
          ].slice(0, 50),
        };
      });
      if (userId && shouldPersist) void db.insertRewardTx(userId, label, points, "EARN");
    },
    [userId],
  );

  const redeem = useCallback<Ctx["redeem"]>(
    (reward) => {
      if (rewards.points < reward.cost) return null;
      const issued: RedeemedReward = {
        id: `local-${Date.now()}`,
        rewardId: reward.id,
        name: reward.name,
        detail: reward.detail,
        cost: reward.cost,
        code: voucherCode(),
        at: new Date().toISOString(),
      };
      const next = rewards.points - reward.cost;
      setRewards((a) => ({
        ...a,
        points: next,
        tier: tierFor(next),
        history: [
          {
            id: `local-redeem-${Date.now()}`,
            label: `Redeemed · ${reward.name}`,
            points: -reward.cost,
            at: issued.at,
            kind: "REDEEM" as const,
          },
          ...a.history,
        ].slice(0, 50),
      }));
      setRedeemedRewards((list) => [issued, ...list]);

      if (userId) {
        void (async () => {
          await db.insertRewardTx(userId, `Redeemed · ${reward.name}`, -reward.cost, "REDEEM");
          const row = await db.insertRedeemed(userId, reward, issued.code);
          if (row) setRedeemedRewards((list) => list.map((x) => (x.id === issued.id ? { ...issued, id: row.id } : x)));
        })();
      }
      return issued;
    },
    [rewards.points, userId],
  );

  const addFeedback = useCallback<Ctx["addFeedback"]>((f) => {
    setFeedback((list) => [{ ...f, id: `${Date.now()}`, at: new Date().toISOString() }, ...list]);
  }, []);

  const resetTrustLayer = useCallback(() => {
    setFeedback([]);
    setAvailable(true);
    void hydrate(userId);
  }, [hydrate, userId]);

  const value = useMemo<Ctx>(
    () => ({
      trust,
      rewards,
      redeemedRewards,
      impact: DEFAULT_IMPACT,
      reports,
      feedback,
      available,
      setAvailable,
      submitReport,
      verifyReport,
      dismissReport,
      earnPoints,
      redeem,
      addFeedback,
      resetTrustLayer,
    }),
    [
      trust,
      rewards,
      redeemedRewards,
      reports,
      feedback,
      available,
      submitReport,
      verifyReport,
      dismissReport,
      earnPoints,
      redeem,
      addFeedback,
      resetTrustLayer,
    ],
  );

  return <TrustContext.Provider value={value}>{children}</TrustContext.Provider>;
}

export function useTrust() {
  const ctx = useContext(TrustContext);
  if (!ctx) throw new Error("useTrust must be used inside RailCareTrustProvider");
  return ctx;
}

