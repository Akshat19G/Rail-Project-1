import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Contrast, Eye, Languages, Palette, RotateCcw, Volume2, Waves } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Panel, SectionHeading } from "@/components/railcare/shell";
import { LanguageSwitcher } from "@/components/railcare/language-switcher";
import { useI18n } from "@/lib/railcare-i18n";
import { playAlertTone, useSettings, type TextSize, type ThemeMode } from "@/lib/railcare-settings";
import { clearTrustStorage, useTrust } from "@/lib/railcare-trust";
import { useJourney } from "@/lib/railcare-journey";

function Row({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Eye;
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0">
      <div className="flex min-w-0 items-start gap-3">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {desc ? <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p> : null}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
        checked ? "border-accent bg-accent" : "border-border bg-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4.5 h-[1.1rem] w-[1.1rem] rounded-full bg-background transition-all ${
          checked ? "left-[1.4rem]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted p-1">
      {options.map((o) => (
        <button
          key={o.value}
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            value === o.value ? "bg-card shadow-elevate" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsSection() {
  const { t } = useI18n();
  const { settings, update, resetSettings } = useSettings();
  const { resetTrustLayer } = useTrust();
  const j = useJourney();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <SectionHeading title={t("settings.title")} description={t("settings.desc")} />

      <Panel title={t("lang.label")}>
        <Row icon={Languages} title={t("lang.title")} desc={t("settings.language.desc")}>
          <LanguageSwitcher />
        </Row>
      </Panel>

      <Panel title={t("settings.appearance")}>
        <Row icon={Palette} title={t("settings.theme")}>
          <Segmented<ThemeMode>
            value={settings.theme}
            onChange={(v) => {
              update("theme", v);
              toast.success(t("settings.saved"));
            }}
            options={[
              { value: "light", label: t("settings.light") },
              { value: "dark", label: t("settings.dark") },
              { value: "system", label: t("settings.system") },
            ]}
          />
        </Row>
      </Panel>

      <Panel title={t("settings.accessibility")}>
        <Row icon={Eye} title={t("settings.textSize")}>
          <Segmented<TextSize>
            value={settings.textSize}
            onChange={(v) => update("textSize", v)}
            options={[
              { value: "sm", label: t("common.small") },
              { value: "md", label: t("common.default") },
              { value: "lg", label: t("common.large") },
            ]}
          />
        </Row>
        <Row icon={Contrast} title={t("settings.contrast")} desc={t("settings.contrast.desc")}>
          <Toggle
            checked={settings.highContrast}
            onChange={(v) => update("highContrast", v)}
            label={t("settings.contrast")}
          />
        </Row>
        <Row icon={Waves} title={t("settings.motion")} desc={t("settings.motion.desc")}>
          <Toggle
            checked={settings.reduceMotion}
            onChange={(v) => update("reduceMotion", v)}
            label={t("settings.motion")}
          />
        </Row>
      </Panel>

      <Panel title={t("settings.notifications")}>
        <Row icon={Volume2} title={t("settings.sound")} desc={t("settings.sound.desc")}>
          <Toggle
            checked={settings.alertSound}
            onChange={(v) => {
              update("alertSound", v);
              if (v) playAlertTone();
            }}
            label={t("settings.sound")}
          />
        </Row>
        <Row icon={Eye} title={t("settings.toasts")} desc={t("settings.toasts.desc")}>
          <Toggle
            checked={settings.toastAlerts}
            onChange={(v) => update("toastAlerts", v)}
            label={t("settings.toasts")}
          />
        </Row>
      </Panel>

      <Panel title={t("settings.data")}>
        <Row icon={RotateCcw} title={t("settings.reset")} desc={t("settings.reset.desc")}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearTrustStorage();
              resetTrustLayer();
              resetSettings();
              j.reset();
              toast.success(t("settings.saved"));
              void navigate({ to: j.account?.role === "doctor" ? "/doctor" : "/journey", replace: true });
            }}
          >
            {t("settings.reset")}
          </Button>
        </Row>
      </Panel>
    </div>
  );
}
