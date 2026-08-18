import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, ChevronDown, Circle, LogOut, RotateCcw, Settings2, TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { STATIONS, TRAIN, useJourney } from "@/lib/railcare-journey";
import { BrandMark } from "@/components/railcare/logo";

export function TopBar({ subtitle }: { subtitle: string }) {
  const j = useJourney();
  const navigate = useNavigate();
  const emergency = j.phase === "emergency";

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 sm:px-8 md:grid-cols-3">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <BrandMark className="h-9 w-9" />
          <span className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold tracking-tight">Rail Chikitsak</span>
            <span className="block truncate text-[11px] text-muted-foreground">{subtitle}</span>
          </span>
        </Link>
        <div className="hidden items-center justify-center gap-3 md:flex">
          <span className="font-mono text-xs text-muted-foreground">🚆 {TRAIN}</span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${
              emergency ? "border-critical/40 text-critical" : "border-accent/40 text-accent"
            }`}
          >
            <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${emergency ? "bg-critical" : "bg-accent"}`} />
            {emergency ? "EMERGENCY MODE" : "LIVE"}
          </span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <span className="hidden rounded-full border border-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground lg:inline">
            “Every second matters.”
          </span>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => {
              j.signOut();
              j.reset();
              void navigate({ to: "/auth", replace: true });
            }}
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </Button>
        </div>
      </div>
    </header>
  );
}

export function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 bg-card px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className="truncate font-display text-base font-semibold">{value}</p>
    </div>
  );
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-navy-foreground/55">{label}</p>
      <p className="truncate font-display text-lg font-semibold">{value}</p>
    </div>
  );
}

export function RailMap() {
  const j = useJourney();
  const alert = j.phase === "emergency";
  const liveIndex = j.stationIndex;
  const alertIndex = j.emergency ? STATIONS.indexOf(j.emergency.station) : -1;
  const pct = (j.elapsed / 60_000) * 100;

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-elevate sm:p-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Current location</p>
          <p className="mt-1 truncate font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {j.currentStation}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {alert && alertIndex >= 0 ? (
              <span className="inline-flex items-center gap-2 font-medium text-critical">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-critical/70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-critical" />
                </span>
                Train halted at {STATIONS[alertIndex]} · medical response underway
              </span>
            ) : j.nextStation ? (
              `Next station: ${j.nextStation}`
            ) : (
              "Arriving at destination"
            )}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium ${
            alert ? "border-critical/40 text-critical" : "border-accent/40 text-accent"
          }`}
        >
          {alert ? "HALTED · EMERGENCY" : "RUNNING"}
        </span>
      </div>

      <div className="relative mt-12 pb-2">
        <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-muted" />
        <motion.div
          className={`absolute left-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full ${alert ? "bg-critical" : "bg-accent"}`}
          animate={{ width: `${pct}%` }}
          transition={{ ease: "linear", duration: 0.12 }}
        />
        <motion.div
          className="absolute top-1/2 z-10 -translate-x-1/2 -translate-y-[130%]"
          animate={{ left: `${pct}%` }}
          transition={{ ease: "linear", duration: 0.12 }}
        >
          <span
            className={`grid h-9 w-9 place-items-center rounded-full border shadow-elevate ${
              alert ? "border-critical/50 bg-critical text-on-priority" : "border-border bg-card text-navy"
            }`}
          >
            <TrainFront className="h-4 w-4" />
          </span>
        </motion.div>

        <div className="relative flex justify-between">
          {STATIONS.map((s, i) => {
            const passed = i < liveIndex;
            const active = i === liveIndex;
            const blinking = i === alertIndex;
            return (
              <div key={s} className="flex min-w-0 flex-1 flex-col items-center">
                <span
                  className={`relative z-[1] h-3.5 w-3.5 rounded-full border-2 transition-colors ${
                    blinking
                      ? "border-critical bg-critical"
                      : active
                        ? "border-accent bg-accent"
                        : passed
                          ? "border-accent bg-accent/60"
                          : "border-border bg-card"
                  }`}
                >
                  {blinking || active ? (
                    <span
                      className={`absolute inset-0 animate-ping rounded-full ${blinking ? "bg-critical/60" : "bg-accent/50"}`}
                    />
                  ) : null}
                </span>
                <span
                  className={`mt-3 max-w-[8ch] text-center text-[11px] leading-tight sm:max-w-none sm:text-xs ${
                    blinking
                      ? "animate-pulse font-semibold text-critical"
                      : active
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground"
                  }`}
                >
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ProgressCard() {
  const j = useJourney();
  const alert = j.phase === "emergency";
  const alertIndex = j.emergency ? STATIONS.indexOf(j.emergency.station) : -1;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Journey progress</p>
        <p className="mt-2 font-display text-5xl font-semibold tabular-nums leading-none">{j.progress}%</p>
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <motion.div
            className={`h-full rounded-full ${alert ? "bg-critical" : "bg-accent"}`}
            animate={{ width: `${j.progress}%` }}
            transition={{ ease: "linear", duration: 0.12 }}
          />
        </div>
        <ul className="mt-5 space-y-2 text-sm">
          {STATIONS.map((s, i) => {
            const passed = i < j.stationIndex;
            const active = i === j.stationIndex;
            const blinking = i === alertIndex;
            return (
              <li key={s} className="flex items-center gap-3">
                {blinking ? (
                  <span className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-critical" />
                ) : passed ? (
                  <Check className="h-4 w-4 shrink-0 text-accent" />
                ) : active ? (
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                )}
                <span
                  className={
                    blinking ? "font-semibold text-critical" : active ? "font-semibold" : "text-muted-foreground"
                  }
                >
                  {s}
                  {blinking ? " · train halted here" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-2xl border border-border bg-navy p-6 text-navy-foreground">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-navy-foreground/60">Train status</p>
        <p className={`mt-2 font-display text-2xl font-semibold ${alert ? "text-critical" : ""}`}>
          {alert ? "🛑 Halted · emergency onboard" : "Running normally"}
        </p>
        <dl className="mt-6 grid grid-cols-2 gap-y-5">
          <Metric label="Current" value={j.currentStation} />
          <Metric label={alert ? "Halted at" : "Next"} value={alert && alertIndex >= 0 ? STATIONS[alertIndex]! : (j.nextStation ?? "—")} />
          <Metric label="Complete" value={`${j.progress}%`} />
          <Metric label="Time remaining" value={`${j.remaining} sec`} />
        </dl>
        <p className="mt-6 text-[11px] text-navy-foreground/55">
          Live journey tracking — the train holds at the station during an emergency.
        </p>
      </div>
    </div>
  );
}

export function TimelineCard() {
  const j = useJourney();
  return (
    <section className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Emergency timeline</p>
      <div className="relative mt-5 pl-6">
        <div className="absolute bottom-2 left-[6px] top-2 w-px bg-border" />
        <AnimatePresence initial={false}>
          {j.timeline.map((e, i) => (
            <motion.div
              key={`${e.label}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="relative pb-5 last:pb-0"
            >
              <span className="absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-accent bg-card" />
              <p className="font-mono text-[11px] text-muted-foreground">{e.time}</p>
              <p className="text-sm font-medium">✓ {e.label}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

