import { useState } from "react";
import { motion } from "motion/react";
import { Award, Check, Copy, Gift, HeartHandshake, ShieldCheck, Sparkles, Ticket, Trophy } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Panel, SectionHeading, Stat, Tag } from "@/components/railcare/shell";
import { useI18n } from "@/lib/railcare-i18n";
import {
  EARNING_RULES,
  REDEEMABLES,
  TIERS,
  nextTier,
  useTrust,
  type Redeemable,
  type RedeemedReward,
} from "@/lib/railcare-trust";

function tierLabel(tier: string) {
  return TIERS.find((t) => t.tier === tier)?.label.toUpperCase() ?? tier;
}

function fmtDate(at: string) {
  return new Date(at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function RewardsCard({ onOpen }: { onOpen?: () => void }) {
  const { rewards, redeemedRewards } = useTrust();
  const { t } = useI18n();
  const next = nextTier(rewards.points);
  const target = next?.min ?? rewards.points;
  const pct = Math.min(100, Math.round((rewards.points / target) * 100));

  return (
    <Panel title={t("rewards.title")} action={<Tag>{tierLabel(rewards.tier)}</Tag>}>
      <div className="rounded-xl bg-reward-gradient p-5 text-reward-foreground shadow-reward">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-display text-4xl font-semibold tabular-nums tracking-tight">
              {rewards.points.toLocaleString()}
            </p>
            <p className="mt-1 text-xs opacity-85">{t("rewards.points")}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-reward-foreground/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
            <Award className="h-3 w-3" /> {tierLabel(rewards.tier)}
          </span>
        </div>

        <div className="mt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-reward-foreground/25">
            <motion.div
              className="h-full rounded-full bg-reward-foreground"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
          <p className="mt-2.5 text-xs opacity-85">
            {rewards.points.toLocaleString()} / {target.toLocaleString()}
            {next ? ` · ${(target - rewards.points).toLocaleString()} to ${next.label}` : " · highest tier reached"}
          </p>
        </div>
      </div>

      {redeemedRewards.length ? (
        <p className="mt-4 text-xs text-muted-foreground">
          {redeemedRewards.length} reward{redeemedRewards.length > 1 ? "s" : ""} in your wallet
        </p>
      ) : null}

      {onOpen ? (
        <Button variant="outline" size="sm" className="mt-4 w-full" onClick={onOpen}>
          {t("rewards.store")}
        </Button>
      ) : null}
    </Panel>
  );
}

export function RewardsSection() {
  const { rewards, redeem, redeemedRewards } = useTrust();
  const { t } = useI18n();
  const [selected, setSelected] = useState<Redeemable | null>(null);
  const [done, setDone] = useState<RedeemedReward | null>(null);
  const next = nextTier(rewards.points);
  const target = next?.min ?? rewards.points;
  const pct = Math.min(100, Math.round((rewards.points / target) * 100));

  return (
    <div className="space-y-6">
      <SectionHeading
        title={t("rewards.title")}
        description="Recognition for responsible participation — acknowledging alerts, assessing carefully and escalating when it is clinically appropriate. Points are never awarded for a particular medical decision."
      />

      {/* Balance hero */}
      <section className="overflow-hidden rounded-2xl border border-reward/30 bg-card shadow-elevate">
        <div className="relative bg-reward-gradient p-7 text-reward-foreground sm:p-9">
          <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-reward-foreground/10" aria-hidden />
          <div className="absolute -bottom-20 right-24 h-44 w-44 rounded-full bg-reward-foreground/10" aria-hidden />
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-80">{t("rewards.balance")}</p>
              <p className="mt-2 font-display text-6xl font-semibold tabular-nums leading-none tracking-tight">
                {rewards.points.toLocaleString()}
              </p>
              <p className="mt-2 text-sm opacity-85">{t("rewards.points")}</p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-reward-foreground/18 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]">
                <Trophy className="h-3.5 w-3.5" /> {tierLabel(rewards.tier)}
              </span>
              {next ? (
                <p className="mt-2 text-xs opacity-85">
                  {(next.min - rewards.points).toLocaleString()} points to {next.label}
                </p>
              ) : (
                <p className="mt-2 text-xs opacity-85">Highest tier reached</p>
              )}
            </div>
          </div>

          <div className="relative mt-7">
            <div className="h-2 w-full overflow-hidden rounded-full bg-reward-foreground/25">
              <motion.div
                className="h-full rounded-full bg-reward-foreground"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 border-t border-border p-6 sm:grid-cols-4">
          <Stat value={rewards.points.toLocaleString()} label="Available points" />
          <Stat value={String(redeemedRewards.length)} label="Rewards redeemed" />
          <Stat
            value={redeemedRewards.reduce((s, r) => s + r.cost, 0).toLocaleString()}
            label="Points spent"
          />
          <Stat value={tierLabel(rewards.tier)} label="Current tier" />
        </div>
      </section>

      {/* Wallet */}
      <Panel
        title={t("rewards.wallet")}
        action={<Tag>{redeemedRewards.length} item{redeemedRewards.length === 1 ? "" : "s"}</Tag>}
      >
        {redeemedRewards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-reward/40 bg-reward-surface p-8 text-center">
            <Ticket className="mx-auto h-5 w-5 text-reward" />
            <p className="mt-3 text-sm font-medium">No rewards yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Redeem your points below — everything you claim appears here instantly.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {redeemedRewards.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-reward/35 bg-reward-surface p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">Claimed {fmtDate(r.at)}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-reward px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-reward-foreground">
                    <Check className="h-3 w-3" /> {t("rewards.redeemed")}
                  </span>
                </div>
                <button
                  onClick={() => {
                    void navigator.clipboard?.writeText(r.code);
                    toast.success(`Code ${r.code} copied`);
                  }}
                  className="mt-4 flex w-full items-center justify-between gap-3 rounded-lg border border-reward/40 bg-card px-3 py-2.5 text-left transition-colors hover:border-reward"
                >
                  <span className="font-mono text-sm tracking-wider">{r.code}</span>
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </Panel>

      {/* Store */}
      <Panel title={t("rewards.store")}>
        <div className="grid gap-4 sm:grid-cols-2">
          {REDEEMABLES.map((r) => {
            const affordable = rewards.points >= r.cost;
            const owned = redeemedRewards.filter((x) => x.rewardId === r.id).length;
            return (
              <motion.div
                key={r.id}
                whileHover={{ y: -2 }}
                className={`flex flex-col justify-between rounded-xl border p-5 transition-colors ${
                  affordable ? "border-reward/35 bg-card hover:border-reward" : "border-border bg-card"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-reward-surface text-reward">
                      <Gift className="h-4 w-4" />
                    </span>
                    {owned ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-reward/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-reward">
                        <Check className="h-3 w-3" /> {t("rewards.redeemed")} ×{owned}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-3 font-medium">{r.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
                </div>
                <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4">
                  <span className="font-mono text-sm tabular-nums">
                    <span className="text-reward">{r.cost.toLocaleString()}</span> pts
                  </span>
                  <Button
                    size="sm"
                    disabled={!affordable}
                    onClick={() => setSelected(r)}
                    className="bg-reward text-reward-foreground hover:bg-reward/90"
                  >
                    {affordable ? t("rewards.redeem") : `Need ${(r.cost - rewards.points).toLocaleString()}`}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </Panel>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel title="Tiers">
          <div className="space-y-3">
            {TIERS.map((tier) => {
              const reached = rewards.points >= tier.min;
              const current = rewards.tier === tier.tier;
              return (
                <div key={tier.tier} className="flex items-center gap-3">
                  <span className={`h-1.5 w-1.5 rounded-full ${reached ? "bg-reward" : "bg-border"}`} aria-hidden />
                  <span className={`text-sm ${current ? "font-medium" : "text-muted-foreground"}`}>{tier.label}</span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {tier.min}
                    {Number.isFinite(tier.max) ? `–${tier.max}` : "+"}
                  </span>
                  {current ? (
                    <span className="rounded-full bg-reward px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-reward-foreground">
                      Current
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title={t("rewards.earn")}>
          <ul className="space-y-3.5">
            {EARNING_RULES.map((r) => (
              <li key={r.label} className="flex items-start justify-between gap-4 text-sm">
                <span className="min-w-0 text-muted-foreground">{r.label}</span>
                <span className="shrink-0 font-mono text-xs text-reward">+{r.points}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
            Participation · Responsiveness · Responsible escalation
          </p>
        </Panel>
      </div>

      <div>
        <SectionHeading title="Why respond?" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "Professional recognition",
              body: "Build a verified record of emergency-response participation.",
            },
            {
              icon: Sparkles,
              title: "Rewards",
              body: "Earn Rail Chikitsak Points through responsible participation.",
            },
            {
              icon: HeartHandshake,
              title: "Real-world impact",
              body: "Help passengers who need immediate assistance while travelling.",
            },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-border p-5">
              <c.icon className="h-4 w-4 text-reward" />
              <p className="mt-3 text-sm font-medium">{c.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Responding is always voluntary. Responders are never obligated to accept an emergency.
        </p>
      </div>

      <Panel title={t("rewards.activity")}>
        <ul className="divide-y divide-border">
          {rewards.history.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-4 py-3 text-sm first:pt-0 last:pb-0">
              <span className="min-w-0">
                <span className="block truncate">{h.label}</span>
                <span className="block font-mono text-[11px] text-muted-foreground">{fmtDate(h.at)}</span>
              </span>
              <span className={`shrink-0 font-mono text-xs ${h.points > 0 ? "text-accent" : "text-reward"}`}>
                {h.points > 0 ? "+" : ""}
                {h.points}
              </span>
            </li>
          ))}
        </ul>
      </Panel>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Redeem {selected?.cost.toLocaleString()} Rail Chikitsak Points?</DialogTitle>
            <DialogDescription>{selected?.name}</DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-reward/35 bg-reward-surface p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Balance after</span>
              <span className="font-mono">
                {Math.max(0, rewards.points - (selected?.cost ?? 0)).toLocaleString()} pts
              </span>
            </div>
          </div>
          <Button
            className="mt-2 h-11 w-full bg-reward text-reward-foreground hover:bg-reward/90"
            onClick={() => {
              if (!selected) return;
              const issued = redeem(selected);
              setSelected(null);
              if (issued) {
                setDone(issued);
                toast.success(`${issued.name} added to your rewards`);
              } else {
                toast.error("Not enough points");
              }
            }}
          >
            Confirm redemption
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!done} onOpenChange={(o) => !o && setDone(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-reward" /> Redemption successful
            </DialogTitle>
            <DialogDescription>
              {done?.name} · new balance {rewards.points.toLocaleString()} points.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl bg-reward-gradient p-5 text-reward-foreground shadow-reward">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-85">Reward code</p>
            <p className="mt-1.5 font-mono text-xl tracking-[0.18em]">{done?.code}</p>
          </div>
          <Button variant="outline" className="mt-3 h-10 w-full" onClick={() => setDone(null)}>
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function ImpactCard() {
  const { impact } = useTrust();
  return (
    <Panel title="Your impact">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat value={String(impact.assisted)} label="Emergencies assisted" />
        <Stat value={String(impact.successful)} label="Successful responses" tone="accent" />
        <Stat value={String(impact.escalations)} label="Hospital escalations" />
        <Stat value={`${impact.reliability}%`} label="Response reliability" />
      </div>
    </Panel>
  );
}
