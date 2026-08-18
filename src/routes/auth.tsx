import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Stethoscope, TrainFront, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DEMO_DOCTOR,
  DEMO_PASSENGER,
  useJourney,
  type Account,
  type Role,
} from "@/lib/railcare-journey";
import { clearTrustStorage, useTrust } from "@/lib/railcare-trust";
import { useI18n } from "@/lib/railcare-i18n";
import { LanguageSwitcher } from "@/components/railcare/language-switcher";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { loadAccount } from "@/lib/railcare-db";
import { DEMO_CREDENTIALS } from "@/lib/railcare-demo";
import { ensureDemoAccounts } from "@/lib/demo-accounts.functions";
import heroTrain from "@/assets/hero-train.jpg";
import { BrandMark } from "@/components/railcare/logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In — Rail Chikitsak" },
      {
        name: "description",
        content:
          "Sign in to Rail Chikitsak as a passenger or onboard doctor to access railway medical emergency response.",
      },
      { property: "og:title", content: "Sign In — Rail Chikitsak" },
      { property: "og:description", content: "Passenger and doctor access to Rail Chikitsak." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const j = useJourney();
  const navigate = useNavigate();
  const { resetTrustLayer } = useTrust();
  const { t } = useI18n();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [role, setRole] = useState<Role>("passenger");
  const [busy, setBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (j.authReady && j.account) {
      void navigate({ to: j.account.role === "doctor" ? "/doctor" : "/journey", replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [j.authReady, j.account]);

  const PENDING_ROLE_KEY = "railcare.pendingGoogleRole";

  function accountFromGoogle(
    forRole: Role,
    user: { email?: string | null; user_metadata?: Record<string, unknown> },
  ): Account {
    const meta = user.user_metadata ?? {};
    const name = String(meta["full_name"] ?? meta["name"] ?? user.email?.split("@")[0] ?? "Rail Chikitsak user");
    const base = forRole === "doctor" ? DEMO_DOCTOR : DEMO_PASSENGER;
    return { ...base, demo: false, name, email: user.email ?? base.email };
  }

  async function adoptGoogleSession(forRole: Role) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return false;
    localStorage.removeItem(PENDING_ROLE_KEY);
    const existing = await loadAccount(data.user.id);
    enter(existing ?? accountFromGoogle(forRole, data.user));
    return true;
  }

  async function signInWithGoogle(forRole: Role) {
    try {
      localStorage.setItem(PENDING_ROLE_KEY, forRole);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/auth`,
      });
      if (result.error) {
        localStorage.removeItem(PENDING_ROLE_KEY);
        toast.error("Google sign-in failed. Please try again.");
        return;
      }
      if (result.redirected) return;
      await adoptGoogleSession(forRole);
    } catch {
      localStorage.removeItem(PENDING_ROLE_KEY);
      toast.error("Google sign-in failed. Please try again.");
    }
  }

  useEffect(() => {
    if (j.account) return;
    const pending = typeof window !== "undefined" ? localStorage.getItem(PENDING_ROLE_KEY) : null;
    if (!pending) return;
    void adoptGoogleSession(pending === "doctor" ? "doctor" : "passenger");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [j.authReady]);

  function enter(account: Account) {
    clearTrustStorage();
    resetTrustLayer();
    j.signIn(account);
    j.reset();
    toast.success(`Signed in as ${account.name}`);
    void navigate({ to: account.role === "doctor" ? "/doctor" : "/journey", replace: true });
  }

  /** Real email + password sign-in against the account database. */
  async function login(email: string, password: string, forRole: Role) {
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error || !data.user) {
      toast.error(error?.message ?? "Could not sign in.");
      return;
    }
    const stored = await loadAccount(data.user.id);
    enter(stored ?? { ...(forRole === "doctor" ? DEMO_DOCTOR : DEMO_PASSENGER), demo: false, email });
  }

  /** Real sign-up. Accounts must confirm their email before the first sign-in. */
  async function register(account: Account, password: string) {
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: account.email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (!data.session) {
      setPendingConfirm(account.email);
      try {
        localStorage.setItem("railcare.pendingProfile", JSON.stringify(account));
      } catch {
        /* ignore */
      }
      toast.success("Confirm your email to finish creating the account.");
      return;
    }
    enter(account);
  }

  /** Signs into the shared demo accounts — real records in the database. */
  async function enterDemo(forRole: Role) {
    setBusy(true);
    try {
      await ensureDemoAccounts();
      const creds = forRole === "doctor" ? DEMO_CREDENTIALS.doctor : DEMO_CREDENTIALS.passenger;
      const { data, error } = await supabase.auth.signInWithPassword(creds);
      if (error || !data.user) {
        toast.error("Demo sign-in unavailable right now.");
        return;
      }
      const stored = await loadAccount(data.user.id);
      enter(stored ?? (forRole === "doctor" ? DEMO_DOCTOR : DEMO_PASSENGER));
    } finally {
      setBusy(false);
    }
  }

  // A confirmed sign-up returns here — save the profile captured at sign-up.
  useEffect(() => {
    if (!j.authReady || j.account) return;
    void (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      const raw = localStorage.getItem("railcare.pendingProfile");
      if (!raw) return;
      localStorage.removeItem("railcare.pendingProfile");
      enter({ ...(JSON.parse(raw) as Account), email: data.user.email ?? "" });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [j.authReady]);


  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative isolate hidden overflow-hidden lg:block">
        <img
          src={heroTrain}
          alt="Passenger train at a modern railway platform at dusk"
          width={1600}
          height={1000}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-navy/85" />
        <div className="relative flex h-full flex-col justify-between p-12 text-navy-foreground">
          <Link to="/" className="flex items-center gap-2.5">
            <BrandMark className="h-10 w-10" />
            <span className="font-display text-base font-semibold tracking-tight">Rail Chikitsak</span>
          </Link>
          <div>
            <h2 className="max-w-md font-display text-5xl font-semibold leading-[1.05] tracking-tight">
              One tap.
              <span className="block text-accent">The response starts.</span>
            </h2>
            <p className="mt-5 max-w-sm leading-relaxed text-navy-foreground/70">
              From emergency detection to medical readiness — before the train reaches the station.
            </p>
          </div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-navy-foreground/50">
            “Every second matters.”
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden">
            <Link to="/" className="flex items-center gap-2.5">
              <BrandMark className="h-10 w-10" />
              <span className="font-display text-base font-semibold tracking-tight">Rail Chikitsak</span>
            </Link>
          </div>

          <div className="mt-6 flex justify-end lg:mt-0">
            <LanguageSwitcher />
          </div>

          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground lg:mt-0">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Every second matters
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight">{t("auth.tagline")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.sub")}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-1 rounded-xl border border-border bg-muted/60 p-1">
            {(["login", "signup"] as const).map((tabKey) => (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                className={`rounded-lg py-2 text-sm font-medium transition-colors ${
                  tab === tabKey ? "bg-card shadow-elevate" : "text-muted-foreground"
                }`}
              >
                {tabKey === "login" ? t("auth.login") : t("auth.signup")}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <RoleCard
              icon={User}
              label="Passenger"
              active={role === "passenger"}
              onClick={() => setRole("passenger")}
            />
            <RoleCard icon={Stethoscope} label="Doctor" active={role === "doctor"} onClick={() => setRole("doctor")} />
          </div>

          <div className="mt-5">
            <Button
              variant="outline"
              className="h-12 w-full gap-3 text-base"
              onClick={() => void signInWithGoogle(role)}
            >
              <GoogleGlyph className="h-5 w-5" />
              Continue with Google
            </Button>
            <div className="mt-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">or use email</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </div>

          {pendingConfirm ? (
            <div className="mt-5 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <p className="font-medium">Confirm your email</p>
              <p className="mt-1 text-muted-foreground">
                We sent a confirmation link to {pendingConfirm}. Open it to activate your account, then sign in.
              </p>
              <Button variant="ghost" className="mt-3 h-9 px-0 text-sm" onClick={() => setPendingConfirm(null)}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <motion.div key={`${tab}-${role}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              {tab === "login" ? (
                <LoginForm role={role} busy={busy} onSubmit={(email, password) => void login(email, password, role)} />
              ) : role === "passenger" ? (
                <PassengerSignup busy={busy} onSubmit={(a, p) => void register(a, p)} />
              ) : (
                <DoctorSignup busy={busy} onSubmit={(a, p) => void register(a, p)} />
              )}
            </motion.div>
          )}

          <div className="mt-8 border-t border-border pt-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{t("auth.quick")}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                className="h-11 justify-start gap-2"
                disabled={busy}
                onClick={() => void enterDemo("passenger")}
              >
                ▶ PASSENGER
              </Button>
              <Button
                variant="outline"
                className="h-11 justify-start gap-2"
                disabled={busy}
                onClick={() => void enterDemo("doctor")}
              >
                ▶ DOCTOR
              </Button>
            </div>

            <Link to="/demo" className="mt-3 block">
              <Button variant="ghost" className="h-10 w-full text-sm">{t("auth.chooseRole")}</Button>
            </Link>
            <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
              Passenger: {DEMO_PASSENGER.name}, age {DEMO_PASSENGER.age} · coach {DEMO_PASSENGER.coach}, seat{" "}
              {DEMO_PASSENGER.seat}. Doctor: {DEMO_DOCTOR.name}, {DEMO_DOCTOR.specialization} · coach{" "}
              {DEMO_DOCTOR.coach}, seat {DEMO_DOCTOR.seat}.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.92l-3.88-3c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.29 14.28a7.2 7.2 0 0 1 0-4.56v-3.1H1.28a12 12 0 0 0 0 10.76l4.01-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.18 15.23 0 12 0A12 12 0 0 0 1.28 6.62l4.01 3.1C6.23 6.88 8.88 4.77 12 4.77Z"
      />
    </svg>
  );
}

function RoleCard({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof User;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 ${
        active ? "border-foreground/30 bg-card shadow-elevate" : "border-border bg-background hover:border-foreground/15"
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${
          active ? "bg-navy text-navy-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{label}</span>
        <span className="block truncate text-[11px] text-muted-foreground">
          {label === "Doctor" ? "Onboard responder" : "Travelling"}
        </span>
      </span>
    </button>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = true,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} />
    </div>
  );
}

function LoginForm({
  role,
  busy,
  onSubmit,
}: {
  role: Role;
  busy: boolean;
  onSubmit: (email: string, password: string) => void;
}) {
  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    onSubmit(String(f.get("email")), String(f.get("password")));
  }
  return (
    <form className="mt-5 space-y-4" onSubmit={handle}>
      <Field label="Email" name="email" type="email" defaultValue="" />
      <Field label="Password" name="password" type="password" defaultValue="" />
      <Button type="submit" disabled={busy} className="h-12 w-full text-base">
        {role === "doctor" ? "SIGN IN AS DOCTOR" : "SIGN IN AS PASSENGER"}
      </Button>
      <p className="text-[11px] text-muted-foreground">
        Don&apos;t have an account? Use the SIGN UP tab above.
      </p>
      <p className="text-[11px] text-muted-foreground">
        Accounts, journeys, emergencies and rewards are stored securely on your account.
      </p>
    </form>
  );
}

function PassengerSignup({ busy, onSubmit }: { busy: boolean; onSubmit: (a: Account, password: string) => void }) {
  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    onSubmit({
      role: "passenger",
      name: String(f.get("name")),
      mobile: String(f.get("mobile")),
      email: String(f.get("email")),
      age: Number(f.get("age")) || 54,
      bloodGroup: String(f.get("blood") ?? ""),
      emergencyContact: String(f.get("contact") ?? ""),
      allergies: String(f.get("allergies") ?? ""),
      demo: false,
      coach: String(f.get("coach") || "B2"),
      seat: String(f.get("seat") || "41"),
    }, String(f.get("password")));
  }
  return (
    <form className="mt-5 space-y-4" onSubmit={handle}>
      <Field label="Full name" name="name" defaultValue="Amit Sharma" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Mobile number" name="mobile" defaultValue="DEMO-90000-11122" />
        <Field label="Age" name="age" type="number" defaultValue={54} />
      </div>
      <Field label="Email" name="email" type="email" defaultValue="" />
      <Field label="Password" name="password" type="password" defaultValue="" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Emergency contact" name="contact" defaultValue="Meera Sharma" />
        <Field label="Blood group" name="blood" defaultValue="B+" />
      </div>
      <Field label="Allergies (optional)" name="allergies" required={false} defaultValue="" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Coach" name="coach" defaultValue="B2" />
        <Field label="Seat" name="seat" defaultValue="41" />
      </div>
      <Button type="submit" disabled={busy} className="h-12 w-full text-base">
        CREATE PASSENGER ACCOUNT
      </Button>
    </form>
  );
}

