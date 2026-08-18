import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Activity,
  AlertTriangle,
  Award,
  Check,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  Settings as SettingsIcon,
  ShieldAlert,
  Siren,
  Stethoscope,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { RailMap, TimelineCard } from "@/components/railcare/ui";
import { DashboardShell, Panel, SectionHeading, Stat, Tag, type NavItem } from "@/components/railcare/shell";
import { HospitalPanel, JourneyCard, TriageResult } from "@/components/railcare/emergency-panels";
import { ImpactCard, RewardsCard, RewardsSection } from "@/components/railcare/rewards";
import { ReportDialog, ReportsSection } from "@/components/railcare/reports";
import { SettingsSection } from "@/components/railcare/settings";
import { useTrust } from "@/lib/railcare-trust";
import { playAlertTone, useSettings } from "@/lib/railcare-settings";
import { useI18n } from "@/lib/railcare-i18n";
import { LanguageSwitcher } from "@/components/railcare/language-switcher";
import { formatCountdown, HOSPITALS, RESPONSE_WINDOW, TRAIN, useJourney } from "@/lib/railcare-journey";

export const Route = createFileRoute("/doctor")({
  head: () => ({
    meta: [
      { title: "Responder Console — Rail Chikitsak Onboard Doctor" },
      {
        name: "description",
        content:
          "Onboard responder console: incoming medical emergencies, a 2-minute response window, medical assessment, hospital escalation, impact metrics and Rail Chikitsak rewards.",
      },
      { property: "og:title", content: "Responder Console — Rail Chikitsak" },
      {
        property: "og:description",
        content: "Respond to onboard medical emergencies and track your responder impact and rewards.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DoctorDashboard,
});

type Tab = "overview" | "emergency" | "rewards" | "impact" | "reports" | "profile" | "settings";

function useNav(): NavItem<Tab>[] {
  const { t } = useI18n();
  return [
    { id: "overview", label: t("nav.overview"), icon: LayoutDashboard },
    { id: "emergency", label: t("nav.emergency"), icon: Siren },
    { id: "rewards", label: t("nav.rewards"), icon: Award },
    { id: "impact", label: t("nav.impact"), icon: Activity },
    { id: "reports", label: t("nav.reports"), icon: ShieldAlert },
    { id: "profile", label: t("nav.profile"), icon: User },
    { id: "settings", label: t("nav.settings"), icon: SettingsIcon },
  ];
}

function DoctorDashboard() {
  const j = useJourney();
  const navigate = useNavigate();
  const { available } = useTrust();
  const { settings } = useSettings();
  const NAV = useNav();
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!j.authReady) return;
    if (!j.account) void navigate({ to: "/auth", replace: true });
    else if (j.account.role !== "doctor") void navigate({ to: "/journey", replace: true });
    else if (j.phase === "idle") j.start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [j.authReady, j.account]);

  // A passenger SOS arrives automatically shortly after the journey starts.
  useEffect(() => {
    if (j.account?.role !== "doctor" || j.phase !== "running" || j.emergency || !available) return;
    const id = setTimeout(() => {
      j.triggerIncomingEmergency();
      setTab("emergency");
      if (settings.alertSound) playAlertTone();
      if (settings.toastAlerts) toast.error(`Incoming medical emergency on ${TRAIN}`);
    }, 8000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [j.account?.role, j.phase, j.emergency, available]);

  if (!j.authReady || j.account?.role !== "doctor") {
    return <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <DashboardShell nav={NAV} active={tab} onNavigate={setTab} workspace="Responder console" status={<AvailabilityToggle />}>
      <AnimatePresence mode="wait">
        <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {tab === "overview" ? <OverviewTab onNavigate={setTab} /> : null}
          {tab === "emergency" ? <EmergencyTab /> : null}
          {tab === "rewards" ? <RewardsSection /> : null}
          {tab === "impact" ? <ImpactTab /> : null}
          {tab === "reports" ? <ReportsSection /> : null}
          {tab === "profile" ? <ProfileTab /> : null}
          {tab === "settings" ? <SettingsSection /> : null}
        </motion.div>
      </AnimatePresence>
    </DashboardShell>
  );
}

function AvailabilityToggle() {
  const { available, setAvailable } = useTrust();
  return (
    <label className="flex items-center gap-2.5 text-xs">
      <span className={available ? "text-accent" : "text-muted-foreground"}>
        {available ? "Available" : "Unavailable"}
      </span>
      <button
        role="switch"
        aria-checked={available}
        aria-label="Responder availability"
        onClick={() => {
          const v = !available;
          setAvailable(v);
          toast.message(v ? "You are available for emergencies" : "You will not receive new emergencies");
        }}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition-colors ${
          available ? "border-accent bg-accent" : "border-border bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-background transition-all ${
            available ? "left-[1.15rem]" : "left-0.5"
          }`}
        />
      </button>
    </label>
  );
}

/* ----------------------------------------------------------------- overview */

function OverviewTab({ onNavigate }: { onNavigate: (t: Tab) => void }) {
  const j = useJourney();
  const a = j.account!;
  const { available, impact } = useTrust();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Responder console</p>
          <h1 className="mt-1.5 font-display text-3xl font-semibold tracking-tight">{a.name}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {a.specialization} · coach {a.coach} · seat {a.seat}
          </p>
        </div>
        <Tag tone={available ? "accent" : "muted"}>{available ? "On duty" : "Off duty"}</Tag>
      </div>

      <Panel title="Response performance">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat value={String(impact.assisted)} label="Emergencies assisted" />
          <Stat value={`${impact.reliability}%`} label="Reliability" tone="accent" />
          <Stat value={String(impact.escalations)} label="Hospital escalations" />
          <Stat value={String(impact.successful)} label="Successful outcomes" tone="accent" />
        </div>
      </Panel>

      <JourneyCard coach={a.coach} seat={a.seat} label="On duty aboard" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {j.emergency ? (
            <Panel title="Active emergency" action={<Tag tone="critical">Action required</Tag>}>
              <p className="font-display text-xl font-semibold tracking-tight">
                {j.emergency.symptoms} · coach {j.emergency.coach}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground">Case {j.emergency.id} · halted at {j.emergency.station}</p>
              <Button className="mt-5" onClick={() => onNavigate("emergency")}>
                Open emergency
              </Button>
            </Panel>
          ) : (
            <IdleCard />
          )}
          <RailMap />
        </div>
        <div className="space-y-5">
          <RewardsCard onOpen={() => onNavigate("rewards")} />
          <ImpactCard />
        </div>
      </div>
    </div>
  );
}

function IdleCard() {
  const { available } = useTrust();
  return (
    <Panel>
      <div className="py-8 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-lg bg-accent/12 text-accent">
          <Stethoscope className="h-5 w-5" />
        </span>
        <h2 className="mt-4 font-display text-xl font-semibold tracking-tight">No active emergencies</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {available
            ? `You are marked available on ${TRAIN}. A passenger SOS appears here instantly with a 2-minute response window.`
            : "You are off duty. Turn availability on to receive incoming emergencies."}
        </p>
      </div>
    </Panel>
  );
}

/* ---------------------------------------------------------------- emergency */

function EmergencyTab() {
  const j = useJourney();
  if (!j.emergency) {
    return (
      <div className="space-y-6">
        <SectionHeading title="Emergency" description="Incoming passenger emergencies appear here automatically." />
        <IdleCard />
      </div>
    );
  }
  return <EmergencyConsole />;
}

function EmergencyConsole() {
  const j = useJourney();
  const em = j.emergency!;
  const hospital = HOSPITALS[em.hospitalStation];
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border border-critical/35 bg-card shadow-emergency">
        <div className="bg-critical px-6 py-5 text-on-priority">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] opacity-80">Incoming</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Medical emergency</h1>
          <p className="mt-1.5 text-sm opacity-90">
            {em.symptoms} · reported in coach {em.coach}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3 lg:grid-cols-6">
          {[
            ["Emergency ID", em.id],
            ["Train", TRAIN],
            ["Passenger", em.passenger],
            ["Age", em.age ? `${em.age} yrs` : "Not known"],
            ["Coach", em.coach],
            ["Seat", em.seat],
            ["Halted at", em.station],
            ...(em.forSelf
              ? []
              : [["Reported by", `${em.reportedBy}${em.relation ? ` · ${em.relation}` : ""}`]]),
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 bg-card px-5 py-4">
              <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k}</dt>
              <dd className="mt-0.5 truncate font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-5">
          {em.doctorStatus === "PENDING" ? <ResponseWindow /> : <ResponseOutcome />}
          <TriageResult />
          {em.doctorStatus === "ACCEPTED" ? <AssessmentPanel /> : null}
          {em.assessment === "MONITOR" ? <MonitoringPanel /> : null}
          {em.hospitalStatus === "ALERTED" ? <HospitalPanel hospital={hospital} /> : null}

          {em.doctorStatus === "ACCEPTED" ? (
            <Panel title="Case integrity">
              <p className="text-sm text-muted-foreground">
                If you believe this emergency request was intentionally false or abusive, report it for review. Reports
                never penalise a passenger automatically.
              </p>
              <Button variant="outline" className="mt-5 gap-2" onClick={() => setReportOpen(true)}>
                <ShieldAlert className="h-4 w-4" /> Report misuse
              </Button>
            </Panel>
          ) : null}
        </div>
        <TimelineCard />
      </div>

      <ReportDialog
        emergencyId={em.id}
        reporterRole="doctor"
        open={reportOpen}
        onOpenChange={setReportOpen}
        onSubmitted={() => toast.success("Report submitted — Rail Chikitsak Trust will review this case")}
      />
    </div>
  );
}

function ResponseWindow() {
  const j = useJourney();
  const { earnPoints } = useTrust();
  const em = j.emergency!;
  const urgent = em.countdown <= 30;
  const pct = (em.countdown / RESPONSE_WINDOW) * 100;

  return (
    <section
      className={`rounded-xl border p-6 transition-colors ${urgent ? "border-critical/50 bg-critical/6" : "border-border bg-card"}`}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Response window</p>
          <p className="mt-1 text-sm text-muted-foreground">Please respond within 2 minutes.</p>
          {urgent ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-lg border border-critical/40 bg-critical/10 px-3 py-1.5 text-sm font-medium text-critical">
              <AlertTriangle className="h-4 w-4" /> Response window ending
            </p>
          ) : null}
        </div>
        <motion.p
          key={urgent ? "urgent" : "calm"}
          animate={urgent ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ repeat: urgent ? Infinity : 0, duration: 1 }}
          className={`shrink-0 font-display text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl ${
            urgent ? "text-critical" : ""
          }`}
        >
          {formatCountdown(em.countdown)}
        </motion.p>
      </div>

      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full ${urgent ? "bg-critical" : "bg-accent"}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          className="h-12 flex-1 gap-2 bg-accent text-base text-accent-foreground hover:bg-accent/90 sm:flex-none sm:px-10"
          onClick={() => {
            j.acceptEmergency();
            earnPoints("Emergency accepted", 50);
            toast.success("Emergency accepted · +50 Rail Chikitsak Points");
          }}
        >
          <HeartPulse className="h-4 w-4" /> Accept emergency
        </Button>
        <Button variant="outline" className="h-12 flex-1 text-base sm:flex-none sm:px-10" onClick={j.declineEmergency}>
          Decline
        </Button>
      </div>
    </section>
  );
}

function ResponseOutcome() {
  const em = useJourney().emergency!;
  const accepted = em.doctorStatus === "ACCEPTED";
  return (
    <section className={`rounded-xl border p-6 ${accepted ? "border-accent/40 bg-accent/8" : "border-critical/40 bg-critical/6"}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Doctor response</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${accepted ? "text-accent" : "text-critical"}`}>
        {accepted ? "Emergency accepted" : em.doctorStatus === "DECLINED" ? "Declined — escalated" : "No response"}
      </p>
      {!accepted ? <p className="mt-2 text-sm text-muted-foreground">Automatic hospital escalation triggered.</p> : null}
    </section>
  );
}

const CHOICES = [
  { id: "HOSPITAL", label: "Hospital required", hint: "Hospital team prepares at the halt station." },
  { id: "MONITOR", label: "Monitor / first aid", hint: "No hospital escalation; monitoring onboard." },
  { id: "CRITICAL", label: "Critical — immediate response", hint: "Immediate hospital and ambulance response." },
] as const;

function AssessmentPanel() {
  const j = useJourney();
  const { earnPoints } = useTrust();
  const em = j.emergency!;
  if (em.assessment) return null;

  return (
    <Panel title="Medical assessment">
      <p className="text-sm text-muted-foreground">Does the passenger require hospital assistance?</p>
      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        {CHOICES.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              j.setAssessment(c.id);
              earnPoints("Assessment completed", 30);
            }}
            className="rounded-lg border border-border px-4 py-4 text-left transition-colors hover:border-foreground/25 hover:bg-muted/50"
          >
            <p className="font-medium">{c.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function MonitoringPanel() {
  const j = useJourney();
  const em = j.emergency!;
  const escalated = em.hospitalStatus === "ALERTED";
  const steps = [
    "SOS received",
    "AI triage completed",
    "Doctor accepted",
    "Medical assessment completed",
    "First aid / monitoring recommended",
    ...(escalated ? ["Condition worsened — hospital called"] : []),
  ];
  return (
    <section className="rounded-xl border border-medium/40 bg-medium/8 p-6">
      <p className="font-display text-xl font-semibold">
        {escalated ? "Escalated from monitoring" : "Patient under monitoring"}
      </p>
      <ul className="mt-4 space-y-2 text-sm">
        {steps.map((s) => (
          <li key={s} className="flex items-center gap-2.5">
            <Check className="h-4 w-4 shrink-0 text-accent" /> {s}
          </li>
        ))}
      </ul>
      {escalated ? (
        <Tag tone="critical">Hospital alerted</Tag>
      ) : (
        <div className="mt-5 rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">
            If the condition worsens during monitoring, escalate to the hospital at the halt station.
          </p>
          <Button
            className="mt-3 h-11 gap-2 bg-critical px-6 text-on-priority hover:bg-critical/90"
            onClick={() => {
              j.escalateAfterMonitoring();
              toast.error("Hospital alerted — condition worsened during monitoring");
            }}
          >
            <Hospital className="h-4 w-4" /> Call hospital
          </Button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------- impact */

function ImpactTab() {
  const { impact, rewards } = useTrust();
  return (
    <div className="space-y-6">
      <SectionHeading
        title="Your impact"
        description="A record of the emergencies you responded to aboard Rail Chikitsak services."
      />
      <Panel>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <Stat value={String(impact.assisted)} label="Emergencies assisted" />
          <Stat value={`${impact.reliability}%`} label="Reliability" tone="accent" />
          <Stat value={String(impact.escalations)} label="Hospital escalations" />
          <Stat value={String(impact.successful)} label="Successful outcomes" tone="accent" />
        </div>
      </Panel>
      <div className="grid gap-5 sm:grid-cols-2">
        <ImpactCard />
        <Panel title="Recognition">
          <p className="font-display text-2xl font-semibold tracking-tight">{rewards.points} points</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Points recognise verified responses. They are a recognition programme, never a payment for medical care.
          </p>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ profile */

function ProfileTab() {
  const a = useJourney().account!;
  const { available, impact } = useTrust();
  const { t: ti } = useI18n();

  return (
    <div className="space-y-6">
      <SectionHeading title="Profile" description="Your responder identity shown to passengers during an emergency." />
      <Panel title="Responder" action={<Tag tone={available ? "accent" : "muted"}>{available ? "Available" : "Off duty"}</Tag>}>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            ["Name", a.name],
            ["Specialization", a.specialization ?? "—"],
            ["Mobile", a.mobile],
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
      <Panel title="Availability">
        <div className="flex items-center justify-between gap-6">
          <p className="text-sm text-muted-foreground">
            Only available responders receive incoming emergencies. You can change this at any time.
          </p>
          <AvailabilityToggle />
        </div>
      </Panel>
      <RedeemedRewardsPanel />

      <Panel title={ti("lang.label")}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">{ti("settings.language.desc")}</p>
          <LanguageSwitcher />
        </div>
      </Panel>

      <Panel title="Standing">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
          <Stat value={String(impact.assisted)} label="Responses" />
          <Stat value={`${impact.reliability}%`} label="Reliability" tone="accent" />
          <Stat value={String(impact.escalations)} label="Escalations" />
        </div>
      </Panel>
    </div>
  );
}

function RedeemedRewardsPanel() {
  const { redeemedRewards } = useTrust();
  const { t } = useI18n();
  return (
    <Panel
      title={t("profile.rewards")}
      action={<Tag tone={redeemedRewards.length ? "accent" : "muted"}>{redeemedRewards.length}</Tag>}
    >
      {redeemedRewards.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("profile.rewards.empty")}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {redeemedRewards.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-reward/35 bg-reward-surface px-4 py-3"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{r.name}</span>
                <span className="block font-mono text-[11px] tracking-wider text-muted-foreground">{r.code}</span>
              </span>
              <span className="shrink-0 font-mono text-xs text-reward">-{r.cost}</span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
