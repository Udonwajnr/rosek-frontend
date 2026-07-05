"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  MarketingNav,
  MarketingFooter,
  Reveal,
  PulseLine,
  useScrollY,
  useReducedMotion,
} from "../../app/components/marketing";
import {
  ArrowRight,
  Sparkles,
  Layers,
  ArrowLeftRight,
  CalendarClock,
  CalendarCheck,
  Truck,
  ClipboardList,
  BarChart3,
  ShieldCheck,
  PackageCheck,
  Pill,
  Boxes,
  Mail,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Hero mockup — a miniature of the real product, tilted in 3D        */
/* ------------------------------------------------------------------ */

const LEDGER_ROWS = [
  { type: "Received", cls: "bg-emerald-50 text-emerald-700", drug: "Amoxicillin 500mg", batch: "FID-AMX-1122", change: "+200", pos: true },
  { type: "Dispensed", cls: "bg-blue-50 text-blue-700", drug: "Paracetamol 500mg", batch: "EMZ-PCM-2519", change: "−24", pos: false },
  { type: "Dispensed", cls: "bg-blue-50 text-blue-700", drug: "Artemether/Lum 20/120", batch: "MB-ACT-0788", change: "−6", pos: false },
  { type: "Expired", cls: "bg-red-50 text-red-700", drug: "Ibuprofen 400mg", batch: "EMZ-IBU-9917", change: "−60", pos: false },
];

function HeroMockup() {
  const wrapRef = useRef(null);
  const [tilt, setTilt] = useState({ x: -6, y: 8 });
  const reduced = useReducedMotion();

  const onMove = (e) => {
    if (reduced || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 10, y: px * 12 });
  };
  const onLeave = () => setTilt({ x: -6, y: 8 });

  return (
    <div
      ref={wrapRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="rosek-perspective relative mx-auto w-full max-w-2xl"
    >
      {/* Main dashboard card */}
      <div
        className="rosek-tilt relative rounded-2xl border bg-card p-4 shadow-2xl shadow-primary/10 sm:p-5"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 pb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          <span className="ml-3 rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            rosek.app/dashboard/stock
          </span>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Stock value", value: "₦2.4M" },
            { label: "Units on hand", value: "12,480" },
            { label: "Expiring ≤30d", value: "3 batches", warn: true },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border bg-background p-2.5">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p
                className={`text-sm font-bold tabular-nums ${s.warn ? "text-amber-600" : ""}`}
              >
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Ledger */}
        <div className="mt-3 overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-2">
            <p className="text-[11px] font-semibold">Stock ledger</p>
            <p className="text-[10px] text-muted-foreground">append-only</p>
          </div>
          {LEDGER_ROWS.map((r) => (
            <div
              key={r.batch}
              className="flex items-center justify-between gap-2 border-b px-3 py-2 last:border-0"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${r.cls}`}
                >
                  {r.type}
                </span>
                <p className="truncate text-[11px] font-medium">{r.drug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                  {r.batch}
                </span>
                <span
                  className={`text-[11px] font-bold tabular-nums ${
                    r.pos ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {r.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating card: interaction alert */}
      <div
        className="rosek-float absolute -left-4 -top-6 w-56 rounded-xl border bg-card p-3 shadow-xl sm:-left-12"
        style={{ transform: "translateZ(60px)" }}
      >
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          <p className="text-[10px] font-bold tracking-wide text-red-600">
            INTERACTION · MAJOR
          </p>
        </div>
        <p className="mt-1 text-[11px] font-medium leading-snug">
          Ibuprofen × Lisinopril — reduces antihypertensive effect
        </p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Flagged by AI before dispensing
        </p>
      </div>

      {/* Floating card: calendar sent */}
      <div
        className="rosek-float-delayed absolute -bottom-6 -right-3 w-52 rounded-xl border bg-card p-3 shadow-xl sm:-right-10"
        style={{ transform: "translateZ(40px)" }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50">
            <CalendarCheck className="h-3.5 w-3.5 text-emerald-600" />
          </span>
          <div>
            <p className="text-[11px] font-semibold">Calendar sent</p>
            <p className="text-[10px] text-muted-foreground">
              Adaeze N. — dose schedule, 3 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const FLOW_STEPS = [
  {
    icon: Truck,
    title: "Supplier",
    text: "Every batch knows where it came from — recalls and price checks stop being guesswork.",
  },
  {
    icon: ClipboardList,
    title: "Purchase order",
    text: "Low-stock items pre-fill an order. One receive action turns it into tracked batches.",
  },
  {
    icon: Layers,
    title: "Batch + expiry",
    text: "Each delivery carries its own batch number, cost price, and expiry date.",
  },
  {
    icon: PackageCheck,
    title: "FEFO dispense",
    text: "Stock leaves earliest-expiry-first, automatically. Waste shrinks without anyone thinking about it.",
  },
  {
    icon: ArrowLeftRight,
    title: "Ledger entry",
    text: "Every unit in or out is recorded with who, why, and the balance after. Nothing edits history.",
  },
  {
    icon: CalendarClock,
    title: "Patient calendar",
    text: "The dose schedule lands in the patient's inbox as a calendar invite. No app to install.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI dispensing assistant",
    text: "Interactions are checked live against the basket and the patient's own history. Only critical risks surface — no alert fatigue.",
  },
  {
    icon: Layers,
    title: "Batch & FEFO tracking",
    text: "Per-batch expiry with first-expiry-first-out dispensing. The system quietly drains the right shelf.",
  },
  {
    icon: ArrowLeftRight,
    title: "Immutable stock ledger",
    text: "Received, dispensed, adjusted, written off — every movement is append-only and auditable, down to the batch.",
  },
  {
    icon: CalendarClock,
    title: "Expiry management",
    text: "30 / 60 / 90-day windows show value at risk in naira. Write-offs demand a reason and go on the record.",
  },
  {
    icon: BarChart3,
    title: "Reports that export",
    text: "Stock valuation, fastest movers, full dispense history — on screen or as CSV for the accountant.",
  },
  {
    icon: Mail,
    title: "Schedules patients follow",
    text: "Every dispense emails a calendar file with a reminder per dose — and the record shows it was sent.",
  },
];

export default function LandingPage() {
  const scrollY = useScrollY();

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* ============================== HERO ============================== */}
      <section className="relative overflow-hidden pb-24 pt-32 sm:pt-40">
        {/* Parallax background layers */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
          style={{ transform: `translate(-50%, ${scrollY * 0.18}px)` }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-160px] top-40 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl"
          style={{ transform: `translateY(${scrollY * 0.32}px)` }}
        />
        {/* Grid texture */}
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full text-foreground/[0.035]"
          style={{ transform: `translateY(${scrollY * 0.08}px)` }}
        >
          <defs>
            <pattern id="rosek-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M48 0H0V48" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#rosek-grid)" />
        </svg>

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                PHARMACY OPERATIONS PLATFORM
              </span>
            </Reveal>
            <Reveal delay={100}>
              <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Stock you can trust.
                <br />
                <span className="text-primary">Patients who take it.</span>
              </h1>
            </Reveal>
            <Reveal delay={180}>
              <PulseLine className="mx-auto mt-4 h-8 w-64 text-primary/70 sm:w-80" />
            </Reveal>
            <Reveal delay={240}>
              <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
                Rosek runs your pharmacy's entire loop — suppliers, batches,
                first-expiry-first-out dispensing, an audit trail nobody can
                rewrite, and dose schedules that land in the patient's own
                calendar.
              </p>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="gap-2 shadow-lg shadow-primary/25">
                  <Link href="/register">
                    Get started free <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/#flow">See how it works</Link>
                </Button>
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Built for hospitals, clinics, and community pharmacies.
              </p>
            </Reveal>
          </div>

          <Reveal delay={420} className="mt-16 sm:mt-20">
            <HeroMockup />
          </Reveal>
        </div>
      </section>

      {/* =========================== STAT STRIP =========================== */}
      <section className="border-y bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
          {[
            { value: "FEFO", label: "Earliest expiry leaves first" },
            { value: "100%", label: "Of stock changes on the ledger" },
            { value: "30/60/90", label: "Expiry risk windows, in ₦" },
            { value: "0 apps", label: "For patients — just their calendar" },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 80}>
              <div className="text-center sm:text-left">
                <p className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {s.label}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============================= FLOW =============================== */}
      <section id="flow" className="relative overflow-hidden py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                How it works
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                One loop, from delivery van to bedside
              </h2>
              <p className="mt-3 text-muted-foreground">
                Six steps the system runs for you. The order matters — that's
                the point.
              </p>
            </div>
          </Reveal>

          <div className="relative mt-14">
            {/* Connector line (desktop) */}
            <svg
              aria-hidden="true"
              className="absolute left-0 top-7 hidden h-2 w-full text-border lg:block"
              preserveAspectRatio="none"
              viewBox="0 0 100 2"
            >
              <path
                d="M0 1 H100"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 4"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
              {FLOW_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <Reveal key={step.title} delay={i * 90}>
                    <div className="relative flex flex-col items-start gap-3 lg:items-center lg:text-center">
                      <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border bg-card shadow-sm">
                        <Icon className="h-6 w-6 text-primary" />
                      </span>
                      <div>
                        <p className="text-sm font-bold">{step.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                          {step.text}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section id="features" className="border-t bg-card py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Product
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Everything a pharmacy counter actually needs
              </h2>
              <p className="mt-3 text-muted-foreground">
                Not a point-of-sale with a stock column bolted on. Rosek is
                built around the physical reality of shelves, batches, and
                expiry dates.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <Reveal key={f.title} delay={i * 70}>
                  <div className="group h-full rounded-2xl border bg-background p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary">
                      <Icon className="h-5 w-5 text-primary transition-colors group-hover:text-primary-foreground" />
                    </span>
                    <h3 className="mt-4 text-base font-bold">{f.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {f.text}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================== AI SECTION =========================== */}
      <section className="relative overflow-hidden py-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-[-120px] top-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl"
          style={{ transform: `translateY(${scrollY * -0.06}px)` }}
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <Reveal>
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                <Sparkles className="h-3.5 w-3.5" /> AI DISPENSING
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">
                A second pair of eyes on every basket
              </h2>
              <p className="mt-4 text-muted-foreground">
                As medications go into the basket, Rosek checks them against
                each other <em>and</em> the patient's active prescriptions.
                Major interactions surface as a clear warning with the clinical
                reason — minor noise stays out of the way. Pharmacists can ask
                the clinical assistant follow-up questions right in the
                sidebar.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Checks against the patient's own medication history",
                  "Severity-ranked — only what matters interrupts you",
                  "Every alert is logged for clinical review",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={150}>
            {/* AI panel mockup */}
            <div className="rounded-2xl border bg-card p-4 shadow-xl">
              <div className="flex items-center justify-between border-b pb-3">
                <p className="text-sm font-bold">Dispense — Adaeze Nwosu</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  <Sparkles className="h-3 w-3" /> AI on
                </span>
              </div>
              <div className="space-y-2 py-3">
                {[
                  { name: "Artemether/Lumefantrine 20/120mg", qty: "×1", ok: true },
                  { name: "Paracetamol 500mg", qty: "×1", ok: true },
                  { name: "Ibuprofen 400mg", qty: "×1", ok: false },
                ].map((m) => (
                  <div
                    key={m.name}
                    className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${
                      m.ok ? "" : "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Pill className="h-4 w-4 text-primary" />
                      </span>
                      <p className="text-sm font-medium">{m.name}</p>
                    </div>
                    <span className="text-sm text-muted-foreground">{m.qty}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
                <p className="text-[11px] font-bold tracking-wide text-red-600">
                  ⚠ MAJOR — Ibuprofen × Lisinopril
                </p>
                <p className="mt-1 text-xs leading-relaxed text-red-700/90 dark:text-red-300">
                  Patient has active Lisinopril. NSAIDs can blunt its effect and
                  strain the kidneys. Consider paracetamol-only analgesia.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================== CTA =============================== */}
      <section className="px-4 pb-24 sm:px-6">
        <Reveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 text-primary-foreground/10"
              viewBox="0 0 200 200"
              fill="none"
            >
              <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="100" cy="100" r="85" stroke="currentColor" strokeWidth="1" />
              <circle cx="100" cy="100" r="99" stroke="currentColor" strokeWidth="0.5" />
            </svg>
            <Boxes className="mx-auto h-9 w-9 opacity-80" aria-hidden="true" />
            <h2 className="mx-auto mt-4 max-w-xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Move your pharmacy off paper this week
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-primary-foreground/85">
              Set up your inventory, receive your first batch, and send your
              first patient calendar — same afternoon.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link href="/register">
                  Create your pharmacy <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link href="/contact">Talk to us</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <MarketingFooter />
    </div>
  );
}