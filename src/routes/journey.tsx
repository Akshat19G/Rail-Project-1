import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  Clock,
  History,
  LayoutDashboard,
  MessageSquareHeart,
  Settings as SettingsIcon,
  Siren,
  ShieldCheck,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RailMap, TimelineCard } from "@/components/railcare/ui";
import { DashboardShell, Panel, SectionHeading, Stat, Tag, type NavItem } from "@/components/railcare/shell";
import { HospitalPanel, JourneyCard, TriageResult } from "@/components/railcare/emergency-panels";
import { FeedbackDialog, TrustBadge, TrustCard, TrustSection } from "@/components/railcare/trust";
import { ReportDialog, ReportsSection, TrustReviewCard } from "@/components/railcare/reports";
import { useTrust } from "@/lib/railcare-trust";
import { useI18n } from "@/lib/railcare-i18n";
import { LanguageSwitcher } from "@/components/railcare/language-switcher";
import { SettingsSection } from "@/components/railcare/settings";
import { EMERGENCY_TYPES, HOSPITALS, TRAIN, useJourney } from "@/lib/railcare-journey";

export const Route = createFileRoute("/journey")({
  head: () => ({
    meta: [
      { title: "Passenger Console — Rail Chikitsak Medical SOS" },
      {
        name: "description",
        content:
          "Passenger console with live journey tracking, one-tap medical SOS, AI-assisted triage, Rail Chikitsak Trust and emergency history.",
      },
      { property: "og:title", content: "Passenger Console — Rail Chikitsak" },
      {
        property: "og:description",
        content: "Track your journey, raise a medical SOS and follow the full emergency response.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PassengerDashboard,
});

type Tab = "overview" | "emergency" | "trust" | "history" | "feedback" | "profile" | "settings";

function useNav(): NavItem<Tab>[] {
  const { t } = useI18n();
  return [
    { id: "overview", label: t("nav.overview"), icon: LayoutDashboard },
    { id: "emergency", label: t("nav.emergency"), icon: Siren },
    { id: "trust", label: t("nav.trust"), icon: ShieldCheck },
    { id: "history", label: t("nav.history"), icon: History },
    { id: "feedback", label: "Feedback", icon: MessageSquareHeart },
    { id: "profile", label: t("nav.profile"), icon: User },
    { id: "settings", label: t("nav.settings"), icon: SettingsIcon },
  ];
}

function PassengerDashboard() {
  const j = useJourney();
  const navigate = useNavigate();
  const NAV = useNav();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!j.authReady) return;
    if (!j.account) void navigate({ to: "/auth", replace: true });
    else if (j.account.role !== "passenger") void navigate({ to: "/doctor", replace: true });
    else if (j.phase === "idle") j.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [j.authReady, j.account]);

  useEffect(() => {
    if (j.phase === "emergency") setTab("emergency");
  }, [j.phase]);

  if (!j.authReady || j.account?.role !== "passenger") {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <DashboardShell
      nav={NAV}
      active={tab}
      onNavigate={setTab}
      workspace="Passenger console"
      status={<TrustBadge />}
    >
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === "overview" ? <OverviewTab onNavigate={setTab} /> : null}
          {tab === "emergency" ? <EmergencyTab /> : null}
          {tab === "trust" ? <TrustSection /> : null}
          {tab === "history" ? <HistoryTab /> : null}
          {tab === "feedback" ? <FeedbackTab /> : null}
          {tab === "profile" ? <ProfileTab /> : null}
          {tab === "settings" ? <SettingsSection /> : null}
        </motion.div>
      </AnimatePresence>
    </DashboardShell>
  );
}

/* ----------------------------------------------------------------- overview */

function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const j = useJourney();
  const a = j.account!;

  if (j.phase === "completed") return <JourneyCompleted />;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Good journey, {a.name.split(" ")[0]}</p>
        <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight">You are travelling safely</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          Rail Chikitsak is watching your route and knows the nearest medical facility at every point of the journey.
        </p>
      </div>

      <JourneyCard coach={a.coach} seat={a.seat} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          <SosCard onOpenEmergency={() => onNavigate("emergency")} />
          <RailMap />
        </div>
        <div className="space-y-5">
          <TrustCard onOpen={() => onNavigate("trust")} />
          <Panel title="Nearest medical support">
            <p className="font-medium">{HOSPITALS[j.currentStation].name}</p>
            <p className="mt-1 text-sm text-muted-foreground">Linked to {j.currentStation}</p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">{HOSPITALS[j.currentStation].contact}</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function SosCard({ onOpenEmergency }: { onOpenEmergency: () => void }) {
  const j = useJourney();
  const [confirm, setConfirm] = useState(false);

  return (
    <section className="relative overflow-hidden rounded-xl border border-critical/25 bg-card p-8 text-center">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,color-mix(in_oklab,var(--prio-critical)_10%,transparent),transparent_70%)]" />
      <div className="relative">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          One tap. The response starts.
        </p>
        <button
          onClick={() => setConfirm(true)}
          className="pulse-critical mx-auto mt-6 flex h-24 w-full max-w-lg items-center justify-center gap-3 rounded-xl bg-critical text-2xl font-semibold tracking-tight text-on-priority shadow-emergency transition-transform duration-200 hover:scale-[1.01] active:scale-[0.99]"
        >
          <Siren className="h-7 w-7" /> MEDICAL SOS
        </button>
        <p className="mt-4 text-sm text-muted-foreground">Tap if you need immediate medical assistance.</p>
      </div>

      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Medical emergency?</DialogTitle>
            <DialogDescription>
              The train will stop at the current station and Rail Chikitsak will alert onboard doctors and the nearest hospital.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-2">
            <Button
              className="h-12 w-full bg-critical text-base text-on-priority hover:bg-critical/90"
              onClick={() => {
                setConfirm(false);
                j.triggerSos();
                onOpenEmergency();
                toast.error("SOS activated — train stopping at the current station");
              }}
            >
              Yes, I need help
            </Button>
            <Button variant="outline" className="h-11 w-full" onClick={() => setConfirm(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

/* ---------------------------------------------------------------- emergency */

function EmergencyTab() {
  const j = useJourney();
  if (!j.emergency) {
    return (
      <div className="space-y-6">
        <SectionHeading
          title="Emergency"
          description="No active emergency. Raise a medical SOS and Rail Chikitsak alerts onboard doctors and the nearest hospital."
        />
        <SosCard onOpenEmergency={() => undefined} />
      </div>
    );
  }
  return <EmergencyScreen />;
}

function EmergencyScreen() {
  const j = useJourney();
  const { trust } = useTrust();
  const em = j.emergency!;
  const hospital = HOSPITALS[em.hospitalStation];
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-critical/35 bg-card">
        <div className="bg-critical px-6 py-5 text-on-priority">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-80">Medical emergency active</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            {em.hospitalStatus === "ALERTED" ? "Medical help alerted" : "Emergency response in progress"}
          </h1>
          <p className="mt-1.5 text-sm opacity-90">
            The train has stopped at {em.station}. Your seat location is shared with responders.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Emergency ID", em.id],
            ["Train", TRAIN],
            ["Halted at", em.station],
            ["Coach", em.coach],
            ["Seat", em.seat],
            ["Passenger", em.passenger],
            ...(em.forSelf ? [] : [["Reported by", `${em.reportedBy}${em.relation ? ` · ${em.relation}` : ""}`]]),
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 bg-card px-5 py-4">
              <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 truncate font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <RailMap />

      {em.stage === "form" ? <EmergencyForm /> : null}
      {em.stage === "triage" ? <TriageAnimation /> : null}

      {em.stage === "response" ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-5">
            <StatusPanel />
            <CalmAssistant />
            <RespondersCard />
            <TriageResult />
            {em.hospitalStatus === "ALERTED" ? <HospitalPanel hospital={hospital} /> : null}
          </div>
          <TimelineCard />
        </div>
      ) : (
        <TimelineCard />
      )}

      {trust.status !== "Good Standing" ? (
        <Panel title="Account trust" action={<Tag tone="warning">Warning issued</Tag>}>
          <p className="text-sm text-muted-foreground">
            A previous request was verified as misuse. Your SOS is still available — please use it only for genuine
            medical emergencies.
          </p>
        </Panel>
      ) : null}

      {em.stage === "response" && (em.hospitalStatus === "ALERTED" || em.doctorStatus === "ACCEPTED") ? (
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" className="h-11 px-6" onClick={() => setFeedbackOpen(true)}>
            Give feedback
          </Button>
          <Button
            className="h-11 px-8"
            onClick={() => {
              j.resumeJourney();
              toast.success("Train cleared to resume — logged in your emergency history");
            }}
          >
            Resume journey
          </Button>
        </div>
      ) : null}

      <FeedbackDialog emergencyId={em.id} open={feedbackOpen} onOpenChange={setFeedbackOpen} />
    </div>
  );
}

