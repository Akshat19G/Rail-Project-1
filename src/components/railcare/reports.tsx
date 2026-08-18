import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Check, FileWarning, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Panel, SectionHeading, Tag } from "@/components/railcare/shell";
import { REPORT_REASONS, useTrust, type EmergencyReport, type ReportReason } from "@/lib/railcare-trust";

const REVIEW_STEPS = [
  "Report received",
  "Emergency record checked",
  "Response timeline checked",
  "Case reviewed",
];

const STATUS_STEPS = ["Submitted", "Under review", "Verification", "Resolution"] as const;

function stepIndex(status: EmergencyReport["status"]) {
  if (status === "SUBMITTED") return 0;
  if (status === "UNDER_REVIEW") return 1;
  return 3;
}

export function ReportStatusTimeline({ report }: { report: EmergencyReport }) {
  const idx = stepIndex(report.status);
  return (
    <ol className="space-y-2.5">
      {STATUS_STEPS.map((s, i) => {
        const on = i <= idx;
        return (
          <li key={s} className="flex items-center gap-2.5 text-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${on ? "bg-accent" : "bg-border"}`} />
            <span className={on ? "" : "text-muted-foreground"}>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Simulated Rail Chikitsak Trust review — a report never penalises anyone on its own. */
export function TrustReviewCard({ report }: { report: EmergencyReport }) {
  const { verifyReport } = useTrust();
  const [step, setStep] = useState(0);
  const running = report.status === "SUBMITTED" || report.status === "UNDER_REVIEW";

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setStep((s) => Math.min(s + 1, REVIEW_STEPS.length)), 900);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (running && step >= REVIEW_STEPS.length) verifyReport(report.id);
  }, [step, running, report.id, verifyReport]);

  const verified = report.status === "VERIFIED";

  return (
    <Panel title="Rail Chikitsak Trust review" action={<Tag>Simulated review result</Tag>}>
      <ul className="space-y-2.5">
        {REVIEW_STEPS.map((s, i) => {
          const done = verified || i < step;
          return (
            <li key={s} className="flex items-center gap-2.5 text-sm">
              {done ? (
                <Check className="h-4 w-4 shrink-0 text-accent" />
              ) : (
                <span className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full border border-border" />
              )}
              <span className={done ? "" : "text-muted-foreground"}>{s}</span>
            </li>
          );
        })}
      </ul>

      {verified ? (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 border-t border-border pt-5">
          <p className="font-display text-lg font-semibold text-critical">Verified misuse</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Resolution · {report.resolution}. A trust deduction and warning were applied after verification.
          </p>
        </motion.div>
      ) : (
        <p className="mt-5 border-t border-border pt-4 text-xs text-muted-foreground">
          Reports are reviewed before any account action is taken.
        </p>
      )}
    </Panel>
  );
}

export function ReportDialog({
  emergencyId,
  reportedUserId,
  reporterRole = "doctor",
  open,
  onOpenChange,
  onSubmitted,
}: {
  emergencyId: string;
  reportedUserId?: string;
  reporterRole?: "doctor" | "passenger";
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmitted?: (r: EmergencyReport) => void;
}) {
  const { submitReport } = useTrust();
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]!);
  const [description, setDescription] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Report emergency misuse</DialogTitle>
          <DialogDescription>
            Report a case if you believe the emergency request was intentionally false, abusive, or used to
            unnecessarily consume emergency-response resources.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-4">
          <div className="space-y-2">
            {REPORT_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`flex w-full items-center gap-3 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors ${
                  reason === r ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/50"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${reason === r ? "bg-accent" : "bg-border"}`} />
                {r}
              </button>
            ))}
          </div>
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="report-detail">
              Additional details
            </label>
            <Textarea
              id="report-detail"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1.5"
              placeholder="Anything the review team should know"
            />
          </div>
          <Button
            className="h-11 w-full"
            onClick={() => {
              const r = submitReport({ emergencyId, reason, description, reporterRole, reportedUserId });
              onOpenChange(false);
              setDescription("");
              onSubmitted?.(r);
            }}
          >
            Submit report
          </Button>
          <p className="text-xs text-muted-foreground">
            Submitting a report does not penalise anyone. Every report is reviewed before any account action.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TABS = [
  { id: "ALL", label: "Submitted" },
  { id: "UNDER_REVIEW", label: "Under review" },
  { id: "RESOLVED", label: "Resolved" },
] as const;

export function ReportsSection() {
  const { reports } = useTrust();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("ALL");

  const list = reports.filter((r) =>
    tab === "ALL"
      ? true
      : tab === "UNDER_REVIEW"
        ? r.status === "UNDER_REVIEW" || r.status === "SUBMITTED"
        : r.status === "VERIFIED" || r.status === "DISMISSED",
  );

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Reports"
        description="Every report follows the same path: report, review, verification, resolution. Nothing is actioned automatically."
      />

      <div className="flex gap-1 rounded-lg border border-border p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm transition-colors ${
              tab === t.id ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Panel>
          <div className="py-8 text-center">
            <FileWarning className="mx-auto h-5 w-5 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">No reports in this view.</p>
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {list.map((r) => (
            <Panel key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <ShieldAlert className="h-4 w-4 text-muted-foreground" /> Emergency misuse report
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    Case {r.emergencyId} · report {r.id} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-3 text-sm text-muted-foreground">{r.reason}</p>
                  {r.description ? <p className="mt-1 text-sm text-muted-foreground">{r.description}</p> : null}
                </div>
                <Tag tone={r.status === "VERIFIED" ? "critical" : r.status === "DISMISSED" ? "muted" : "warning"}>
                  {r.status === "VERIFIED"
                    ? "Verified"
                    : r.status === "DISMISSED"
                      ? "Dismissed"
                      : r.status === "UNDER_REVIEW"
                        ? "Under review"
                        : "Submitted"}
                </Tag>
              </div>

              <div className="mt-5 grid gap-6 border-t border-border pt-5 sm:grid-cols-2">
                <ReportStatusTimeline report={r} />
                <div className="text-sm">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Resolution</p>
                  <p className="mt-1.5">{r.resolution ?? "Pending review"}</p>
                  {r.reviewResult ? (
                    <p className="mt-1 text-muted-foreground">Review result · {r.reviewResult}</p>
                  ) : null}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
