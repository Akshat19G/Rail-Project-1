import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Ambulance, ArrowRight, Brain, Hospital, ShieldCheck, Siren, Stethoscope, TrainFront } from "lucide-react";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/railcare/language-switcher";
import { useI18n } from "@/lib/railcare-i18n";
import heroTrain from "@/assets/hero-train.jpg";
import coachInterior from "@/assets/coach-interior.jpg";
import hospitalEmergency from "@/assets/hospital-emergency.jpg";
import railwayStaff from "@/assets/railway-staff.jpg";
import { BrandMark } from "@/components/railcare/logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rail Chikitsak — Every Second Matters on the Rails" },
      {
        name: "description",
        content:
          "Rail Chikitsak: one-tap medical SOS for railway passengers, AI-assisted triage and automatic hospital pre-alert.",
      },
      { property: "og:title", content: "Rail Chikitsak — Every Second Matters" },
      {
        property: "og:description",
        content: "AI-assisted medical emergency response for railway passengers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Nav />
      <Hero />
      <Stats />
      <Showcase />
      <How />
      <Features />
      <Story />
      <Reassurance />
      <Cta />
      <Footer />
    </div>
  );
}

function Nav() {
  const { t } = useI18n();
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto grid w-full max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark className="h-10 w-10" />
          <span className="truncate font-display text-base font-semibold tracking-tight text-navy-foreground">
            Rail Chikitsak
          </span>
        </div>
        <nav className="hidden items-center gap-7 justify-self-center text-sm text-navy-foreground/70 md:flex">
          <a href="#how" className="transition-colors hover:text-navy-foreground">{t("nav.how")}</a>
          <a href="#features" className="transition-colors hover:text-navy-foreground">{t("nav.features")}</a>
          <a href="#safety" className="transition-colors hover:text-navy-foreground">{t("nav.safety")}</a>
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher tone="inverted" />
          <Link to="/auth">
            <Button variant="ghost" className="text-navy-foreground hover:bg-navy-foreground/10 hover:text-navy-foreground">
              {t("nav.signin")}
            </Button>
          </Link>
          <Link to="/demo">
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">{t("hero.cta")}</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={heroTrain}
        alt="High-speed passenger train arriving at a modern railway platform at dusk"
        width={1600}
        height={1000}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-navy/82" />
      <div className="absolute inset-0 bg-[linear-gradient(to_top,var(--navy),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-[92vh] w-full max-w-6xl flex-col justify-center px-5 py-32 sm:px-8">
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-navy-foreground/25 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.2em] text-navy-foreground/80"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> “Help delayed is help denied.”
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="mt-7 max-w-4xl font-display text-5xl font-semibold leading-[1.02] tracking-tight text-navy-foreground sm:text-7xl"
        >
          {t("hero.title")}
          <span className="block text-accent">{t("hero.titleAccent")}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16 }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-navy-foreground/75"
        >
          {t("hero.body")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24 }}
          className="mt-10 flex flex-wrap items-center gap-4"
        >
          <Link to="/demo">
            <Button className="h-14 gap-2 bg-accent px-8 text-base font-semibold text-accent-foreground hover:bg-accent/90">
              {t("hero.get")} <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <a href="#how">
            <Button
              variant="outline"
              className="h-14 border-navy-foreground/25 bg-transparent px-8 text-base font-semibold text-navy-foreground hover:bg-navy-foreground/10"
            >
              {t("hero.explore")}
            </Button>
          </a>
          <span className="text-sm text-navy-foreground/60">Pune Central → Mumbai Central</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.34 }}
          className="mt-14 w-fit rounded-2xl border border-navy-foreground/15 bg-navy-foreground/8 px-6 py-5 backdrop-blur-xl"
        >
          <p className="flex items-center gap-2 font-display text-base font-semibold text-navy-foreground">
            <TrainFront className="h-4 w-4 text-accent" /> RC Express 2047
          </p>
          <p className="mt-1 inline-flex items-center gap-2 text-xs text-navy-foreground/70">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Journey active · Pune → Mumbai
          </p>
        </motion.div>
      </div>
    </section>
  );
}