function StatusPanel() {
  const em = useJourney().emergency!;
  const response =
    em.hospitalStatus === "ALERTED"
      ? em.escalationReason ?? "Hospital alerted."
      : em.doctorStatus === "ACCEPTED" && em.respondingDoctor
        ? `${em.respondingDoctor.name} · ${em.respondingDoctor.specialization} is on the way from coach ${em.respondingDoctor.coach}.`
        : `Alerting ${em.notifiedDoctors.length} onboard doctors…`;

  return (
    <section className="rounded-xl border border-border bg-navy p-6 text-navy-foreground">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-navy-foreground/60">Live status</p>
      <dl className="mt-5 grid grid-cols-2 gap-y-5 sm:grid-cols-4">
        {[
          ["Train", "Halted"],
          ["Halted at", em.station],
          ["AI priority", em.priority ?? "—"],
          [
            "Doctor",
            em.doctorStatus === "ACCEPTED"
              ? em.respondingDoctor?.name ?? "Accepted"
              : em.doctorStatus === "PENDING"
                ? "Notified…"
                : em.doctorStatus === "DECLINED"
                  ? "Declined"
                  : "No response",
          ],
        ].map(([k, v]) => (
          <div key={k} className="min-w-0">
            <dt className="text-[10px] uppercase tracking-[0.16em] text-navy-foreground/55">{k}</dt>
            <dd className="mt-0.5 truncate font-display text-lg font-semibold">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-5 border-t border-navy-foreground/15 pt-4 text-sm text-navy-foreground/80">{response}</p>
    </section>
  );
}

function EmergencyForm() {
  const j = useJourney();
  const a = j.account!;
  const [typeId, setTypeId] = useState<string>("chest");
  const [symptoms, setSymptoms] = useState("");
  const [forSelf, setForSelf] = useState(true);
  const [otherName, setOtherName] = useState("");
  const [otherAge, setOtherAge] = useState("");
  const [otherCoach, setOtherCoach] = useState(a.coach);
  const [otherSeat, setOtherSeat] = useState("");
  const [relation, setRelation] = useState("");

  return (
    <Panel title="Tell us what is happening">
      <p className="text-sm text-muted-foreground">A few quick details help Rail Chikitsak prioritise the response.</p>

      <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Who needs help?</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => setForSelf(true)}
          className={`rounded-lg border px-4 py-3.5 text-left transition-colors ${
            forSelf ? "border-critical bg-critical/8" : "border-border hover:bg-muted/50"
          }`}
        >
          <span className="block text-sm font-medium">Myself</span>
          <span className="block text-xs text-muted-foreground">
            {a.name} · coach {a.coach}, seat {a.seat}
          </span>
        </button>
        <button
          onClick={() => setForSelf(false)}
          className={`rounded-lg border px-4 py-3.5 text-left transition-colors ${
            !forSelf ? "border-critical bg-critical/8" : "border-border hover:bg-muted/50"
          }`}
        >
          <span className="block text-sm font-medium">Someone else</span>
          <span className="block text-xs text-muted-foreground">
            Raise this SOS for another passenger who cannot use the app
          </span>
        </button>
      </div>

      {!forSelf ? (
        <div className="mt-4 grid gap-3 rounded-lg border border-border bg-muted/40 p-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="other-name" className="text-sm font-medium">
              Passenger name (if known)
            </label>
            <Input
              id="other-name"
              value={otherName}
              onChange={(e) => setOtherName(e.target.value)}
              placeholder="e.g. Elderly man in the next bay"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="other-age" className="text-sm font-medium">
              Approx. age
            </label>
            <Input
              id="other-age"
              inputMode="numeric"
              value={otherAge}
              onChange={(e) => setOtherAge(e.target.value)}
              placeholder="e.g. 60"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="other-relation" className="text-sm font-medium">
              Your relation
            </label>
            <Input
              id="other-relation"
              value={relation}
              onChange={(e) => setRelation(e.target.value)}
              placeholder="Co-passenger / family"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="other-coach" className="text-sm font-medium">
              Their coach
            </label>
            <Input id="other-coach" value={otherCoach} onChange={(e) => setOtherCoach(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="other-seat" className="text-sm font-medium">
              Their seat
            </label>
            <Input
              id="other-seat"
              value={otherSeat}
              onChange={(e) => setOtherSeat(e.target.value)}
              placeholder="e.g. 44"
            />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Responders will be sent to this location and will know you raised the alert.
          </p>
        </div>
      ) : null}

      <p className="mt-6 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Emergency type</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {EMERGENCY_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setTypeId(t.id)}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition-colors ${
              typeId === t.id ? "border-critical bg-critical/8" : "border-border hover:bg-muted/50"
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            <span className="text-sm font-medium">{t.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-6 space-y-2">
        <label htmlFor="symptoms" className="text-sm font-medium">
          Symptoms
        </label>
        <Textarea
          id="symptoms"
          rows={3}
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          placeholder="Describe what the passenger is experiencing"
        />
      </div>
      <Button
        className="mt-5 h-12 w-full bg-critical text-base text-on-priority hover:bg-critical/90 sm:w-auto sm:px-10"
        onClick={() =>
          j.submitEmergency({
            typeId,
            symptoms: symptoms || "Chest pain and breathlessness",
            patient: {
              forSelf,
              name: otherName,
              ...(Number(otherAge) ? { age: Number(otherAge) } : {}),
              coach: otherCoach,
              seat: otherSeat,
              relation,
            },
          })
        }
      >
        Submit emergency
      </Button>
    </Panel>
  );
}

const TRIAGE_STEPS = ["Processing emergency report", "Evaluating symptoms", "Determining priority", "Preparing response"];

function TriageAnimation() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setStep((s) => Math.min(s + 1, TRIAGE_STEPS.length)), 620);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="rounded-xl border border-border bg-navy p-8 text-navy-foreground">
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-navy-foreground/60">Rail Chikitsak</p>
      <h2 className="mt-2 font-display text-2xl font-semibold">Analysing emergency information…</h2>
      <ul className="mt-6 space-y-3">
        {TRIAGE_STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-sm">
            {i < step ? (
              <Check className="h-4 w-4 text-accent" />
            ) : (
              <span className="h-3.5 w-3.5 animate-pulse rounded-full border border-navy-foreground/40" />
            )}
            <span className={i < step ? "" : "text-navy-foreground/55"}>{s}</span>
          </li>
        ))}
      </ul>
      <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-navy-foreground/15">
        <motion.div
          className="h-full bg-accent"
          animate={{ width: `${(step / TRIAGE_STEPS.length) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </section>
  );
}

const CALM_LINES = [
  "I'm Asha, your Rail Chikitsak care companion. I'm right here with you.",
  "Breathe in slowly for 4 seconds… hold… and out for 6. Let's do that together.",
  "Help is already moving. You don't have to do anything except stay comfortable.",
  "Loosen tight clothing, stay seated and keep your head supported.",
  "If someone is nearby, ask them to stay with you until the responder arrives.",
  "You're doing well. Every second counts and every one of them is being used.",
];

function CalmAssistant() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % CALM_LINES.length), 4200);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="overflow-hidden rounded-xl border border-accent/30 bg-accent/6 p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent/15 text-xl">👩‍⚕️</span>
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Asha · Rail Chikitsak calm assistant
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-2 font-display text-lg leading-snug"
            >
              {CALM_LINES[i]}
            </motion.p>
          </AnimatePresence>
          <p className="mt-3 text-[11px] text-muted-foreground">
            Guided reassurance only — it does not replace medical advice.
          </p>
        </div>
      </div>
    </section>
  );
}

function RespondersCard() {
  const em = useJourney().emergency!;
  return (
    <Panel title="Onboard responders alerted">
      <ul className="space-y-3">
        {em.notifiedDoctors.map((d) => {
          const accepted = em.respondingDoctor?.name === d.name;
          const noneAvailable = em.doctorStatus === "NO_RESPONSE" || em.doctorStatus === "DECLINED";
          return (
            <li key={d.name} className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
              <span className="min-w-0">
                <span className="block truncate font-medium">{d.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {d.specialization} · coach {d.coach} · seat {d.seat}
                </span>
              </span>
              <Tag tone={accepted ? "accent" : noneAvailable ? "critical" : "muted"}>
                {accepted ? "Responding" : noneAvailable ? "Unavailable" : "Notified"}
              </Tag>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/* ------------------------------------------------------------------ history */

function HistoryTab() {
  const j = useJourney();
  return (
    <div className="space-y-6">
      <SectionHeading title="Emergency history" description="Every medical SOS raised from your Rail Chikitsak account." />

      {j.history.length === 0 ? (
        <Panel>
          <div className="py-10 text-center">
            <Clock className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No emergencies recorded yet.</p>
          </div>
        </Panel>
      ) : (
        <Panel action={<Button variant="ghost" size="sm" className="text-muted-foreground" onClick={j.clearHistory}>Clear</Button>} title="Records">
          <ul className="divide-y divide-border">
            {j.history.map((r) => (
              <li key={r.id} className="grid gap-1 py-4 first:pt-0 last:pb-0 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:gap-5">
                <span className="font-mono text-xs text-muted-foreground">
                  {new Date(r.at).toLocaleString("en-GB", { hour12: false })}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    {r.type} · {r.station}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {r.doctor ? `Attended by ${r.doctor}` : "No onboard doctor"}
                    {r.hospital ? ` · ${r.hospital}` : ""}
                  </span>
                </span>
                <Tag tone={r.priority === "CRITICAL" || r.priority === "HIGH" ? "critical" : "muted"}>
                  {r.priority} · {r.outcome}
                </Tag>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- feedback */

function FeedbackTab() {
  const { feedback, reports } = useTrust();
  const j = useJourney();
  const [reportOpen, setReportOpen] = useState(false);
  const lastCase = j.emergency?.id ?? j.history[0]?.id ?? "RC-EMG-0000";
  const activeReview = useMemo(
    () => reports.find((r) => r.reporterRole === "passenger" && (r.status === "SUBMITTED" || r.status === "UNDER_REVIEW")),
    [reports],
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Feedback & reports"
        description="Share how a response went, or raise a concern. Concerns are reviewed before any action is taken."
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <Panel title="Raise a concern">
          <p className="text-sm text-muted-foreground">
            If a response was inappropriate or unprofessional, report the case for review.
          </p>
          <Button variant="outline" className="mt-5 w-full" onClick={() => setReportOpen(true)}>
            Report an issue
          </Button>
        </Panel>
        <Panel title="Your feedback">
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
          ) : (
            <ul className="space-y-3">
              {feedback.map((f) => (
                <li key={f.id} className="border-b border-border pb-3 text-sm last:border-0 last:pb-0">
                  <p className="font-medium">{f.rating}</p>
                  <p className="text-xs text-muted-foreground">
                    {f.emergencyId} · {new Date(f.at).toLocaleDateString("en-GB")}
                  </p>
                  {f.note ? <p className="mt-1 text-muted-foreground">{f.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {activeReview ? <TrustReviewCard report={activeReview} /> : null}

      <ReportsSection />

      <ReportDialog
        emergencyId={lastCase}
        reporterRole="passenger"
        open={reportOpen}
        onOpenChange={setReportOpen}
        onSubmitted={() => toast.success("Report submitted — it is now under review")}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ profile */

function ProfileTab() {
  const a = useJourney().account!;
  const { trust } = useTrust();
  const { t: ti } = useI18n();

  return (
    <div className="space-y-6">
      <SectionHeading title="Profile" description="Medical details shared with responders during an emergency." />

      <Panel title="Passenger">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            ["Name", a.name],
            ["Age", a.age ? String(a.age) : "—"],
            ["Blood group", a.bloodGroup ?? "—"],
            ["Mobile", a.mobile],
            ["Emergency contact", a.emergencyContact ?? "—"],
            ["Allergies", a.allergies ?? "None recorded"],
            ["Train", TRAIN],
            ["Coach", a.coach],
            ["Seat", a.seat],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k}</p>
              <p className="mt-0.5 truncate text-sm font-medium">{v}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title={ti("lang.label")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{ti("settings.language.desc")}</p>
          <LanguageSwitcher />
        </div>
      </Panel>

      <Panel title="Account standing" action={<TrustBadge />}>
        <div className="grid grid-cols-3 gap-6">
          <Stat value={String(trust.score)} label="Trust score" />
          <Stat value={String(trust.emergencyRequests)} label="Emergency requests" />
          <Stat value={String(trust.successfulResponses)} label="Successful responses" tone="accent" />
        </div>
      </Panel>
    </div>
  );
}

/* ---------------------------------------------------------------- completed */

function JourneyCompleted() {
  const j = useJourney();
  return (
    <Panel className="mx-auto max-w-2xl">
      <div className="py-6 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
          className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent text-accent-foreground"
        >
          <Check className="h-7 w-7" />
        </motion.div>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight">Journey completed</h1>
        <p className="mt-1.5 text-muted-foreground">You have reached Mumbai Central safely.</p>
        <Button className="mt-8 h-11 px-8" onClick={j.start}>
          Start new journey
        </Button>
      </div>
    </Panel>
  );
}
