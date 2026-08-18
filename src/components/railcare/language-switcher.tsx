import { useEffect, useRef, useState } from "react";
import { Check, Globe } from "lucide-react";
import { toast } from "sonner";

import { LOCALES, useI18n, type LocaleCode } from "@/lib/railcare-i18n";

export function LanguageSwitcher({ tone = "default" }: { tone?: "default" | "inverted" }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const trigger =
    tone === "inverted"
      ? "border-navy-foreground/25 text-navy-foreground hover:bg-navy-foreground/10"
      : "border-border text-foreground hover:bg-muted";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("lang.title")}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors ${trigger}`}
      >
        <Globe className="h-3.5 w-3.5" />
        <span className="max-w-[7rem] truncate">{current.native}</span>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-elevate"
        >
          <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {t("lang.title")}
          </p>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              role="option"
              aria-selected={l.code === locale}
              onClick={() => {
                setLocale(l.code as LocaleCode);
                setOpen(false);
                toast.success(`${l.native} · ${l.label}`);
              }}
              className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
                l.code === locale ? "font-medium" : "text-muted-foreground"
              }`}
            >
              <span className="min-w-0 truncate">
                {l.native}
                <span className="ml-2 text-[11px] text-muted-foreground">{l.label}</span>
              </span>
              {l.code === locale ? <Check className="h-3.5 w-3.5 shrink-0 text-accent" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
