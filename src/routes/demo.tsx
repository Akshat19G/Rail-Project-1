import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Stethoscope, User } from "lucide-react";

import { clearTrustStorage, useTrust } from "@/lib/railcare-trust";
import { Button } from "@/components/ui/button";
import { DEMO_DOCTOR, DEMO_PASSENGER, TRAIN, useJourney, type Account } from "@/lib/railcare-journey";
import coachInterior from "@/assets/coach-interior.jpg";
import doctorOnboard from "@/assets/doctor-onboard.jpg";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Choose Your Role — Rail Chikitsak" },
      {
        name: "description",
        content:
          "Continue as a passenger or an onboard doctor and enter the Rail Chikitsak railway medical emergency response network.",
      },
      { property: "og:title", content: "Choose Your Role — Rail Chikitsak" },
      {
        property: "og:description",
        content: "Passenger SOS journey and onboard medical responder console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DemoChooser,
});

function DemoChooser() {
  const j = useJourney();
  const navigate = useNavigate();
  const { resetTrustLayer } = useTrust();

  function enter(account: Account) {
    clearTrustStorage();
    resetTrustLayer();
    j.signIn(account);
    j.reset();
    void navigate({ to: account.role === "doctor" ? "/doctor" : "/journey", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <Link to="/auth" className="text-sm text-muted-foreground hover:text-foreground">
          Use a real account
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 pb-24 pt-8 sm:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" /> “Every second matters.”
        </span>
        <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Choose your role</h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Both consoles run on the same live {TRAIN} journey from Pune Central to Mumbai Central.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <DemoCard
            icon={User}
            image={coachInterior}
            alt="Interior of a modern passenger train coach"
            eyebrow="Passenger experience"
            title="Amit Sharma"
            body="Experience Rail Chikitsak from the passenger's perspective — live journey tracking, one-tap medical SOS and AI-assisted triage."
            facts={[`Age 54`, `Coach ${DEMO_PASSENGER.coach}`, `Seat ${DEMO_PASSENGER.seat}`]}
            cta="CONTINUE AS PASSENGER"
            onClick={() => enter(DEMO_PASSENGER)}
            delay={0}
          />
          <DemoCard
            icon={Stethoscope}
            image={doctorOnboard}
            alt="Doctor attending to a passenger onboard a train"
            eyebrow="Doctor experience"
            title={DEMO_DOCTOR.name}
            body="Experience how onboard medical responders receive an emergency, work a 2-minute response window and decide the next step."
            facts={[DEMO_DOCTOR.specialization ?? "", `Coach ${DEMO_DOCTOR.coach}`, `Seat ${DEMO_DOCTOR.seat}`]}
            cta="CONTINUE AS DOCTOR"
            onClick={() => enter(DEMO_DOCTOR)}
            delay={0.08}
          />
        </div>

        <p className="mt-10 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          All passengers, doctors, hospitals and ambulances are fictional. Nothing here is connected to IRCTC, Indian
          Railways, railway GPS, government hospital systems or any SMS provider.
        </p>
      </main>
    </div>
  );
}

function DemoCard({
  icon: Icon,
  image,
  alt,
  eyebrow,
  title,
  body,
  facts,
  cta,
  onClick,
  delay,
}: {
  icon: typeof User;
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  body: string;
  facts: string[];
  cta: string;
  onClick: () => void;
  delay: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-elevate"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={image}
          alt={alt}
          loading="lazy"
          width={1600}
          height={1000}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-navy/55" />
        <span className="absolute left-5 top-5 grid h-10 w-10 place-items-center rounded-lg bg-navy text-navy-foreground">
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <div className="p-7">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          {facts.filter(Boolean).map((f) => (
            <span key={f} className="rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground">
              {f}
            </span>
          ))}
        </div>
        <Button onClick={onClick} className="mt-7 h-12 w-full gap-2 text-sm font-semibold">
          {cta} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.article>
  );
}
