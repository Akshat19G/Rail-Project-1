import { motion } from "motion/react";
import { toast } from "sonner";
import { Hospital, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel, Tag } from "@/components/railcare/shell";
import { STATIONS, TRAIN, useJourney } from "@/lib/railcare-journey";
import heroTrain from "@/assets/hero-train.jpg";

export function TriageResult() {
  const em = useJourney().emergency!;
  const critical = em.priority === "CRITICAL" || em.priority === "HIGH";
  return (
    <Panel title="AI-assisted triage" action={<Tag>{em.type ?? "—"}</Tag>}>
      <p className={`font-display text-3xl font-semibold tracking-tight ${critical ? "text-critical" : "text-medium"}`}>
        {em.priority}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{em.triageReason}</p>
      <p className="mt-3 text-xs text-muted-foreground">AI-assisted triage. This is not a medical diagnosis.</p>
    </Panel>
  );
}

export function HospitalPanel({ hospital }: { hospital: { name: string; contact: string; ambulance: string } }) {
  const em = useJourney().emergency!;
  return (
    <Panel title="Hospital response" action={<Tag tone="critical">Alerted</Tag>}>
      <h3 className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight">
        <Hospital className="h-4 w-4 shrink-0 text-chart-1" /> {hospital.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">Nearest facility to {em.station}</p>

      {em.escalationReason ? (
        <p className="mt-4 rounded-lg border border-critical/25 bg-critical/6 px-4 py-3 text-sm">{em.escalationReason}</p>
      ) : null}

      <dl className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
        {[
          ["Status", "Alerted"],
          ["Ambulance", em.ambulanceStatus === "READY" ? "Ready" : "Preparing"],
          ["Unit", hospital.ambulance],
          ["Contact", hospital.contact],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">{k}</dt>
            <dd className="mt-0.5 truncate text-sm font-medium">{v}</dd>
          </div>
        ))}
      </dl>

      <Button
        variant="outline"
        size="sm"
        className="mt-5 gap-2"
        onClick={() => toast.info("Connecting to the hospital emergency line…")}
      >
        <Phone className="h-3.5 w-3.5" /> Call hospital
      </Button>
    </Panel>
  );
}

/** Premium journey card with an image, route overlay and animated progress. */
export function JourneyCard({ coach, seat, label = "Current journey" }: { coach: string; seat: string; label?: string }) {
  const j = useJourney();
  const alert = j.phase === "emergency";
  const alertIndex = j.emergency ? STATIONS.indexOf(j.emergency.station) : -1;

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative h-40 sm:h-48">
        <img src={heroTrain} alt="Express train travelling between Pune and Mumbai" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-navy/72" />
        <div className="absolute inset-0 flex flex-col justify-between p-6 text-navy-foreground">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] opacity-70">{label}</p>
              <p className="mt-1 font-display text-xl font-semibold tracking-tight">{TRAIN}</p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                alert ? "border-critical/60 text-critical" : "border-accent/50 text-accent"
              }`}
            >
              <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${alert ? "bg-critical" : "bg-accent"}`} />
              {alert ? "Halted · emergency" : "Journey active"}
            </span>
          </div>
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm opacity-80">Pune Central → Mumbai Central</p>
              <p className="truncate font-display text-2xl font-semibold tracking-tight">
                {alert && alertIndex >= 0 ? STATIONS[alertIndex] : j.currentStation}
              </p>
            </div>
            <p className="shrink-0 font-mono text-xs opacity-80">
              Coach {coach} · Seat {seat}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={`h-full rounded-full ${alert ? "bg-critical" : "bg-accent"}`}
            animate={{ width: `${j.progress}%` }}
            transition={{ ease: "linear", duration: 0.15 }}
          />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs text-muted-foreground">
          <span>{alert ? `Train halted at ${j.currentStation}` : `Next station · ${j.nextStation ?? "Arriving"}`}</span>
          <span className="font-mono tabular-nums">{j.progress}% complete</span>
        </div>
      </div>
    </section>
  );
}
