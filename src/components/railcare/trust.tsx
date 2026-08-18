import { useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ShieldCheck, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Panel, SectionHeading, Stat, Tag } from "@/components/railcare/shell";
import { ReportStatusTimeline } from "@/components/railcare/reports";
import { useTrust } from "@/lib/railcare-trust";

const MAX_TRUST = 1000;

export function TrustBadge() {
  const { trust } = useTrust();
  const tone = trust.status === "Good Standing" ? "accent" : trust.status === "Warning" ? "warning" : "critical";
  return <Tag tone={tone}>{trust.status}</Tag>;
}

export function TrustCard({ onOpen }: { onOpen?: () => void }) {
  const { trust } = useTrust();
  const pct = Math.round((trust.score / MAX_TRUST) * 100);
  const warning = trust.status !== "Good Standing";

  return (
    <Panel title="Rail Chikitsak Trust" action={<TrustBadge />}>
      <div className="flex items-end gap-3">
        <motion.p
          key={trust.score}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className={`font-display text-4xl font-semibold tabular-nums tracking-tight ${warning ? "text-high" : ""}`}
        >
          {trust.score}
        </motion.p>
        <span className="pb-1.5 text-sm text-muted-foreground">/ {MAX_TRUST}</span>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={`h-full rounded-full ${warning ? "bg-high" : "bg-accent"}`}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Rail Chikitsak Trust helps maintain a reliable emergency-response network.
      </p>
      {onOpen ? (
        <Button variant="outline" size="sm" className="mt-5 w-full" onClick={onOpen}>
          View trust
        </Button>
      ) : null}
    </Panel>
  );
}

export function TrustSection() {
  const { trust, reports } = useTrust();
  const warning = trust.status !== "Good Standing";
  const verified = reports.filter((r) => r.status === "VERIFIED");

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Rail Chikitsak Trust"
        description="A reliability record for the emergency-response network. Nothing changes here unless a report has been reviewed and verified."
      />

      <Panel>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="flex items-end gap-3">
              <motion.p
                key={trust.score}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`font-display text-6xl font-semibold tabular-nums tracking-tight ${warning ? "text-high" : ""}`}
              >
                {trust.score}
              </motion.p>
              <span className="pb-2 text-sm text-muted-foreground">/ {MAX_TRUST}</span>
            </div>
            <p className="mt-2 flex items-center gap-2 text-sm">
              {warning ? (
                <AlertTriangle className="h-4 w-4 text-high" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-accent" />
              )}
              {trust.status}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-8">
            <Stat value={String(trust.emergencyRequests)} label="Emergency requests" />
            <Stat value={String(trust.verifiedIncidents)} label="Verified misuse" tone={trust.verifiedIncidents ? "critical" : "default"} />
            <Stat value={String(trust.successfulResponses)} label="Successful responses" tone="accent" />
          </div>
        </div>
      </Panel>

      {warning ? (
        <Panel title="Account trust" action={<Tag tone="warning">Warning issued</Tag>}>
          <p className="font-medium">Emergency misuse record</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            A previous emergency request was determined to be invalid in the review. A warning has been issued and 100
            trust points were deducted. Your account remains active and SOS stays available.
          </p>
          {verified[0] ? (
            <div className="mt-5 border-t border-border pt-5">
              <ReportStatusTimeline report={verified[0]} />
            </div>
          ) : null}
        </Panel>
      ) : null}

      <Panel title="How trust changes">
        <ol className="space-y-4 text-sm">
          {[
            ["First verified misuse", "Warning issued and a small trust deduction."],
            ["Repeated verified misuse", "Temporary SOS restriction while the account is reviewed."],
            ["Severe or repeated abuse", "Full account review by the Rail Chikitsak trust team."],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-border font-mono text-[10px]">
                {i + 1}
              </span>
              <span>
                <span className="block font-medium">{title}</span>
                <span className="block text-muted-foreground">{body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
          An unverified report never results in an automatic penalty.
        </p>
      </Panel>
    </div>
  );
}

const RATINGS = ["Excellent assistance", "Helpful", "Neutral", "Concern"] as const;

export function FeedbackDialog({
  emergencyId,
  open,
  onOpenChange,
  onConcern,
}: {
  emergencyId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConcern?: () => void;
}) {
  const { addFeedback } = useTrust();
  const [rating, setRating] = useState<(typeof RATINGS)[number]>("Excellent assistance");
  const [note, setNote] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Provide feedback</DialogTitle>
          <DialogDescription>How was the response to emergency {emergencyId}?</DialogDescription>
        </DialogHeader>
        <div className="mt-2 space-y-4">
          <div className="space-y-2">
            {RATINGS.map((r) => (
              <button
                key={r}
                onClick={() => setRating(r)}
                className={`flex w-full items-center gap-2.5 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors ${
                  rating === r ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50"
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${rating === r ? "text-accent" : "text-muted-foreground"}`} />
                {r}
              </button>
            ))}
          </div>
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note" />
          <Button
            className="h-11 w-full"
            onClick={() => {
              addFeedback({ emergencyId, rating, note });
              onOpenChange(false);
              if (rating === "Concern") onConcern?.();
            }}
          >
            Submit feedback
          </Button>
          <p className="text-xs text-muted-foreground">
            Serious concerns are routed through review before any responder action is taken.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
