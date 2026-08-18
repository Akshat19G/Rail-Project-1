import type { ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, TrainFront, type LucideIcon } from "lucide-react";

import { useJourney } from "@/lib/railcare-journey";
import { BrandMark } from "@/components/railcare/logo";

export type NavItem<T extends string> = { id: T; label: string; icon: LucideIcon };

/* ------------------------------------------------------------ primitives */

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-border bg-card ${className}`}>
      {title ? (
        <header className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</h2>
          {action}
        </header>
      ) : null}
      <div className="p-6">{children}</div>
    </section>
  );
}

export function Stat({ value, label, tone = "default" }: { value: string; label: string; tone?: "default" | "accent" | "critical" }) {
  const toneClass = tone === "accent" ? "text-accent" : tone === "critical" ? "text-critical" : "text-foreground";
  return (
    <div className="min-w-0">
      <p className={`font-display text-3xl font-semibold tabular-nums tracking-tight ${toneClass}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function Tag({ children, tone = "muted" }: { children: ReactNode; tone?: "muted" | "accent" | "critical" | "warning" }) {
  const map = {
    muted: "border-border text-muted-foreground",
    accent: "border-accent/40 text-accent",
    critical: "border-critical/40 text-critical",
    warning: "border-high/50 text-high",
  } as const;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${map[tone]}`}>
      {children}
    </span>
  );
}

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
      {description ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
    </div>
  );
}

/* ----------------------------------------------------------------- shell */

export function DashboardShell<T extends string>({
  nav,
  active,
  onNavigate,
  workspace,
  status,
  children,
}: {
  nav: NavItem<T>[];
  active: T;
  onNavigate: (id: T) => void;
  workspace: string;
  status: ReactNode;
  children: ReactNode;
}) {
  const j = useJourney();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <BrandMark className="h-8 w-8" />
            <span className="truncate text-sm font-semibold tracking-tight">Rail Chikitsak</span>
            <span className="hidden truncate border-l border-border pl-2.5 text-xs text-muted-foreground sm:inline">
              {workspace}
            </span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            {status}
            <button
              onClick={() => {
                j.signOut();
                j.reset();
                void navigate({ to: "/auth", replace: true });
              }}
              className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-border px-3 py-6 lg:block">
          <nav className="space-y-0.5">
            {nav.map((item) => {
              const on = item.id === active;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                    on ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-28 pt-6 sm:px-8 sm:pt-8 lg:pb-16">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="flex overflow-x-auto">
          {nav.map((item) => {
            const on = item.id === active;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 px-2 py-2.5 text-[10px] transition-colors ${
                  on ? "text-foreground" : "text-muted-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