function DoctorSignup({ busy, onSubmit }: { busy: boolean; onSubmit: (a: Account, password: string) => void }) {
  const [willing, setWilling] = useState(true);
  function handle(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    onSubmit({
      role: "doctor",
      name: String(f.get("name")),
      mobile: String(f.get("mobile")),
      email: String(f.get("email")),
      specialization: String(f.get("specialization")),
      willing,
      demo: false,
      coach: String(f.get("coach") || "B3"),
      seat: String(f.get("seat") || "28"),
    }, String(f.get("password")));
  }
  return (
    <form className="mt-5 space-y-4" onSubmit={handle}>
      <Field label="Full name" name="name" defaultValue="Dr. Ananya Sharma" />
      <Field label="Mobile number" name="mobile" defaultValue="DEMO-90000-55566" />
      <Field label="Email" name="email" type="email" defaultValue="" />
      <Field label="Specialization" name="specialization" defaultValue="Cardiologist" />
      <Field label="Password" name="password" type="password" defaultValue="" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Coach" name="coach" defaultValue="B3" />
        <Field label="Seat" name="seat" defaultValue="28" />
      </div>
      <label className="flex items-start gap-3 rounded-xl border border-border p-4 text-sm">
        <Checkbox checked={willing} onCheckedChange={(v) => setWilling(Boolean(v))} className="mt-0.5" />
        <span className="text-muted-foreground">
          I am willing to assist passengers during medical emergencies while travelling.
        </span>
      </label>
      <Button type="submit" disabled={busy} className="h-12 w-full text-base">
        CREATE DOCTOR ACCOUNT
      </Button>
    </form>
  );
}