const SHOWCASE = [
  {
    image: coachInterior,
    alt: "Interior of a modern passenger train coach",
    title: "When every second matters",
    body: "A passenger raises an SOS from their seat. The exact train position, coach and seat are captured instantly.",
    overlay: "Passenger emergency detected",
    chain: ["SOS", "AI", "HOSPITAL"],
  },
  {
    image: hospitalEmergency,
    alt: "Hospital emergency department entrance illuminated at dusk",
    title: "Medical response",
    body: "The mapped facility for the halt receives the case summary and prepares its emergency team in advance.",
    overlay: "Hospital alert ready",
    chain: ["TRIAGE", "ALERT", "AMBULANCE"],
  },
  {
    image: railwayStaff,
    alt: "Railway staff coordinating on a station platform at night",
    title: "Connected journey",
    body: "Every station along the route is tracked, so the nearest halt is always known.",
    overlay: "Current location identified",
    chain: ["PUNE", "LONAVALA", "MUMBAI"],
  },
];

function Showcase() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-24 sm:px-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">One tap changes everything</p>
      <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        A medical emergency doesn&apos;t wait for the next station.
      </h2>
      <p className="mt-5 max-w-2xl leading-relaxed text-muted-foreground">
        Rail Chikitsak turns a passenger&apos;s emergency into a coordinated response — identifying the train&apos;s current
        location, prioritising the situation, notifying onboard medical assistance, and escalating to a nearby medical
        facility when necessary.
      </p>
      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {SHOWCASE.map((s, i) => (
          <motion.article
            key={s.title}
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.55, delay: i * 0.08 }}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-elevate"
          >
            <div className="relative h-64 overflow-hidden">
              <img
                src={s.image}
                alt={s.alt}
                loading="lazy"
                width={1600}
                height={1000}
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-navy/45 transition-opacity duration-500 group-hover:bg-navy/70" />
              <div className="absolute inset-x-0 bottom-0 translate-y-3 p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="inline-flex items-center gap-2 rounded-full bg-critical px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-on-priority">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-on-priority" /> {s.overlay}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {s.chain.map((c, ci) => (
                    <span key={c} className="flex items-center gap-2">
                      <span className="rounded-md bg-navy-foreground/15 px-2 py-1 font-mono text-[10px] tracking-wider text-navy-foreground backdrop-blur">
                        {c}
                      </span>
                      {ci < s.chain.length - 1 ? <ArrowRight className="h-3 w-3 text-navy-foreground/70" /> : null}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: Siren, title: "One-tap SOS", body: "Immediate emergency activation from the passenger's seat." },
  { icon: Brain, title: "AI-assisted triage", body: "Prioritises reported symptoms into a clear response level." },
  { icon: TrainFront, title: "Smart train location", body: "Identifies the current station and the nearest halt." },
  { icon: Stethoscope, title: "Onboard medical response", body: "Gives an onboard doctor a defined 2-minute response window." },
  { icon: Hospital, title: "Automatic escalation", body: "No response? The mapped facility is alerted automatically." },
  { icon: Ambulance, title: "Medical readiness", body: "The emergency team prepares before the train reaches the halt." },
];

function Features() {
  return (
    <section id="features" className="border-y border-border bg-card">
      <div className="mx-auto w-full max-w-6xl scroll-mt-16 px-5 py-24 sm:px-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Product</p>
        <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Built for the minutes that decide the outcome.
        </h2>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="bg-card p-7"
            >
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy text-navy-foreground">
                <f.icon className="h-4 w-4" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "24/7", label: "Journey coverage" },
  { value: "7", label: "Stations tracked" },
  { value: "1 tap", label: "To trigger SOS" },
  { value: "< 10s", label: "Hospital alert" },
];

function Stats() {
  return (
    <section className="border-y border-border bg-card">
      <dl className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-px bg-border sm:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="bg-card px-6 py-8 text-center">
            <dt className="font-display text-4xl font-semibold tracking-tight">{s.value}</dt>
            <dd className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">{s.label}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const STEPS = [
  {
    icon: Siren,
    title: "One-tap medical SOS",
    body: "The passenger taps once. The exact train position, coach and seat are captured instantly.",
    image: coachInterior,
    alt: "Interior of a modern passenger train coach",
  },
  {
    icon: Brain,
    title: "AI-assisted triage",
    body: "Symptoms are analysed in seconds and assigned a priority level, so the right response is dispatched first.",
    image: railwayStaff,
    alt: "Railway staff coordinating on a station platform at night",
  },
  {
    icon: Hospital,
    title: "Hospital alerted early",
    body: "The nearest emergency facility receives train, coach, seat and symptom details before the train arrives.",
    image: hospitalEmergency,
    alt: "Hospital emergency department entrance illuminated at dusk",
  },
];

function How() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl scroll-mt-16 px-5 py-24 sm:px-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">How it works</p>
      <h2 className="mt-3 max-w-2xl font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        From a single tap to a waiting medical team.
      </h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <motion.article
            key={s.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group overflow-hidden rounded-2xl border border-border bg-card shadow-elevate"
          >
            <div className="relative h-44 overflow-hidden">
              <img
                src={s.image}
                alt={s.alt}
                loading="lazy"
                width={1600}
                height={1000}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-navy/35" />
              <span className="absolute left-4 top-4 grid h-9 w-9 place-items-center rounded-lg bg-navy text-navy-foreground">
                <s.icon className="h-4 w-4" />
              </span>
            </div>
            <div className="p-6">
              <p className="font-mono text-xs text-muted-foreground">0{i + 1}</p>
              <h3 className="mt-1 font-display text-xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Reassurance() {
  return (
    <section id="safety" className="scroll-mt-16 bg-navy py-24 text-navy-foreground">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 sm:px-8 lg:grid-cols-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-navy-foreground/55">
            Designed to reassure
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            Calm interface. Urgent response.
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-navy-foreground/70">
            Emergency products fail when they add panic. Rail Chikitsak keeps the passenger informed at every step — where
            the train stopped, who was alerted, and what happens next.
          </p>
        </div>
        <ul className="space-y-4">
          {[
            "Live station tracking through the whole journey",
            "Immediate train stop and location capture on SOS",
            "Priority-graded AI triage with plain-language reasoning",
            "Hospital and ambulance preparation shown step by step",
          ].map((t) => (
            <li key={t} className="flex items-start gap-3 rounded-xl border border-navy-foreground/12 px-5 py-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
              <span className="text-sm leading-relaxed text-navy-foreground/85">{t}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const CHAIN = ["Passenger", "SOS", "AI Triage", "Doctor", "Hospital", "Medical Response"];

function Story() {
  return (
    <section className="border-y border-border bg-card">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">The problem</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            When Every Second Matters
          </h2>
          <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
            Medical emergencies don't wait for the next station. Rail Chikitsak helps coordinate the response from the
            moment a passenger raises an SOS.
          </p>
        </div>
        <ol className="relative space-y-3">
          {CHAIN.map((c, i) => (
            <motion.li
              key={c}
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="flex items-center gap-4 rounded-xl border border-border bg-background px-5 py-4"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy font-mono text-xs text-navy-foreground">
                {i + 1}
              </span>
              <span className="font-display text-lg font-semibold">{c}</span>
              {i < CHAIN.length - 1 ? <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground" /> : null}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-24 text-center sm:px-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">Rail Chikitsak</p>
      <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
        One Tap. The Response Starts.
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
        From emergency detection to medical readiness — before the train reaches the station.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/demo">
          <Button className="h-14 gap-2 px-10 text-base font-semibold">
            GET STARTED <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
        <Link to="/auth">
          <Button variant="outline" className="h-14 px-10 text-base font-semibold">
            LOGIN / SIGN UP
          </Button>
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 text-center text-xs leading-relaxed text-muted-foreground sm:px-8">
        <p className="font-display text-base italic tracking-tight text-foreground">
          “In an emergency, distance is measured in minutes — not kilometres.”
        </p>
        <p className="mx-auto mt-3 max-w-2xl">
          Rail Chikitsak operates on its own network and is not connected to IRCTC, Indian Railways, railway GPS or
          government hospital systems. AI triage is decision support and never a medical diagnosis.
        </p>

      </div>
    </footer>
  );
}