export function DemoPanel() {
  const j = useJourney();
  const [open, setOpen] = useState(false);
  const isDoctor = j.account?.role === "doctor";

  return (
    <div className="fixed bottom-4 right-4 z-40 w-[19rem] max-w-[calc(100vw-2rem)]">
      <div className="overflow-hidden rounded-xl border border-border bg-card/95 shadow-elevate backdrop-blur">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
        >
          <Settings2 className="h-3.5 w-3.5" /> Controls
          <ChevronDown className={`ml-auto h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border"
            >
              <div className="space-y-3 p-4">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={j.start}>
                    Start journey
                  </Button>
                  <Button size="sm" variant="secondary" onClick={j.paused ? j.resume : j.pause}>
                    {j.paused ? "Resume" : "Pause"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={j.reset} className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> Reset
                  </Button>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Jump to station</p>
                  <div className="flex flex-wrap gap-1.5">
                    {STATIONS.map((s, i) => (
                      <button
                        key={s}
                        onClick={() => j.jumpTo(i)}
                        className="rounded-md border border-border px-2 py-1 text-[11px] transition-colors hover:bg-muted"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-1.5">
                  {isDoctor ? (
                    <>
                      <Button size="sm" variant="outline" className="w-full" onClick={j.triggerIncomingEmergency}>
                        Trigger incoming emergency
                      </Button>
                      <Button size="sm" variant="outline" className="w-full" onClick={j.acceptEmergency}>
                        Accept emergency
                      </Button>
                      <Button size="sm" variant="outline" className="w-full" onClick={j.fastForwardTimer}>
                        ⏩ Fast-forward response timer
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="w-full" onClick={j.triggerSos}>
                      Trigger SOS
                    </Button>
                  )}
                </div>

              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
